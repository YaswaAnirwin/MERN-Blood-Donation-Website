const mongoose = require("mongoose");
const inventoryModel = require("../models/inventoryModel");
const userModel = require("../models/userModel");
const { isValidObjectId } = mongoose; // SECURITY: Import for ObjectId validation

// Helper function to validate ObjectId
const validateObjectId = (id) => {
  if (!isValidObjectId(id)) {
    throw new Error("Invalid ObjectId");
  }
};

// CREATE INVENTORY
const createInventoryController = async (req, res) => {
  try {
    const { email, userId, inventoryType, bloodGroup, quantity } = req.body;

    // Validate userId
    validateObjectId(userId); // SECURITY: Validate userId as ObjectId

    // Validation
    const user = await userModel.findOne({ email });
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
            organisation,
            inventoryType: "in",
            bloodGroup: requestedBloodGroup,
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
            organisation,
            inventoryType: "out",
            bloodGroup: requestedBloodGroup,
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

      // In & Out Calculation
      const availableQuanityOfBloodGroup = totalIn - totalOut;

      // Quantity validation
      if (availableQuanityOfBloodGroup < requestedQuantityOfBlood) {
        return res.status(400).send({
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
    console.error(error);
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

    // Validate userId
    validateObjectId(userId); // SECURITY: Validate userId as ObjectId

    const inventory = await inventoryModel
      .find({
        organisation: userId,
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
    console.error(error);
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

    // Validate filters
    if (typeof filters !== "object") {
      return res.status(400).send({
        success: false,
        message: "Invalid filters format",
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
    console.error(error);
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

    // Validate userId
    validateObjectId(userId); // SECURITY: Validate userId as ObjectId

    const inventory = await inventoryModel
      .find({
        organisation: userId,
      })
      .limit(3)
      .sort({ createdAt: -1 });
    return res.status(200).send({
      success: true,
      message: "Recent Inventory Data",
      inventory,
    });
  } catch (error) {
    console.error(error);
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

    // Validate userId
    validateObjectId(userId); // SECURITY: Validate userId as ObjectId

    const organisation = userId;

    // Find donors
    const donorId = await inventoryModel.distinct("donar", {
      organisation,
    });
    const donars = await userModel.find({ _id: { $in: donorId } });

    return res.status(200).send({
      success: true,
      message: "Donor Record Fetched Successfully",
      donars,
    });
  } catch (error) {
    console.error(error);
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

    // Validate userId
    validateObjectId(userId); // SECURITY: Validate userId as ObjectId

    const organisation = userId;

    // Get hospital IDs
    const hospitalId = await inventoryModel.distinct("hospital", {
      organisation,
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
    console.error(error);
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

    // Validate userId
    validateObjectId(userId); // SECURITY: Validate userId as ObjectId

    const donar = userId;
    const orgId = await inventoryModel.distinct("organisation", { donar });

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
    console.error(error);
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

    // Validate userId
    validateObjectId(userId); // SECURITY: Validate userId as ObjectId

    const hospital = userId;
    const orgId = await inventoryModel.distinct("organisation", { hospital });

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
    console.error(error);
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