const mongoose = require("mongoose");
const inventoryModel = require("../models/inventoryModel");
const userModel = require("../models/userModel");
const { Types } = require("mongoose");
const { validateObjectId, validateRequestBody } = require("../utils/validationUtils");

// CREATE INVENTORY
const createInventoryController = async (req, res) => {
  try {
    const { email, inventoryType, bloodGroup, quantity, userId } = req.body;

    // Input validation
    validateRequestBody(req.body, ["email", "inventoryType", "bloodGroup", "quantity", "userId"]);
    if (!["in", "out"].includes(inventoryType)) {
      return res.status(400).send({ success: false, message: "Invalid inventory type" });
    }
    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).send({ success: false, message: "Invalid userId format" });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).send({ success: false, message: "User Not Found" });
    }

    if (inventoryType === "out") {
      const organisation = new mongoose.Types.ObjectId(userId);

      // Calculate Blood Quantity
      const totalInOfRequestedBlood = await inventoryModel.aggregate([
        {
          $match: {
            organisation,
            inventoryType: "in",
            bloodGroup,
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
            bloodGroup,
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

      const availableQuantityOfBloodGroup = totalIn - totalOut;

      if (availableQuantityOfBloodGroup < quantity) {
        return res.status(400).send({
          success: false,
          message: `Only ${availableQuantityOfBloodGroup}ML of ${bloodGroup.toUpperCase()} is available`,
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

    // Input validation
    validateRequestBody(req.body, ["userId"]);
    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).send({ success: false, message: "Invalid userId format" });
    }

    const inventory = await inventoryModel
      .find({ organisation: userId })
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

    // Input validation
    if (typeof filters !== "object") {
      return res.status(400).send({ success: false, message: "Invalid filters format" });
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
    validateRequestBody(req.body, ["userId"]);
    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).send({ success: false, message: "Invalid userId format" });
    }

    const inventory = await inventoryModel
      .find({ organisation: userId })
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

    // Input validation
    validateRequestBody(req.body, ["userId"]);
    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).send({ success: false, message: "Invalid userId format" });
    }

    const donorId = await inventoryModel.distinct("donar", { organisation: userId });
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

// GET HOSPITAL RECORDS
const getHospitalController = async (req, res) => {
  try {
    const { userId } = req.body;

    // Input validation
    validateRequestBody(req.body, ["userId"]);
    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).send({ success: false, message: "Invalid userId format" });
    }

    const hospitalId = await inventoryModel.distinct("hospital", { organisation: userId });
    const hospitals = await userModel.find({ _id: { $in: hospitalId } });

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

// GET ORGANIZATION PROFILES
const getOrgnaisationController = async (req, res) => {
  try {
    const { userId } = req.body;

    // Input validation
    validateRequestBody(req.body, ["userId"]);
    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).send({ success: false, message: "Invalid userId format" });
    }

    const orgId = await inventoryModel.distinct("organisation", { donar: userId });
    const organisations = await userModel.find({ _id: { $in: orgId } });

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

// GET ORGANIZATION FOR HOSPITAL
const getOrgnaisationForHospitalController = async (req, res) => {
  try {
    const { userId } = req.body;

    // Input validation
    validateRequestBody(req.body, ["userId"]);
    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).send({ success: false, message: "Invalid userId format" });
    }

    const orgId = await inventoryModel.distinct("organisation", { hospital: userId });
    const organisations = await userModel.find({ _id: { $in: orgId } });

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