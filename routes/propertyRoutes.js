const express = require("express");
const router = express.Router();
const Property = require("../models/Property");

router.post("/add", async (req, res) => {
  try {
    const { propertyName, location, rentAmount, tenantId } = req.body;
    const newProperty = new Property({
      propertyName,
      location,
      rentAmount,
      tenant: tenantId || null,
      status: tenantId ? "Occupied" : "Vacant",
    });
    await newProperty.save();
    res
      .status(201)
      .json({ message: "Property Added Successfully!", newProperty });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error adding property", error: err.message });
  }
});

router.get("/my-property/:tenantId", async (req, res) => {
  try {
    const property = await Property.findOne({ tenant: req.params.tenantId });
    if (!property)
      return res.status(404).json({ message: "No property assigned" });
    res.json(property);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
