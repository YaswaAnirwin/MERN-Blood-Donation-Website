const userModel = require("../models/userModel");

module.exports = async (req, res, next) => {
  try {
    const userId = req.body.userId;

    // Validate that userId is a string to prevent NoSQL injection
    if (typeof userId !== "string") {
      return res.status(400).send({
        success: false,
        message: "Invalid user ID format",
      });
    }

    // Use $eq operator to prevent NoSQL injection
    const user = await userModel.findOne({ _id: { $eq: userId } });

    // Check if user exists and is an admin
    if (!user || user.role !== "admin") {
      return res.status(401).send({
        success: false,
        message: "Auth Failed",
      });
    }

    next();
  } catch (error) {
    console.error("Error in adminMiddleware:", error); // SECURITY FIX: Log the error for debugging
    return res.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};