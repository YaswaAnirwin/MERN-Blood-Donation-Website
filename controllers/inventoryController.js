const mongoose = require("mongoose");
const inventoryModel = require("../models/inventoryModel");
const userModel = require("../models/userModel");

// CREATE INVENTORY
const createInventoryController = async (req, res) => {
  try {
    const { email, inventoryType, bloodGroup, quantity, userId } = req.body;

    // Validate input
    if (!email || !inventoryType || !bloodGroup || !quantity || !userId) {
      return res.status(400).send({
        success: false,
        message: "Invalid input data",
      });
    }

    // Find user by email
    const user = await userModel.findOne({ email: { $eq: email } }); // SECURITY FIX: Use $eq operator for NoSQL injection prevention
    if (!user) {
      throw new Error("User Not Found");
    }

    if (inventoryType === "out") {
      const requestedBloodGroup = bloodGroup;
      const requestedQuantityOfBlood = quantity;
      const organisation = new mongoose.Types.ObjectId(userId);

      // Calculate Blood Quantity
      const totalInOfRequestedBlood = await inventoryModel.aggregate([
        {
          $match: {
            organisation: { $eq: organisation }, // SECURITY FIX: Use $eq operator for NoSQL injection prevention
            inventoryType: "in",
            bloodGroup: { $eq: requestedBloodGroup }, // SECURITY FIX: Use $eq operator for NoSQL injection prevention
          },
        },
        {
          $group: {
            _id: "$bloodGroup",
            total: { $sum: "$quantity" },
          },
        },
      ]);
      const totalIn = totalInOfRequestedBlood[0]?.total || 0;

      const totalOutOfRequestedBloodGroup = await inventoryModel.aggregate([
        {
          $match: {
            organisation: { $eq: organisation }, // SECURITY FIX: Use $eq operator for NoSQL injection prevention
            inventoryType: "out",
            bloodGroup: { $eq: requestedBloodGroup }, // SECURITY FIX: Use $eq operator for NoSQL injection prevention
          },
        },
        {
          $group: {
            _id: "$bloodGroup",
            total: { $sum: "$quantity" },
          },
        },
      ]);
      const totalOut = totalOutOfRequestedBloodGroup[0]?.total || 0;

      const availableQuanityOfBloodGroup = totalIn - totalOut;

      // Quantity validation
      if (availableQuanityOfBloodGroup < requestedQuantityOfBlood) {
        return res.status(500).send({
          success: false,
          message: `Only ${availableQuanityOfBloodGroup}ML of ${requestedBloodGroup.toUpperCase()} is available`,
        });
      }
      req.body.hospital = user?._id;
    } else {
      req.body.donar = user?._id;
    }

    // Save record
    const inventory = new inventoryModel(req.body);
    await inventory.save();
    return res.status(201).send({
      success: true,
      message: "New Blood Record Added",
    });
  } catch (error) {
    console.error(error); // SECURITY FIX: Log error instead of silent failure
    return res.status(500).send({
      success: false,
      message: "Error In Create Inventory API",
      error: error.message, // SECURITY FIX: Return error message for debugging
    });
  }
};

// GET ALL BLOOD RECORDS
const getInventoryController = async (req, res) => {
  try {
    const { userId } = req.body;

    // Validate input
    if (!userId) {
      return res.status(400).send({
        success: false,
        message: "Invalid input data",
      });
    }

    const inventory = await inventoryModel
      .find({
        organisation: { $eq: userId }, // SECURITY FIX: Use $eq operator for NoSQL injection prevention
      })
      .populate("donar")
      .populate("hospital")
      .sort({ createdAt: -1 });
    return res.status(200).send({
      success: true,
      message: "Get all records successfully",
      inventory,
    });
  } catch (error) {
    console.error(error); // SECURITY FIX: Log error instead of silent failure
    return res.status(500).send({
      success: false,
      message: "Error In Get All Inventory",
      error: error.message, // SECURITY FIX: Return error message for debugging
    });
  }
};

// GET Hospital BLOOD RECORDS
const getInventoryHospitalController = async (req, res) => {
  try {
    const { filters } = req.body;

    // Validate input
    if (!filters || typeof filters !== "object") {
      return res.status(400).send({
        success: false,
        message: "Invalid input data",
      });
    }

    const inventory = await inventoryModel
      .find(filters)
      .populate("donar")
      .populate("hospital")
      .populate("organisation")
      .sort({ createdAt: -1 });
    return res.status(200).send({
      success: true,
      message: "Get hospital consumer records successfully",
      inventory,
    });
  } catch (error) {
    console.error(error); // SECURITY FIX: Log error instead of silent failure
    return res.status(500).send({
      success: false,
      message: "Error In Get Consumer Inventory",
      error: error.message, // SECURITY FIX: Return error message for debugging
    });
  }
};

// GET BLOOD RECORD OF 3
const getRecentInventoryController = async (req, res) => {
  try {
    const { userId } = req.body;

    // Validate input
    if (!userId) {
      return res.status(400).send({
        success: false,
        message: "Invalid input data",
      });
    }

    const inventory = await inventoryModel
      .find({
        organisation: { $eq: userId }, // SECURITY FIX: Use $eq operator for NoSQL injection prevention
      })
      .limit(3)
      .sort({ createdAt: -1 });
    return res.status(200).send({
      success: true,
      message: "Recent Inventory Data",
      inventory,
    });
  } catch (error) {
    console.error(error); // SECURITY FIX: Log error instead of silent failure
    return res.status(500).send({
      success: false,
      message: "Error In Recent Inventory API",
      error: error.message, // SECURITY FIX: Return error message for debugging
    });
  }
};

// GET DONOR RECORDS
const getDonarsController = async (req, res) => {
  try {
    const { userId } = req.body;

    // Validate input
    if (!userId) {
      return res.status(400).send({
        success: false,
        message: "Invalid input data",
      });
    }

    const donorId = await inventoryModel.distinct("donar", {
      organisation: { $eq: userId }, // SECURITY FIX: Use $eq operator for NoSQL injection prevention
    });
    const donars = await userModel.find({ _id: { $in: donorId } });
    return res.status(200).send({
      success: true,
      message: "Donor Record Fetched Successfully",
      donars,
    });
  } catch (error) {
    console.error(error); // SECURITY FIX: Log error instead of silent failure
    return res.status(500).send({
      success: false,
      message: "Error in Donor records",
      error: error.message, // SECURITY FIX: Return error message for debugging
    });
  }
};

// GET HOSPITAL RECORDS
const getHospitalController = async (req, res) => {
  try {
    const { userId } = req.body;

    // Validate input
    if (!userId) {
      return res.status(400).send({
        success: false,
        message: "Invalid input data",
      });
    }

    const hospitalId = await inventoryModel.distinct("hospital", {
      organisation: { $eq: userId }, // SECURITY FIX: Use $eq operator for NoSQL injection prevention
    });
    const hospitals = await userModel.find({ _id: { $in: hospitalId } });
    return res.status(200).send({
      success: true,
      message: "Hospitals Data Fetched Successfully",
      hospitals,
    });
  } catch (error) {
    console.error(error); // SECURITY FIX: Log error instead of silent failure
    return res.status(500).send({
      success: false,
      message: "Error In Get Hospital API",
      error: error.message, // SECURITY FIX: Return error message for debugging
    });
  }
};

// GET ORGANISATION PROFILES
const getOrgnaisationController = async (req, res) => {
  try {
    const { userId } = req.body;

    // Validate input
    if (!userId) {
      return res.status(400).send({
        success: false,
        message: "Invalid input data",
      });
    }

    const orgId = await inventoryModel.distinct("organisation", {
      donar: { $eq: userId }, // SECURITY FIX: Use $eq operator for NoSQL injection prevention
    });
    const organisations = await userModel.find({ _id: { $in: orgId } });
    return res.status(200).send({
      success: true,
      message: "Organisation Data Fetched Successfully",
      organisations,
    });
  } catch (error) {
    console.error(error); // SECURITY FIX: Log error instead of silent failure
    return res.status(500).send({
      success: false,
      message: "Error In Organisation API",
      error: error.message, // SECURITY FIX: Return error message for debugging
    });
  }
};

// GET ORGANISATION FOR HOSPITAL
const getOrgnaisationForHospitalController = async (req, res) => {
  try {
    const { userId } = req.body;

    // Validate input
    if (!userId) {
      return res.status(400).send({
        success: false,
        message: "Invalid input data",
      });
    }

    const orgId = await inventoryModel.distinct("organisation", {
      hospital: { $eq: userId }, // SECURITY FIX: Use $eq operator for NoSQL injection prevention
    });
    const organisations = await userModel.find({ _id: { $in: orgId } });
    return res.status(200).send({
      success: true,
      message: "Hospital Organisation Data Fetched Successfully",
      organisations,
    });
  } catch (error) {
    console.error(error); // SECURITY FIX: Log error instead of silent failure
    return res.status(500).send({
      success: false,
      message: "Error In Hospital Organisation API",
      error: error.message, // SECURITY FIX: Return error message for debugging
    });
  }
};

module.exports = {
  createInventoryController,
  getInventoryController,
  getDonarsController,
  getHospitalController,
  getOrgnaisationController,
  getOrgnaisationForHospitalController,
  getInventoryHospitalController,
  getRecentInventoryController,
};