const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Home", // Ensure karein ke aapka property model 'home' hi hai
    required: true,
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Ensure karein ke aapka user model 'User' hi hai
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
  bookingDate: {
    type: Date,
    default: Date.now,
  },
});

// YEH LINE THEEK KAREIN - Yehi findOne provide karti hai
module.exports = mongoose.model("Booking", bookingSchema);
