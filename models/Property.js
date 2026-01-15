const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    propertyName: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    rentAmount: {
      type: Number,
      required: true,
    },
    bedrooms: {
      type: Number,
      required: true,
    },
    bathrooms: {
      type: Number,
      required: true,
    },
    area: {
      type: String, // e.g., "2000 sqft"
      required: true,
    },
    image: {
      type: String, // Base64 ya URL string
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Vacant", "Occupied"],
      default: "Vacant",
    },
    // Yeh field humein bataye gi ke property kis tenant ke paas hai
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Check karna aapke User model ka naam yahi hai na?
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Property", propertySchema);
