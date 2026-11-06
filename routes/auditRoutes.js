const express = require("express");
const auditController = require("../controllers/auditController");
const { verifyToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();


router.get(
  "/",
  verifyToken,
  authorizeRoles("Admin"),
  auditController.getAuditLogs,
);


router.get(
  "/stats/overview",
  verifyToken,
  authorizeRoles("Admin"),
  auditController.getAuditStats,
);


router.get(
  "/user/:userId",
  verifyToken,
  authorizeRoles("Admin"),
  auditController.getUserAuditLogs,
);


router.get(
  "/entity/:entityType/:entityId",
  verifyToken,
  authorizeRoles("Admin"),
  auditController.getEntityAuditLogs,
);


router.get(
  "/export/csv",
  verifyToken,
  authorizeRoles("Admin"),
  auditController.exportAuditLogs,
);

module.exports = router;
