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
        message: "Missing required fields",
      });
    }

    const user = await userModel.findOne({ email: { $eq: email } }); // SECURITY FIX: Use $eq operator for user input
    if (!user) {
      throw new Error("User Not Found");
    }

    if (inventoryType === "out") {
      const organisation = new mongoose.Types.ObjectId(userId);

      // Calculate Blood Quantity
      const totalInOfRequestedBlood = await inventoryModel.aggregate([
        {
          $match: {
            organisation: { $eq: organisation }, // SECURITY FIX: Use $eq operator for user input
            inventoryType: "in",
            bloodGroup: { $eq: bloodGroup }, // SECURITY FIX: Use $eq operator for user input
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
            organisation: { $eq: organisation }, // SECURITY FIX: Use $eq operator for user input
            inventoryType: "out",
            bloodGroup: { $eq: bloodGroup }, // SECURITY FIX: Use $eq operator for user input
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

      if (availableQuanityOfBloodGroup < quantity) {
        return res.status(500).send({
          success: false,
          message: `Only ${availableQuanityOfBloodGroup}ML of ${bloodGroup.toUpperCase()} is available`,
        });
      }

      req.body.hospital = user?._id;
    } else {
      req.body.donar = user?._id;
    }

    const inventory = new inventoryModel(req.body);
    await inventory.save();
    return res.status(201).send({
      success: true,
      message: "New Blood Record Added",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error In Create Inventory API",
      error,
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
        message: "Missing userId",
      });
    }

    const inventory = await inventoryModel
      .find({
        organisation: { $eq: userId }, // SECURITY FIX: Use $eq operator for user input
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
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error In Get All Inventory",
      error,
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
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error In Get consumer Inventory",
      error,
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
        message: "Missing userId",
      });
    }

    const inventory = await inventoryModel
      .find({
        organisation: { $eq: userId }, // SECURITY FIX: Use $eq operator for user input
      })
      .limit(3)
      .sort({ createdAt: -1 });

    return res.status(200).send({
      success: true,
      message: "Recent Inventory Data",
      inventory,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error In Recent Inventory API",
      error,
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
        message: "Missing userId",
      });
    }

    const donorId = await inventoryModel.distinct("donar", {
      organisation: { $eq: userId }, // SECURITY FIX: Use $eq operator for user input
    });

    const donars = await userModel.find({ _id: { $in: donorId } });

    return res.status(200).send({
      success: true,
      message: "Donor Record Fetched Successfully",
      donars,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in Donor records",
      error,
    });
  }
};

// GET HOSPITAL RECORDS
const getHospitalController = async (req, res) => {
  try {
    const { userId } = req.body;

    // Input validation
    if (!userId) {
      return res.status(400).send({
        success: false,
        message: "Missing userId",
      });
    }

    const hospitalId = await inventoryModel.distinct("hospital", {
      organisation: { $eq: userId }, // SECURITY FIX: Use $eq operator for user input
    });

    const hospitals = await userModel.find({
      _id: { $in: hospitalId },
    });

    return res.status(200).send({
      success: true,
      message: "Hospitals Data Fetched Successfully",
      hospitals,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error In Get Hospital API",
      error,
    });
  }
};

// GET ORGANISATION PROFILES
const getOrgnaisationController = async (req, res) => {
  try {
    const { userId } = req.body;

    // Input validation
    if (!userId) {
      return res.status(400).send({
        success: false,
        message: "Missing userId",
      });
    }

    const orgId = await inventoryModel.distinct("organisation", {
      donar: { $eq: userId }, // SECURITY FIX: Use $eq operator for user input
    });

    const organisations = await userModel.find({
      _id: { $in: orgId },
    });

    return res.status(200).send({
      success: true,
      message: "Organisation Data Fetched Successfully",
      organisations,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error In Organisation API",
      error,
    });
  }
};

// GET ORGANISATION FOR HOSPITAL
const getOrgnaisationForHospitalController = async (req, res) => {
  try {
    const { userId } = req.body;

    // Input validation
    if (!userId) {
      return res.status(400).send({
        success: false,
        message: "Missing userId",
      });
    }

    const orgId = await inventoryModel.distinct("organisation", {
      hospital: { $eq: userId }, // SECURITY FIX: Use $eq operator for user input
    });

    const organisations = await userModel.find({
      _id: { $in: orgId },
    });

    return res.status(200).send({
      success: true,
      message: "Hospital Organisation Data Fetched Successfully",
      organisations,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error In Hospital Organisation API",
      error,
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