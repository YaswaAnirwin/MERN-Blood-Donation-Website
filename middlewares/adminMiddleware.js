const userModel = require("../models/userModel");

module.exports = async (req, res, next) => {
  try {
    const userId = req.body.userId;

    // Validate userId to ensure it's a valid string
    if (typeof userId !== "string" || userId.trim() === "") {
      return res.status(400).send({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Use $eq operator to prevent NoSQL injection
    const user = await userModel.findOne({ _id: { $eq: userId } });

    // Check admin
    if (user?.role !== "admin") {
      return res.status(401).send({
        success: false,
        message: "Auth Failed",
      });
    } else {
      next();
    }
  } catch (error) {
    console.error("Error in adminMiddleware:", error); // SECURITY FIX: Log error details
    return res.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};