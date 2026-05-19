const mongoose = require("mongoose");

const paymentLogSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Home",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["wallet", "credit_card", "bank_transfer", "upi"],
      default: "wallet",
    },
    transactionId: {
      type: String,
      unique: true,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "completed",
    },
    receiptGenerated: {
      type: Boolean,
      default: false,
    },
    description: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("PaymentLog", paymentLogSchema);
