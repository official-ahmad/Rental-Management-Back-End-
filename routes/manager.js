const express = require("express");
const router = express.Router();
const Home = require("../models/home");
const User = require("../models/user");

const isObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || ""));

const toNumberOrZero = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const buildPropertyPayload = (input = {}) => ({
  propertyName: input.propertyName,
  location: input.location,
  rentAmount: toNumberOrZero(input.rentAmount),
  image: input.image,
  bedrooms: toNumberOrZero(input.bedrooms),
  bathrooms: toNumberOrZero(input.bathrooms),
  area: String(input.area || ""),
  description: input.description,
  category: input.category || "Apartment",
  status: input.status || "Vacant",
  managerId: input.managerId || null,
});

const getCreatorMeta = async (req) => {
  const fallbackName = req.user?.role === "Admin" ? "System Admin" : "Unknown";
  const creator = {
    userId: req.user?.id || "",
    role: req.user?.role || "",
    name: fallbackName,
    email: "",
  };

  if (isObjectId(req.user?.id)) {
    const user = await User.findById(req.user.id).select(
      "firstName lastName email role",
    );
    if (user) {
      creator.name = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
      creator.email = user.email || "";
      creator.role = user.role || creator.role;
    }
  }

  return creator;
};

router.get("/properties", async (req, res) => {
  try {
    const data = await Home.find()
      .sort({ createdAt: -1 })
      .populate("managerId", "firstName lastName email")
      .populate("tenant", "firstName lastName email");
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}).select(
      "firstName lastName email role createdAt updatedAt",
    );
    const normalizedUsers = users.map((user) => ({
      ...user.toObject(),
      name: [user.firstName, user.lastName].filter(Boolean).join(" ").trim(),
    }));
    res.json(normalizedUsers);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users." });
  }
});

router.post("/add", async (req, res) => {
  try {
    const payload = buildPropertyPayload(req.body);
    if (
      !payload.managerId &&
      req.user?.role === "Manager" &&
      isObjectId(req.user?.id)
    ) {
      payload.managerId = req.user.id;
    }
    const creator = await getCreatorMeta(req);

    const newProperty = new Home({
      ...payload,
      createdBy: creator,
    });
    await newProperty.save();
    res.status(201).json({ message: "Property Added Successfully" });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error saving property", error: err.message });
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    await Home.findByIdAndDelete(req.params.id);
    res.json({ message: "Property Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "Admin")
      return res.status(403).json({ message: "Cannot delete admin accounts" });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User removed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to remove user" });
  }
});

router.put("/update/:id", async (req, res) => {
  try {
    const payload = buildPropertyPayload(req.body);
    await Home.findByIdAndUpdate(req.params.id, payload);
    res.json({ message: "Property Updated" });
  } catch (err) {
    res.status(400).json({ message: "Update failed" });
  }
});

module.exports = router;
