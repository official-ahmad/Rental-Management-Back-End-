const express = require("express");
const paymentController = require("../controllers/paymentController");
const { verifyToken, authorizeRoles } = require("../middleware/auth");
const { generatePaymentReceipt } = require("../utils/receiptGenerator");
const PaymentLog = require("../models/PaymentLog");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Get payment history (Manager, Tenant, Admin)
router.get("/", verifyToken, paymentController.getPaymentHistory);

// Get single payment details
router.get("/:paymentId", verifyToken, paymentController.getPaymentById);

// Log new payment (Manager creates entry)
router.post(
  "/",
  verifyToken,
  authorizeRoles("Manager", "Admin"),
  paymentController.logPayment
);

// Get payment statistics (Manager, Admin)
router.get(
  "/stats/overview",
  verifyToken,
  authorizeRoles("Manager", "Admin"),
  paymentController.getPaymentStats
);

// Get pending payments
router.get(
  "/pending/list",
  verifyToken,
  paymentController.getPendingPayments
);

// Mark receipt as generated
router.put(
  "/:paymentId/receipt",
  verifyToken,
  paymentController.markReceiptGenerated
);

// Generate and download receipt PDF
router.get(
  "/:paymentId/download-receipt",
  verifyToken,
  async (req, res) => {
    try {
      const { paymentId } = req.params;
      const payment = await PaymentLog.findById(paymentId)
        .populate("tenantId", "firstName lastName email")
        .populate("propertyId", "propertyName location rentAmount");

      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // Generate PDF
      const { filepath, filename } = await generatePaymentReceipt({
        ...payment.toObject(),
        invoiceNumber: `INV-${payment.transactionId}`,
      });

      // Send file
      res.download(filepath, filename, (err) => {
        if (err) console.error("Download error:", err);
        // Delete temp file after download
        setTimeout(() => {
          fs.unlink(filepath, (err) => {
            if (err) console.error("Error deleting temp file:", err);
          });
        }, 1000);
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to generate receipt",
        error: error.message,
      });
    }
  }
);

module.exports = router;
