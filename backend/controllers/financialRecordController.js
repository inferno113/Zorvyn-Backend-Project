const FinancialRecord = require("../models/FinancialRecord");
const User = require("../models/User");
const mongoose = require("mongoose");

const allowedTypes = ["income", "expense"];

const createRecord = async (req, res) => {
  try {
    const { amount, type, category, date, note, userId } = req.body;

    if (
      amount === undefined ||
      !type ||
      !category ||
      !date ||
      !userId
    ) {
      return res
        .status(400)
        .json({ error: "amount, type, category, date, and userId are required" });
    }

    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: "amount must be a positive number" });
    }

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: "Invalid type value" });
    }

    if (Number.isNaN(new Date(date).getTime())) {
      return res.status(400).json({ error: "Invalid date value" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
      return res.status(404).json({ error: "User not found" });
    }

    const record = new FinancialRecord({
      amount,
      type,
      category,
      date,
      note,
      userId,
    });

    await record.save();
    res.status(201).json(record);
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: error.message });
  }
};

const getRecords = async (req, res) => {
  try {
    const {
      userId,
      type,
      category,
      startDate,
      endDate,
      page = "1",
      limit = "10",
      sortBy = "date",
      order = "desc",
    } = req.query;
    const filter = {};

    const pageNumber = Number.parseInt(page, 10);
    const limitNumber = Number.parseInt(limit, 10);

    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
      return res.status(400).json({ error: "page must be a positive integer" });
    }

    if (!Number.isInteger(limitNumber) || limitNumber < 1 || limitNumber > 100) {
      return res.status(400).json({ error: "limit must be an integer between 1 and 100" });
    }

    const allowedSortFields = ["date", "amount", "category", "type", "createdAt", "updatedAt"];
    if (!allowedSortFields.includes(sortBy)) {
      return res.status(400).json({ error: "Invalid sortBy field" });
    }

    if (order !== "asc" && order !== "desc") {
      return res.status(400).json({ error: "order must be asc or desc" });
    }

    if (req.userRole === "admin") {
      if (userId) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
          return res.status(400).json({ error: "Invalid userId filter" });
        }

        const userExists = await User.exists({ _id: userId });
        if (!userExists) {
          return res.status(404).json({ error: "User not found" });
        }

        filter.userId = userId;
      }
    } else {
      if (!req.userId) {
        return res.status(400).json({
          error: "x-user-id header is required for viewer and analyst",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(req.userId)) {
        return res.status(400).json({ error: "Invalid x-user-id header" });
      }

      const requesterExists = await User.exists({ _id: req.userId });
      if (!requesterExists) {
        return res.status(404).json({ error: "Requester user not found" });
      }

      filter.userId = req.userId;
    }

    if (type) {
      if (!allowedTypes.includes(type)) {
        return res.status(400).json({ error: "Invalid type filter" });
      }

      filter.type = type;
    }

    if (category) {
      filter.category = category;
    }

    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if ((start && Number.isNaN(start.getTime())) || (end && Number.isNaN(end.getTime()))) {
        return res.status(400).json({ error: "Invalid date filter" });
      }

      filter.date = {};

      if (startDate) {
        filter.date.$gte = start;
      }

      if (endDate) {
        filter.date.$lte = end;
      }
    }

    const skip = (pageNumber - 1) * limitNumber;
    const sortOrder = order === "asc" ? 1 : -1;

    const [records, totalItems] = await Promise.all([
      FinancialRecord.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limitNumber),
      FinancialRecord.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalItems / limitNumber);

    res.status(200).json({
      data: records,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, type, category, date, note, userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid record id" });
    }

    const updateData = {};

    if (amount !== undefined) {
      if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ error: "amount must be a positive number" });
      }
      updateData.amount = amount;
    }

    if (type !== undefined) {
      if (!allowedTypes.includes(type)) {
        return res.status(400).json({ error: "Invalid type value" });
      }
      updateData.type = type;
    }

    if (category !== undefined) {
      updateData.category = category;
    }

    if (date !== undefined) {
      if (Number.isNaN(new Date(date).getTime())) {
        return res.status(400).json({ error: "Invalid date value" });
      }
      updateData.date = date;
    }

    if (note !== undefined) {
      updateData.note = note;
    }

    if (userId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid userId" });
      }

      const userExists = await User.exists({ _id: userId });
      if (!userExists) {
        return res.status(404).json({ error: "User not found" });
      }

      updateData.userId = userId;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No fields provided for update" });
    }

    const updatedRecord = await FinancialRecord.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.status(200).json(updatedRecord);
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: error.message });
  }
};

const deleteRecord = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid record id" });
    }

    const deletedRecord = await FinancialRecord.findByIdAndDelete(id);

    if (!deletedRecord) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.status(200).json({ message: "Record deleted successfully" });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ error: "Invalid record id" });
    }

    res.status(500).json({ error: error.message });
  }
};

module.exports = { createRecord, getRecords, updateRecord, deleteRecord };
