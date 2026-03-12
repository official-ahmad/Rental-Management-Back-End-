const express = require("express");
const router = express.Router();
const Home = require("../models/home");
const User = require("../models/user");

router.get("/properties", async (req, res) => {
  try {
    const data = await Home.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}).select(
      "firstName lastName email role createdAt updatedAt",
    );
    const normalizedUsers = users.map((user) => ({
      ...user.toObject(),
      name: [user.firstName, user.lastName].filter(Boolean).join(" ").trim(),
    }));
    res.json(normalizedUsers);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users." });
  }
});

router.post("/add", async (req, res) => {
  try {
    const newProperty = new Home(req.body);
    await newProperty.save();
    res.status(201).json({ message: "Property Added Successfully" });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error saving property", error: err.message });
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    await Home.findByIdAndDelete(req.params.id);
    res.json({ message: "Property Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "Admin")
      return res.status(403).json({ message: "Cannot delete admin accounts" });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User removed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to remove user" });
  }
});

router.put("/update/:id", async (req, res) => {
  try {
    await Home.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: "Property Updated" });
  } catch (err) {
    res.status(400).json({ message: "Update failed" });
  }
});

module.exports = router;
