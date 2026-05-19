const AuditLog = require("../models/AuditLog");

// Log an action (utility function for middleware)
exports.logAction = async (
  userId,
  userRole,
  action,
  entityType,
  entityId,
  entityName,
  changes,
  ipAddress,
  userAgent,
) => {
  try {
    const auditLog = new AuditLog({
      userId,
      userRole,
      action,
      entityType,
      entityId,
      entityName,
      changes,
      ipAddress,
      userAgent,
      description: `${userRole} ${action}d ${entityType} ${entityName || ""}`,
    });
    await auditLog.save();
  } catch (error) {
    console.error("Error logging audit:", error);
  }
};

// Get all audit logs (Admin only)
exports.getAuditLogs = async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Unauthorized - Admin only" });
    }

    const {
      userId,
      action,
      entityType,
      startDate,
      endDate,
      limit = 100,
      page = 1,
    } = req.query;

    let filter = {};

    if (userId) filter.userId = userId;
    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    res.status(200).json({
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch audit logs",
      error: error.message,
    });
  }
};

// Get logs for specific user
exports.getUserAuditLogs = async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Unauthorized - Admin only" });
    }

    const { userId } = req.params;
    const { limit = 50, page = 1 } = req.query;

    const skip = (page - 1) * limit;
    const total = await AuditLog.countDocuments({ userId });
    const logs = await AuditLog.find({ userId })
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    res.status(200).json({
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch user audit logs",
      error: error.message,
    });
  }
};

// Get logs for specific entity (Property, Booking, etc)
exports.getEntityAuditLogs = async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Unauthorized - Admin only" });
    }

    const { entityType, entityId } = req.params;
    const logs = await AuditLog.find({ entityType, entityId })
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch entity audit logs",
      error: error.message,
    });
  }
};

// Get audit statistics
exports.getAuditStats = async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Unauthorized - Admin only" });
    }

    const totalLogs = await AuditLog.countDocuments();
    const actionCounts = await AuditLog.aggregate([
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const entityTypeCounts = await AuditLog.aggregate([
      {
        $group: {
          _id: "$entityType",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const topUsers = await AuditLog.aggregate([
      {
        $group: {
          _id: "$userId",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },
    ]);

    res.status(200).json({
      totalLogs,
      actionCounts,
      entityTypeCounts,
      topUsers,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch audit statistics",
      error: error.message,
    });
  }
};

// Export audit logs as CSV
exports.exportAuditLogs = async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Unauthorized - Admin only" });
    }

    const { startDate, endDate } = req.query;
    let filter = {};

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(filter)
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 });

    // Convert to CSV
    const csvHeaders =
      "Timestamp,User,Role,Action,Entity Type,Entity Name,Description,IP Address\n";
    const csvRows = logs
      .map(
        (log) =>
          `"${log.createdAt}","${log.userId?.firstName} ${log.userId?.lastName}","${log.userRole}","${log.action}","${log.entityType}","${log.entityName}","${log.description}","${log.ipAddress}"`,
      )
      .join("\n");

    const csv = csvHeaders + csvRows;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="audit-logs.csv"',
    );
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({
      message: "Failed to export audit logs",
      error: error.message,
    });
  }
};
