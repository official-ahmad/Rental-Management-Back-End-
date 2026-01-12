const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");

router.post("/request", async (req, res) => {
  try {
    const newBooking = new Booking(req.body);
    await newBooking.save();
    res.status(201).json({ message: "Request sent to manager!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/manager/:managerId", async (req, res) => {
  try {
    const requests = await Booking.find({ managerId: req.params.managerId })
      .populate("propertyId") 
      .populate("tenantId", "name email"); 
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
