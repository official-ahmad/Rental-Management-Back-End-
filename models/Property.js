const mongoose = require("mongoose");

const PropertySchema = new mongoose.Schema({
  propertyName: { type: String, required: true },
  location: { type: String, required: true },
  rentAmount: { type: Number, required: true },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  status: { type: String, enum: ["Vacant", "Occupied"], default: "Vacant" },
});

module.exports = mongoose.model("Property", PropertySchema);