const express = require("express");
const router = express.Router();
const Home = require("../models/home");

// 1. ISKO UNCOMMENT KAREIN (Slash hata dein)
router.get("/all", async (req, res) => {
  try {
    const data = await Home.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. POST route pehle se theek hai
router.post("/add", async (req, res) => {
  try {
    const newProperty = new Home(req.body);
    const savedProperty = await newProperty.save();
    res.status(201).json(savedProperty);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Data save nahi ho saka", error: err.message });
  }
});

module.exports = router;
