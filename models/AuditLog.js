const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userRole: {
      type: String,
      enum: ["Admin", "Manager", "Tenant"],
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: ["create", "update", "delete", "approve", "reject", "pay"],
    },
    entityType: {
      type: String,
      required: true,
      enum: ["Property", "Booking", "User", "Payment"],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    entityName: String,
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
    },
    description: String,
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: true },
);

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
