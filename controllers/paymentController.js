const PaymentLog = require("../models/PaymentLog");
const Booking = require("../models/Booking");
const User = require("../models/user");
const Home = require("../models/home");

// Get payment history (filtered by user role)
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    let filter = {};

    if (userRole === "Manager") {
      const managerProperties = await Home.find({ managerId: userId });
      const propertyIds = managerProperties.map((p) => p._id);
      filter = { propertyId: { $in: propertyIds } };
    } else if (userRole === "Tenant") {
      filter = { tenantId: userId };
    } else if (userRole === "Admin") {
      // Admin can see all payments
      filter = {};
    }

    const payments = await PaymentLog.find(filter)
      .populate("tenantId", "firstName lastName email")
      .populate("propertyId", "propertyName location rentAmount")
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch payment history",
      error: error.message,
    });
  }
};

// Get single payment details
exports.getPaymentById = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await PaymentLog.findById(paymentId)
      .populate("tenantId", "firstName lastName email")
      .populate("bookingId")
      .populate("propertyId", "propertyName location rentAmount")
      .populate("managerId", "firstName lastName email");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.status(200).json(payment);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch payment", error: error.message });
  }
};

// Log payment (called when payment is made)
exports.logPayment = async (req, res) => {
  try {
    const {
      bookingId,
      tenantId,
      propertyId,
      amount,
      paymentMethod = "wallet",
      description,
    } = req.body;
    const managerId = req.user.id;

    // Generate unique transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const newPayment = new PaymentLog({
      bookingId,
      tenantId,
      managerId,
      propertyId,
      amount,
      paymentMethod,
      transactionId,
      status: "completed",
      description: description || "Rent payment received",
      receiptGenerated: false,
    });

    await newPayment.save();
    res.status(201).json({
      message: "Payment logged successfully",
      payment: newPayment,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to log payment", error: error.message });
  }
};

// Get payment statistics (Admin/Manager)
exports.getPaymentStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    let filter = {};

    if (userRole === "Manager") {
      const managerProperties = await Home.find({ managerId: userId });
      const propertyIds = managerProperties.map((p) => p._id);
      filter = { propertyId: { $in: propertyIds } };
    } else if (userRole !== "Admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const totalPayments = await PaymentLog.countDocuments(filter);
    const completedPayments = await PaymentLog.countDocuments({
      ...filter,
      status: "completed",
    });
    const totalRevenue = await PaymentLog.aggregate([
      { $match: { ...filter, status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // Monthly breakdown
    const monthlyRevenue = await PaymentLog.aggregate([
      { $match: { ...filter, status: "completed" } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ]);

    res.status(200).json({
      totalPayments,
      completedPayments,
      totalRevenue: totalRevenue[0]?.total || 0,
      monthlyRevenue,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch payment statistics",
      error: error.message,
    });
  }
};

// Mark receipt as generated
exports.markReceiptGenerated = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await PaymentLog.findByIdAndUpdate(
      paymentId,
      { receiptGenerated: true },
      { new: true },
    );

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.status(200).json({ message: "Receipt marked as generated", payment });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update receipt status",
      error: error.message,
    });
  }
};

// Get payments due (pending)
exports.getPendingPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    let filter = { status: "pending" };

    if (userRole === "Tenant") {
      filter.tenantId = userId;
    } else if (userRole === "Manager") {
      const managerProperties = await Home.find({ managerId: userId });
      const propertyIds = managerProperties.map((p) => p._id);
      filter.propertyId = { $in: propertyIds };
    }

    const pendingPayments = await PaymentLog.find(filter)
      .populate("tenantId", "firstName lastName email")
      .populate("propertyId", "propertyName")
      .sort({ createdAt: -1 });

    res.status(200).json(pendingPayments);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch pending payments",
      error: error.message,
    });
  }
};
