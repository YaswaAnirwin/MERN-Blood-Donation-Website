const mongoose = require("mongoose");
const inventoryModel = require("../models/inventoryModel");
const userModel = require("../models/userModel");

// CREATE INVENTORY
const createInventoryController = async (req, res) => {
  try {
    const { email, inventoryType, bloodGroup, quantity, userId } = req.body;

    // Input validation
    if (!email || !inventoryType || !bloodGroup || !quantity || !userId) {
      return res.status(400).send({
        success: false,
        message: "All fields are required",
      });
    }

    // Validate user
    const user = await userModel.findOne({ email: { $eq: email } }); // SECURITY FIX: Use $eq operator to prevent NoSQL injection
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User Not Found",
      });
    }

    if (inventoryType === "out") {
      const requestedBloodGroup = bloodGroup;
      const requestedQuantityOfBlood = quantity;
      const organisation = new mongoose.Types.ObjectId(userId);

      // Calculate Blood Quantity
      const totalInOfRequestedBlood = await inventoryModel.aggregate([
        {
          $match: {
            organisation: { $eq: organisation }, // SECURITY FIX: Use $eq operator to prevent NoSQL injection
            inventoryType: "in",
            bloodGroup: { $eq: requestedBloodGroup }, // SECURITY FIX: Use $eq operator to prevent NoSQL injection
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
            organisation: { $eq: organisation }, // SECURITY FIX: Use $eq operator to prevent NoSQL injection
            inventoryType: "out",
            bloodGroup: { $eq: requestedBloodGroup }, // SECURITY FIX: Use $eq operator to prevent NoSQL injection
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

      // Calculate available quantity
      const availableQuanityOfBloodGroup = totalIn - totalOut;

      // Quantity validation
      if (availableQuanityOfBloodGroup < requestedQuantityOfBlood) {
        return res.status(400).send({
          success: false,
          message: `Only ${availableQuanityOfBloodGroup}ML of ${requestedBloodGroup.toUpperCase()} is available`,
        });
      }
      req.body.hospital = user._id;
    } else {
      req.body.donar = user._id;
    }

    // Save record
    const inventory = new inventoryModel(req.body);
    await inventory.save();
    return res.status(201).send({
      success: true,
      message: "New Blood Record Added",
    });
  } catch (error) {
    console.error(error); // SECURITY FIX: Log the error
    return res.status(500).send({
      success: false,
      message: "Error In Create Inventory API",
      error: error.message,
    });
  }
};

// GET ALL BLOOD RECORDS
const getInventoryController = async (req, res) => {
  try {
    const { userId } = req.body;

    // Input validation
    if (!userId) {
      return res.status(400).send({
        success: false,
        message: "User ID is required",
      });
    }

    const inventory = await inventoryModel
      .find({
        organisation: { $eq: userId }, // SECURITY FIX: Use $eq operator to prevent NoSQL injection
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
    console.error(error); // SECURITY FIX: Log the error
    return res.status(500).send({
      success: false,
      message: "Error In Get All Inventory",
      error: error.message,
    });
  }
};

// GET Hospital BLOOD RECORDS
const getInventoryHospitalController = async (req, res) => {
  try {
    const { filters } = req.body;

    // Input validation
    if (!filters || typeof filters !== "object") {
      return res.status(400).send({
        success: false,
        message: "Invalid filters",
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
    console.error(error); // SECURITY FIX: Log the error
    return res.status(500).send({
      success: false,
      message: "Error In Get Consumer Inventory",
      error: error.message,
    });
  }
};

// GET BLOOD RECORD OF 3
const getRecentInventoryController = async (req, res) => {
  try {
    const { userId } = req.body;

    // Input validation
    if (!userId) {
      return res.status(400).send({
        success: false,
        message: "User ID is required",
      });
    }

    const inventory = await inventoryModel
      .find({
        organisation: { $eq: userId }, // SECURITY FIX: Use $eq operator to prevent NoSQL injection
      })
      .limit(3)
      .sort({ createdAt: -1 });

    return res.status(200).send({
      success: true,
      message: "Recent Inventory Data",
      inventory,
    });
  } catch (error) {
    console.error(error); // SECURITY FIX: Log the error
    return res.status(500).send({
      success: false,
      message: "Error In Recent Inventory API",
      error: error.message,
    });
  }
};

// GET DONOR RECORDS
const getDonarsController = async (req, res) => {
  try {
    const { userId } = req.body;

    // Input validation
    if (!userId) {
      return res.status(400).send({
        success: false,
        message: "User ID is required",
      });
    }

    const organisation = userId;

    // Find donors
    const donorId = await inventoryModel.distinct("donar", {
      organisation: { $eq: organisation }, // SECURITY FIX: Use $eq operator to prevent NoSQL injection
    });

    const donars = await userModel.find({ _id: { $in: donorId } });

    return res.status(200).send({
      success: true,
      message: "Donor Record Fetched Successfully",
      donars,
    });
  } catch (error) {
    console.error(error); // SECURITY FIX: Log the error
    return res.status(500).send({
      success: false,
      message: "Error in Donor records",
      error: error.message,
    });
  }
};

const getHospitalController = async (req, res) => {
  try {
    const { userId } = req.body;

    // Input validation
    if (!userId) {
      return res.status(400).send({
        success: false,
        message: "User ID is required",
      });
    }

    const organisation = userId;

    // Get hospital IDs
    const hospitalId = await inventoryModel.distinct("hospital", {
      organisation: { $eq: organisation }, // SECURITY FIX: Use $eq operator to prevent NoSQL injection
    });

    // Find hospitals
    const hospitals = await userModel.find({
      _id: { $in: hospitalId },
    });

    return res.status(200).send({
      success: true,
      message: "Hospitals Data Fetched Successfully",
      hospitals,
    });
  } catch (error) {
    console.error(error); // SECURITY FIX: Log the error
    return res.status(500).send({
      success: false,
      message: "Error In Get Hospital API",
      error: error.message,
    });
  }
};

// GET ORG PROFILES
const getOrgnaisationController = async (req, res) => {
  try {
    const { userId } = req.body;

    // Input validation
    if (!userId) {
      return res.status(400).send({
        success: false,
        message: "User ID is required",
      });
    }

    const donar = userId;
    const orgId = await inventoryModel.distinct("organisation", {
      donar: { $eq: donar }, // SECURITY FIX: Use $eq operator to prevent NoSQL injection
    });

    // Find organisations
    const organisations = await userModel.find({
      _id: { $in: orgId },
    });

    return res.status(200).send({
      success: true,
      message: "Org Data Fetched Successfully",
      organisations,
    });
  } catch (error) {
    console.error(error); // SECURITY FIX: Log the error
    return res.status(500).send({
      success: false,
      message: "Error In ORG API",
      error: error.message,
    });
  }
};

// GET ORG for Hospital
const getOrgnaisationForHospitalController = async (req, res) => {
  try {
    const { userId } = req.body;

    // Input validation
    if (!userId) {
      return res.status(400).send({
        success: false,
        message: "User ID is required",
      });
    }

    const hospital = userId;
    const orgId = await inventoryModel.distinct("organisation", {
      hospital: { $eq: hospital }, // SECURITY FIX: Use $eq operator to prevent NoSQL injection
    });

    // Find organisations
    const organisations = await userModel.find({
      _id: { $in: orgId },
    });

    return res.status(200).send({
      success: true,
      message: "Hospital Org Data Fetched Successfully",
      organisations,
    });
  } catch (error) {
    console.error(error); // SECURITY FIX: Log the error
    return res.status(500).send({
      success: false,
      message: "Error In Hospital ORG API",
      error: error.message,
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