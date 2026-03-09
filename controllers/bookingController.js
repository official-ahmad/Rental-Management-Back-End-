const Booking = require("../models/Booking");
const Home = require("../models/home");

const formatTenant = (tenant) => {
  if (!tenant) return tenant;

  return {
    _id: tenant._id,
    email: tenant.email,
    firstName: tenant.firstName,
    lastName: tenant.lastName,
    name: [tenant.firstName, tenant.lastName].filter(Boolean).join(" ").trim(),
  };
};

// 1. CREATE BOOKING
exports.createBooking = async (req, res) => {
  try {
    const { propertyId, tenantId, startDate, endDate } = req.body;

    if (!propertyId || !tenantId) {
      return res.status(400).json({ message: "Information missing!" });
    }

    const property = await Home.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found!" });
    }

    if (property.status === "Occupied") {
      return res
        .status(400)
        .json({ message: "This property is already occupied!" });
    }

    const existingBooking = await Booking.findOne({
      propertyId,
      tenantId,
      status: "Pending",
    });
    if (existingBooking) {
      return res
        .status(400)
        .json({ message: "Request already exists for this property!" });
    }

    const newBooking = new Booking({
      propertyId,
      tenantId,
      status: "Pending",
      startDate,
      endDate,
    });

    const savedBooking = await newBooking.save();
    res.status(201).json(savedBooking);
  } catch (error) {
    console.error("Booking Error:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

// 2. GET ALL REQUESTS (Manager Dashboard)
exports.getManagerRequests = async (req, res) => {
  try {
    const requests = await Booking.find()
      .sort({ createdAt: -1 })
      .populate("propertyId")
      .populate("tenantId", "firstName lastName email");

    const normalizedRequests = requests.map((request) => ({
      ...request.toObject(),
      tenantId: formatTenant(request.tenantId),
    }));

    res.status(200).json(normalizedRequests);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching requests: " + error.message });
  }
};

// 3. UPDATE STATUS (Approve/Reject logic)
exports.updateStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { status: status },
      { new: true },
    );

    if (!updatedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (status === "Approved") {
      await Home.findByIdAndUpdate(updatedBooking.propertyId, {
        status: "Occupied",
        tenant: updatedBooking.tenantId,
      });
    }

    if (status === "Rejected") {
      await Home.findByIdAndUpdate(updatedBooking.propertyId, {
        status: "Vacant",
        tenant: null,
      });
    }

    res.status(200).json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: "Update failed: " + error.message });
  }
};

// 4. GET TENANT BOOKINGS (History)
exports.getTenantBookings = async (req, res) => {
  try {
    const { id } = req.params;
    const bookings = await Booking.find({ tenantId: id })
      .populate("propertyId")
      .populate("tenantId", "firstName lastName email");

    const normalizedBookings = bookings.map((booking) => ({
      ...booking.toObject(),
      tenantId: formatTenant(booking.tenantId),
    }));

    res.status(200).json(normalizedBookings);
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

// 5. UPDATE PAYMENT STATUS (Naya Function jo missing tha)
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { paymentStatus: "Paid" },
      { new: true },
    );

    if (!updatedBooking) {
      return res.status(404).json({ message: "Booking record not found!" });
    }

    res.status(200).json(updatedBooking);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Database update failed: " + error.message });
  }
};

// 6. CANCEL BOOKING (moved from inline route)
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found!" });
    }
    if (booking.status !== "Pending") {
      return res
        .status(400)
        .json({ message: "Only pending bookings can be cancelled." });
    }

    await Booking.findByIdAndDelete(bookingId);
    res.status(200).json({ message: "Booking cancelled successfully." });
  } catch (error) {
    res.status(500).json({ message: "Cancellation failed: " + error.message });
  }
};
