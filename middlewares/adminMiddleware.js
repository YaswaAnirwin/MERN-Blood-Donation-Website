const userModel = require("../models/userModel");

module.exports = async (req, res, next) => {
  try {
    const userId = req.body.userId;

    // Validate userId to prevent NoSQL injection
    if (typeof userId !== "string" || !userId.match(/^[a-fA-F0-9]{24}$/)) {
      return res.status(400).send({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const user = await userModel.findById({ _id: { $eq: userId } }); // SECURITY FIX: Use $eq operator to prevent NoSQL injection

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