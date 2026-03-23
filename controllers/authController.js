const userModel = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const registerController = async (req, res) => {
  try {
    const { email, password, ...otherData } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).send({
        success: false,
        message: "Email and password are required",
      });
    }

    const exisitingUser = await userModel.findOne({ email: { $eq: email } }); // SECURITY FIX: Use $eq to prevent NoSQL injection
    if (exisitingUser) {
      return res.status(409).send({
        success: false,
        message: "User already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new userModel({ email, password: hashedPassword, ...otherData });
    await user.save();

    return res.status(201).send({
      success: true,
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    console.error("Error in registerController:", error); // SECURITY FIX: Log error for debugging
    res.status(500).send({
      success: false,
      message: "Error in Register API",
      error: error.message, // SECURITY FIX: Avoid exposing sensitive error details
    });
  }
};

// Login controller
const loginController = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Input validation
    if (!email || !password || !role) {
      return res.status(400).send({
        success: false,
        message: "Email, password, and role are required",
      });
    }

    const user = await userModel.findOne({ email: { $eq: email } }); // SECURITY FIX: Use $eq to prevent NoSQL injection
    if (!user) {
      return res.status(401).send({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check role
    if (user.role !== role) {
      return res.status(403).send({
        success: false,
        message: "Role doesn't match",
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).send({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.status(200).send({
      success: true,
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    console.error("Error in loginController:", error); // SECURITY FIX: Log error for debugging
    res.status(500).send({
      success: false,
      message: "Error in Login API",
      error: error.message, // SECURITY FIX: Avoid exposing sensitive error details
    });
  }
};

// Get current user
const currentUserController = async (req, res) => {
  try {
    const { userId } = req.body;

    // Input validation
    if (!userId) {
      return res.status(400).send({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await userModel.findOne({ _id: { $eq: userId } }); // SECURITY FIX: Use $eq to prevent NoSQL injection
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).send({
      success: true,
      message: "User fetched successfully",
      user,
    });
  } catch (error) {
    console.error("Error in currentUserController:", error); // SECURITY FIX: Log error for debugging
    return res.status(500).send({
      success: false,
      message: "Unable to get current user",
      error: error.message, // SECURITY FIX: Avoid exposing sensitive error details
    });
  }
};

module.exports = { registerController, loginController, currentUserController };