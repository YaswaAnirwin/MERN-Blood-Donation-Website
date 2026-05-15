const mongoose = require("mongoose");
const inventoryModel = require("../models/inventoryModel");
const userModel = require("../models/userModel");
const { Types } = require("mongoose");
const { validateObjectId, validateRequestBody } = require("../utils/validators");

// CREATE INVENTORY
const createInventoryController = async (req, res) => {
  try {
    const { email, inventoryType, bloodGroup, quantity, userId } = req.body;

    // Input validation
    const validationErrors = validateRequestBody(req.body, {
      email: "string",
      inventoryType: "string",
      bloodGroup: "string",
      quantity: "number",
      userId: "string",
    });
    if (validationErrors.length > 0) {
      return res.status(400).send({
        success: false,
        message: "Invalid input data",
        errors: validationErrors,
      });
    }

    if (!validateObjectId(userId)) {
      return res.status(400).send({
        success: false,
        message: "Invalid userId format",
      });
    }

    // Validation
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User Not Found",
      });
    }

    if (inventoryType === "out") {
      const requestedBloodGroup = bloodGroup;
      const requestedQuantityOfBlood = quantity;
      const organisation = new Types.ObjectId(userId);

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
      const availableQuantityOfBloodGroup = totalIn - totalOut;

      // Quantity validation
      if (availableQuantityOfBloodGroup < requestedQuantityOfBlood) {
        return res.status(400).send({
          success: false,
          message: `Only ${availableQuantityOfBloodGroup}ML of ${requestedBloodGroup.toUpperCase()} is available`,
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
      error,
    });
  }
};

// GET ALL BLOOD RECORDS
const getInventoryController = async (req, res) => {
  try {
    const { userId } = req.body;

    // Validate userId
    if (!validateObjectId(userId)) {
      return res.status(400).send({
        success: false,
        message: "Invalid userId format",
      });
    }

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
      error,
    });
  }
};

// GET Hospital BLOOD RECORDS
const getInventoryHospitalController = async (req, res) => {
  try {
    const { filters } = req.body;

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
      message: "Error In Get consumer Inventory",
      error,
    });
  }
};

// GET BLOOD RECORD OF 3
const getRecentInventoryController = async (req, res) => {
  try {
    const { userId } = req.body;

    // Validate userId
    if (!validateObjectId(userId)) {
      return res.status(400).send({
        success: false,
        message: "Invalid userId format",
      });
    }

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
      error,
    });
  }
};

// GET DONOR RECORDS
const getDonarsController = async (req, res) => {
  try {
    const { userId } = req.body;

    // Validate userId
    if (!validateObjectId(userId)) {
      return res.status(400).send({
        success: false,
        message: "Invalid userId format",
      });
    }

    const organisation = userId;
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
      error,
    });
  }
};

const getHospitalController = async (req, res) => {
  try {
    const { userId } = req.body;

    // Validate userId
    if (!validateObjectId(userId)) {
      return res.status(400).send({
        success: false,
        message: "Invalid userId format",
      });
    }

    const organisation = userId;
    const hospitalId = await inventoryModel.distinct("hospital", {
      organisation,
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
    console.error(error);
    return res.status(500).send({
      success: false,
      message: "Error In get Hospital API",
      error,
    });
  }
};

// GET ORG PROFILES
const getOrgnaisationController = async (req, res) => {
  try {
    const { userId } = req.body;

    // Validate userId
    if (!validateObjectId(userId)) {
      return res.status(400).send({
        success: false,
        message: "Invalid userId format",
      });
    }

    const donar = userId;
    const orgId = await inventoryModel.distinct("organisation", { donar });
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
      error,
    });
  }
};

// GET ORG for Hospital
const getOrgnaisationForHospitalController = async (req, res) => {
  try {
    const { userId } = req.body;

    // Validate userId
    if (!validateObjectId(userId)) {
      return res.status(400).send({
        success: false,
        message: "Invalid userId format",
      });
    }

    const hospital = userId;
    const orgId = await inventoryModel.distinct("organisation", { hospital });
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