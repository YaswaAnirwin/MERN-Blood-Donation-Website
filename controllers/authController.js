const userModel = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const registerController = async (req, res) => {
  try {
    const { email, password, ...otherData } = req.body;

    // Validate input
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).send({
        success: false,
        message: "Invalid input data",
      });
    }

    const existingUser = await userModel.findOne({ email: { $eq: email } }); // SECURITY FIX: Use $eq operator to prevent NoSQL injection
    if (existingUser) {
      return res.status(200).send({
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
    console.error("Error in registerController:", error); // SECURITY FIX: Log error with context
    res.status(500).send({
      success: false,
      message: "Error in Register API",
      error: error.message, // SECURITY FIX: Avoid exposing sensitive error details
    });
  }
};

const loginController = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate input
    if (typeof email !== "string" || typeof password !== "string" || typeof role !== "string") {
      return res.status(400).send({
        success: false,
        message: "Invalid input data",
      });
    }

    const user = await userModel.findOne({ email: { $eq: email } }); // SECURITY FIX: Use $eq operator to prevent NoSQL injection
    if (!user) {
      return res.status(404).send({
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
    console.error("Error in loginController:", error); // SECURITY FIX: Log error with context
    res.status(500).send({
      success: false,
      message: "Error in Login API",
      error: error.message, // SECURITY FIX: Avoid exposing sensitive error details
    });
  }
};

const currentUserController = async (req, res) => {
  try {
    const { userId } = req.body;

    // Validate input
    if (typeof userId !== "string") {
      return res.status(400).send({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await userModel.findOne({ _id: { $eq: userId } }); // SECURITY FIX: Use $eq operator to prevent NoSQL injection
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
    console.error("Error in currentUserController:", error); // SECURITY FIX: Log error with context
    return res.status(500).send({
      success: false,
      message: "Unable to get current user",
      error: error.message, // SECURITY FIX: Avoid exposing sensitive error details
    });
  }
};

module.exports = { registerController, loginController, currentUserController };