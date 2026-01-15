const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Home", 
    required: true,
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", 
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
  // bookingDate ko rehne den ya nikal den, timestamps kafi hain
  bookingDate: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true }); // <--- YE ZAROOR ADD KAREIN

module.exports = mongoose.model("Booking", bookingSchema);