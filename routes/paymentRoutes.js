const express = require("express");
const paymentController = require("../controllers/paymentController");
const { verifyToken, authorizeRoles } = require("../middleware/auth");
const { generatePaymentReceipt } = require("../utils/receiptGenerator");
const PaymentLog = require("../models/PaymentLog");
const fs = require("fs");
const path = require("path");

const router = express.Router();


router.get("/", verifyToken, paymentController.getPaymentHistory);


router.get("/:paymentId", verifyToken, paymentController.getPaymentById);


router.post(
  "/",
  verifyToken,
  authorizeRoles("Manager", "Admin"),
  paymentController.logPayment
);


router.get(
  "/stats/overview",
  verifyToken,
  authorizeRoles("Manager", "Admin"),
  paymentController.getPaymentStats
);


router.get(
  "/pending/list",
  verifyToken,
  paymentController.getPendingPayments
);


router.put(
  "/:paymentId/receipt",
  verifyToken,
  paymentController.markReceiptGenerated
);


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


      const { filepath, filename } = await generatePaymentReceipt({
        ...payment.toObject(),
        invoiceNumber: `INV-${payment.transactionId}`,
      });


      res.download(filepath, filename, (err) => {
        if (err) console.error("Download error:", err);

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
