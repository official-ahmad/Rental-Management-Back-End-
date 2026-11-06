const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");


router.post("/create", bookingController.createBooking);
router.post("/request", bookingController.createBooking);


router.get("/all-requests", bookingController.getManagerRequests);


router.put("/update/:bookingId", bookingController.updateStatus);


router.put("/pay/:bookingId", bookingController.updatePaymentStatus);


router.get("/my-booking/:id", bookingController.getTenantBookings);


router.delete("/cancel/:bookingId", bookingController.cancelBooking);

module.exports = router;
