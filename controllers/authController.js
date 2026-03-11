const userModel = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const registerController = async (req, res) => {
  console.log(req.body);
  try {
    console.log(req.body.email);
    const exisitingUser = await userModel.findOne({ email: { $eq: req.body.email } }); // SECURITY FIX: Use $eq operator to prevent NoSQL injection
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
    console.log(req.body);
    return res.status(201).send({
      success: true,
      message: "User Registered Successfully",
      user,
    });
  } catch (error) {
    console.error(error); // SECURITY FIX: Use console.error for better error visibility
    res.status(500).send({
      success: false,
      message: "Error In Register API",
      error,
    });
  }
};

//login call back
const loginController = async (req, res) => {
  try {
    const user = await userModel.findOne({ email: { $eq: req.body.email } }); // SECURITY FIX: Use $eq operator to prevent NoSQL injection
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Invalid Credentials",
      });
    }
    //check role
    if (user.role !== req.body.role) {
      return res.status(500).send({
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
      return res.status(500).send({
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
    console.error(error); // SECURITY FIX: Use console.error for better error visibility
    res.status(500).send({
      success: false,
      message: "Error In Login API",
      error,
    });
  }
};

//GET CURRENT USER
const currentUserController = async (req, res) => {
  try {
    const user = await userModel.findOne({ _id: { $eq: req.body.userId } }); // SECURITY FIX: Use $eq operator to prevent NoSQL injection
    return res.status(200).send({
      success: true,
      message: "User Fetched Successfully",
      user,
    });
  } catch (error) {
    console.error(error); // SECURITY FIX: Use console.error for better error visibility
    return res.status(500).send({
      success: false,
      message: "Unable to get current user",
      error,
    });
  }
};

module.exports = { registerController, loginController, currentUserController };