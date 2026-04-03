const User = require("../models/User");
const mongoose = require("mongoose");

const allowedRoles = ["viewer", "analyst", "admin"];

const createUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "name and email are required" });
    }

    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role value" });
    }

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Create new user
    const user = new User({ name, email, role });
    await user.save();

    res.status(201).json(user);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Email already exists" });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role value" });
    }

    const updateData = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (email !== undefined) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== id) {
        return res.status(400).json({ error: "Email already exists" });
      }

      updateData.email = email;
    }

    if (role !== undefined) {
      updateData.role = role;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No fields provided for update" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Email already exists" });
    }

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ error: "Invalid user id" });
    }

    res.status(500).json({ error: error.message });
  }
};

module.exports = { createUser, getUsers, updateUser, deleteUser };
