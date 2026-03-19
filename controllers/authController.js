const userModel = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const registerController = async (req, res) => {
  try {
    const email = req.body.email;
    const exisitingUser = await userModel.findOne({ email: { $eq: email } }); // SECURITY FIX: Use $eq operator to prevent NoSQL injection
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
      error: error.message, // SECURITY FIX: Return only the error message to avoid exposing sensitive data
    });
  }
};

//login call back
const loginController = async (req, res) => {
  try {
    const email = req.body.email;
    const user = await userModel.findOne({ email: { $eq: email } }); // SECURITY FIX: Use $eq operator to prevent NoSQL injection
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Invalid Credentials",
      });
    }
    //check role
    const role = req.body.role;
    if (user.role !== role) {
      return res.status(403).send({ // SECURITY FIX: Use 403 Forbidden for role mismatch
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
      return res.status(401).send({ // SECURITY FIX: Use 401 Unauthorized for invalid credentials
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
      error: error.message, // SECURITY FIX: Return only the error message to avoid exposing sensitive data
    });
  }
};

//GET CURRENT USER
const currentUserController = async (req, res) => {
  try {
    const userId = req.body.userId;
    const user = await userModel.findOne({ _id: { $eq: userId } }); // SECURITY FIX: Use $eq operator to prevent NoSQL injection
    if (!user) {
      return res.status(404).send({ // SECURITY FIX: Handle case where user is not found
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
      error: error.message, // SECURITY FIX: Return only the error message to avoid exposing sensitive data
    });
  }
};

module.exports = { registerController, loginController, currentUserController };