const express = require("express");
const auditController = require("../controllers/auditController");
const { verifyToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

// Get all audit logs (Admin only)
router.get(
  "/",
  verifyToken,
  authorizeRoles("Admin"),
  auditController.getAuditLogs,
);

// Get audit statistics (Admin only)
router.get(
  "/stats/overview",
  verifyToken,
  authorizeRoles("Admin"),
  auditController.getAuditStats,
);

// Get logs for specific user (Admin only)
router.get(
  "/user/:userId",
  verifyToken,
  authorizeRoles("Admin"),
  auditController.getUserAuditLogs,
);

// Get logs for specific entity (Admin only)
router.get(
  "/entity/:entityType/:entityId",
  verifyToken,
  authorizeRoles("Admin"),
  auditController.getEntityAuditLogs,
);

// Export audit logs as CSV (Admin only)
router.get(
  "/export/csv",
  verifyToken,
  authorizeRoles("Admin"),
  auditController.exportAuditLogs,
);

module.exports = router;
