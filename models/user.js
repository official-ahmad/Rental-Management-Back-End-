const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "Please fill first name"],
      minLength: [3, "First name should be at least of 3 characters"],
      maxLength: [15, "First name cannot exceed 15 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Please fill Last name"],
      minLength: [3, "Last name should be at least of 3 characters"],
      maxLength: [15, "Last name cannot exceed 15 characters"],
    },
    email: {
      type: String,
      required: [true, "Please fill email"],
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Please fill password field"],
      minLength: [8, "Password should be at least 8 characters"],
    },
    role: {
      type: String,
      enum: ["Admin", "Manager", "Tenant"],
      required: [true, "Please specify a role"],
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordTokenExpiry: {
      type: Date,
      default: null,
    },
    resetOtpHash: {
      type: String,
      default: null,
    },
    resetOtpExpiry: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);


userSchema.index({ email: 1, role: 1 }, { unique: true });

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
