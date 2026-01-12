const Booking = require("../models/Booking"); // Aapka model file path

exports.createBooking = async (req, res) => {
  try {
    const { propertyId, tenantId, managerId } = req.body;

    // Data check karein
    if (!propertyId || !tenantId || !managerId) {
      return res.status(400).json({ message: "Sari fields (IDs) lazmi hain!" });
    }

    const newBooking = new Booking({
      propertyId,
      tenantId,
      managerId,
      status: "Pending", // Default status
    });

    const savedBooking = await newBooking.save();
    res.status(201).json(savedBooking);
  } catch (error) {
    console.error("Booking Error:", error);
    res.status(500).json({ message: "Server crash ho gya: " + error.message });
  }
};
