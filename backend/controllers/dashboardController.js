const FinancialRecord = require("../models/FinancialRecord");
const User = require("../models/User");
const mongoose = require("mongoose");

const getDashboardSummary = async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;
    const match = {};

    if (req.userRole === "admin") {
      if (userId) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
          return res.status(400).json({ error: "Invalid userId filter" });
        }

        const userExists = await User.exists({ _id: userId });
        if (!userExists) {
          return res.status(404).json({ error: "User not found" });
        }

        match.userId = new mongoose.Types.ObjectId(userId);
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

      match.userId = new mongoose.Types.ObjectId(req.userId);
    }

    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if ((start && Number.isNaN(start.getTime())) || (end && Number.isNaN(end.getTime()))) {
        return res.status(400).json({ error: "Invalid date filter" });
      }

      match.date = {};

      if (start) {
        match.date.$gte = start;
      }

      if (end) {
        match.date.$lte = end;
      }
    }

    const totalsResult = await FinancialRecord.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$type",
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const categoryTotals = await FinancialRecord.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$category",
          totalAmount: { $sum: "$amount" },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    const monthlyTotals = await FinancialRecord.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            month: { $dateToString: { format: "%Y-%m", date: "$date" } },
            type: "$type",
          },
          totalAmount: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    let totalIncome = 0;
    let totalExpense = 0;

    totalsResult.forEach((item) => {
      if (item._id === "income") {
        totalIncome = item.totalAmount;
      }

      if (item._id === "expense") {
        totalExpense = item.totalAmount;
      }
    });

    const monthlyMap = new Map();

    monthlyTotals.forEach((item) => {
      const month = item._id.month;
      const type = item._id.type;

      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { month, income: 0, expense: 0 });
      }

      if (type === "income") {
        monthlyMap.get(month).income = item.totalAmount;
      }

      if (type === "expense") {
        monthlyMap.get(month).expense = item.totalAmount;
      }
    });

    res.status(200).json({
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      monthlyTrends: Array.from(monthlyMap.values()),
      categoryTotals: categoryTotals.map((item) => ({
        category: item._id,
        totalAmount: item.totalAmount,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getDashboardSummary };
