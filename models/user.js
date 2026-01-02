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
      unique: true, // 'unique' boolean hota hai
    },
    password: {
      type: String,
      required: [true, "Please fill password field"],
      minLength: [8, "Password should be at least 8 characters"],
    },
    // YE ZAROORI HAI:
    role: {
      type: String,
      enum: ["Admin", "Manager", "Tenant"],
      required: [true, "Please specify a role"],
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordTokenExpiry: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
); // Taake pata chale kab account bana

// Export karte waqt 'User' (Capital U) rakhen taake controller mein asani ho
const User = mongoose.model("User", userSchema);

module.exports = User;
