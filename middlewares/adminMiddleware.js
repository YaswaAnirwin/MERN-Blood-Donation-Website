const userModel = require("../models/userModel");

module.exports = async (req, res, next) => {
  try {
    const userId = req.body.userId;

    // Validate and sanitize user input
    if (typeof userId !== "string" || !userId.match(/^[a-fA-F0-9]{24}$/)) {
      return res.status(400).send({
        success: false,
        message: "Invalid user ID format",
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
    console.error("Error in adminMiddleware:", error); // SECURITY FIX: Log error with context
    return res.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};