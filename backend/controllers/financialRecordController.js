const FinancialRecord = require("../models/FinancialRecord");

const createRecord = async (req, res) => {
  try {
    const { amount, type, category, date, note, userId } = req.body;

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
    res.status(500).json({ error: error.message });
  }
};

const getRecords = async (req, res) => {
  try {
    const { type, category, startDate, endDate } = req.query;
    const filter = {};

    if (type) {
      filter.type = type;
    }

    if (category) {
      filter.category = category;
    }

    if (startDate || endDate) {
      filter.date = {};

      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }

      if (endDate) {
        filter.date.$lte = new Date(endDate);
      }
    }

    const records = await FinancialRecord.find(filter).sort({ date: -1 });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, type, category, date, note, userId } = req.body;

    const updatedRecord = await FinancialRecord.findByIdAndUpdate(
      id,
      { amount, type, category, date, note, userId },
      { new: true, runValidators: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.status(200).json(updatedRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRecord = await FinancialRecord.findByIdAndDelete(id);

    if (!deletedRecord) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.status(200).json({ message: "Record deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createRecord, getRecords, updateRecord, deleteRecord };
