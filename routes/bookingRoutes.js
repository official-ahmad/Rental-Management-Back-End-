const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const bookingController = require("../controllers/bookingController");

// 1. POST: Create Booking (Home.jsx isi ko hit karta hai)
router.post("/create", bookingController.createBooking);
router.post("/request", bookingController.createBooking); // Backup path

// 2. GET: All Shared Requests (Aapka Manager Dashboard isi ko dhoond raha hai)
router.get("/all-requests", bookingController.getManagerRequests);

// 3. PUT: Update Status (Approve/Reject button ke liye)
router.put("/update/:bookingId", bookingController.updateStatus);

// 4. GET: Tenant ki bookings (History)
router.get("/my-booking/:id", bookingController.getTenantBookings);

// 5. DELETE: Cancel Booking
router.delete("/cancel/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Not found!" });
    if (booking.status !== "Pending")
      return res.status(400).json({ message: "Cannot cancel now!" });

    await Booking.findByIdAndDelete(bookingId);
    res.status(200).json({ message: "Cancelled!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
