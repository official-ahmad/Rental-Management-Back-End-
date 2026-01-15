const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Home = require("../models/home");

// --- 1. POST: Booking Request bhejain ---
router.post("/request", async (req, res) => {
  try {
    const { propertyId, tenantId, managerId } = req.body;
    if (!propertyId || !tenantId) {
      return res.status(400).json({ message: "Data missing hai!" });
    }
    const existing = await Booking.findOne({ propertyId, tenantId });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Aap pehle hi request bhej chuke hain!" });
    }
    const newBooking = new Booking({
      propertyId,
      tenantId,
      managerId: managerId || null,
      status: "Pending",
    });
    await newBooking.save();
    res.status(201).json({ message: "Booking success!" });
  } catch (err) {
    console.error("Booking Error:", err.message);
    res
      .status(500)
      .json({ error: "Booking save nahi ho saki: " + err.message });
  }
});

// --- 2. GET: Tenant ki bookings ---
router.get("/my-booking/:id", async (req, res) => {
  try {
    const bookings = await Booking.find({ tenantId: req.params.id })
      .sort({ createdAt: -1 })
      .populate("propertyId");
    res.json(bookings);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Data fetch karne mein masla: " + err.message });
  }
});

// --- 3. GET: Manager dashboard ---
router.get("/pending", async (req, res) => {
  try {
    const pendingBookings = await Booking.find({ status: "Pending" })
      .populate("propertyId")
      .populate("tenantId");
    res.json(pendingBookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- NAYA ROUTE: Tenant apni booking cancel kar sake ---
router.delete("/cancel/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;
    // Sirf wahi booking delete hogi jo abhi tak Pending hai
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking record nahi mila!" });
    }

    if (booking.status !== "Pending") {
      return res
        .status(400)
        .json({ message: "Sirf Pending request cancel ki ja sakti hai!" });
    }

    await Booking.findByIdAndDelete(bookingId);
    res
      .status(200)
      .json({ message: "Booking request cancelled successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Cancellation failed: " + err.message });
  }
});

module.exports = router;
