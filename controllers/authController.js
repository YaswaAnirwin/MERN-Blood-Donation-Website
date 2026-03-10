const userModel = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const registerController = async (req, res) => {
  try {
    const email = req.body.email;
    if (typeof email !== "string") {
      return res.status(400).send({
        success: false,
        message: "Invalid email format",
      });
    }

    const exisitingUser = await userModel.findOne({ email: { $eq: email } }); // SECURITY FIX: Use $eq to prevent NoSQL injection
    //validation
    if (exisitingUser) {
      return res.status(200).send({
        success: false,
        message: "User Already exists",
      });
    }
    //hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    req.body.password = hashedPassword;
    //rest data
    const user = new userModel(req.body);
    await user.save();
    return res.status(201).send({
      success: true,
      message: "User Registered Successfully",
      user,
    });
  } catch (error) {
    console.error(error); // SECURITY FIX: Use console.error for better error logging
    res.status(500).send({
      success: false,
      message: "Error In Register API",
      error: error.message,
    });
  }
};

//login call back
const loginController = async (req, res) => {
  try {
    const email = req.body.email;
    if (typeof email !== "string") {
      return res.status(400).send({
        success: false,
        message: "Invalid email format",
      });
    }

    const user = await userModel.findOne({ email: { $eq: email } }); // SECURITY FIX: Use $eq to prevent NoSQL injection
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Invalid Credentials",
      });
    }
    //check role
    if (user.role !== req.body.role) {
      return res.status(403).send({
        success: false,
        message: "Role doesn't match",
      });
    }
    //compare password
    const comparePassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!comparePassword) {
      return res.status(401).send({
        success: false,
        message: "Invalid Credentials",
      });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    return res.status(200).send({
      success: true,
      message: "Login Successfully",
      token,
      user,
    });
  } catch (error) {
    console.error(error); // SECURITY FIX: Use console.error for better error logging
    res.status(500).send({
      success: false,
      message: "Error In Login API",
      error: error.message,
    });
  }
};

//GET CURRENT USER
const currentUserController = async (req, res) => {
  try {
    const userId = req.body.userId;
    if (typeof userId !== "string") {
      return res.status(400).send({
        success: false,
        message: "Invalid user ID format",
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
      message: "User Fetched Successfully",
      user,
    });
  } catch (error) {
    console.error(error); // SECURITY FIX: Use console.error for better error logging
    return res.status(500).send({
      success: false,
      message: "Unable to get current user",
      error: error.message,
    });
  }
};

module.exports = { registerController, loginController, currentUserController };