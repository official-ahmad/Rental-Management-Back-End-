const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");

// 1. POST: Create Booking
router.post("/create", bookingController.createBooking);
router.post("/request", bookingController.createBooking);

// 2. GET: All Shared Requests
router.get("/all-requests", bookingController.getManagerRequests);

// 3. PUT: Update Status
router.put("/update/:bookingId", bookingController.updateStatus);

// 4. PUT: Payment Status Update
router.put("/pay/:bookingId", bookingController.updatePaymentStatus);

// 5. GET: Tenant bookings
router.get("/my-booking/:id", bookingController.getTenantBookings);

// 6. DELETE: Cancel Booking
router.delete("/cancel/:bookingId", bookingController.cancelBooking);

module.exports = router;
