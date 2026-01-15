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

// --- TENANT KI BOOKINGS FETCH KARNE KE LIYE ---
exports.getTenantBookings = async (req, res) => {
  try {
    const { id } = req.params; // Frontend se aane wali userId

    // Database mein check karein ke is tenantId ki kitni bookings hain
    // .populate('propertyId') is liye taake property ki details (name, address) bhi mil jayein
    const bookings = await Booking.find({ tenantId: id }).populate(
      "propertyId"
    );

    if (!bookings) {
      return res.status(404).json({ message: "Koi booking nahi mili!" });
    }

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Fetch Booking Error:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
};
