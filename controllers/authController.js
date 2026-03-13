const userModel = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const registerController = async (req, res) => {
  try {
    const { email, password, ...rest } = req.body;

    if (!email || !password) {
      return res.status(400).send({
        success: false,
        message: "Email and password are required",
      });
    }

    const existingUser = await userModel.findOne({ email: { $eq: email } }); // SECURITY FIX: Use $eq operator to prevent NoSQL injection
    if (existingUser) {
      return res.status(200).send({
        success: false,
        message: "User already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new userModel({ email, password: hashedPassword, ...rest });
    await user.save();

    return res.status(201).send({
      success: true,
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    console.error(error); // SECURITY FIX: Log the error
    res.status(500).send({
      success: false,
      message: "Error in Register API",
      error: error.message, // SECURITY FIX: Return only the error message
    });
  }
};

const loginController = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).send({
        success: false,
        message: "Email, password, and role are required",
      });
    }

    const user = await userModel.findOne({ email: { $eq: email } }); // SECURITY FIX: Use $eq operator to prevent NoSQL injection
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (user.role !== role) {
      return res.status(403).send({
        success: false,
        message: "Role doesn't match",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).send({
        success: false,
        message: "Invalid credentials",
      });
    }

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
    console.error(error); // SECURITY FIX: Log the error
    res.status(500).send({
      success: false,
      message: "Error in Login API",
      error: error.message, // SECURITY FIX: Return only the error message
    });
  }
};

const currentUserController = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).send({
        success: false,
        message: "User ID is required",
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
    console.error(error); // SECURITY FIX: Log the error
    return res.status(500).send({
      success: false,
      message: "Unable to get current user",
      error: error.message, // SECURITY FIX: Return only the error message
    });
  }
};

module.exports = { registerController, loginController, currentUserController };