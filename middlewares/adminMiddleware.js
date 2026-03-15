const userModel = require("../models/userModel");

module.exports = async (req, res, next) => {
  try {
    // Validate and sanitize userId input
    const userId = req.body.userId;
    if (!userId || typeof userId !== "string") {
      return res.status(400).send({
        success: false,
        message: "Invalid userId",
      });
    }

    // Use $eq operator to prevent NoSQL injection
    const user = await userModel.findOne({ _id: { $eq: userId } });

    // Check admin role
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