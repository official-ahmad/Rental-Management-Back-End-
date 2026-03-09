const mongoose = require("mongoose");

const HomePropertySchema = new mongoose.Schema(
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
    image: {
      type: String,
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
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: "Apartment",
      trim: true,
    },
    status: {
      type: String,
      enum: ["Vacant", "Occupied"],
      default: "Vacant",
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

module.exports =
  mongoose.models.Home || mongoose.model("Home", HomePropertySchema);
