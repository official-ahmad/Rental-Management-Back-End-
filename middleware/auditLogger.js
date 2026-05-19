const { logAction } = require("../controllers/auditController");

const auditMiddleware = async (req, res, next) => {
  // Only log state-changing requests (POST, PUT, DELETE)
  if (!["POST", "PUT", "DELETE"].includes(req.method)) {
    return next();
  }

  // Skip auth endpoints
  if (req.path.startsWith("/api/auth")) {
    return next();
  }

  // Capture original request data
  const originalSend = res.send;

  res.send = function (data) {
    // Log action after successful response
    if (res.statusCode >= 200 && res.statusCode < 400 && req.user) {
      const action =
        req.method === "POST"
          ? "create"
          : req.method === "PUT"
            ? "update"
            : "delete";
      let entityType = "Unknown";
      let entityId = null;
      let entityName = null;

      // Determine entity type and ID based on route
      if (req.path.includes("/properties")) {
        entityType = "Property";
        entityId = req.body.propertyId || req.params.id;
        entityName = req.body.propertyName;
      } else if (req.path.includes("/booking")) {
        entityType = "Booking";
        entityId = req.body.bookingId || req.params.bookingId;
      } else if (req.path.includes("/users")) {
        entityType = "User";
        entityId = req.body.userId || req.params.id;
      } else if (req.path.includes("/home") && req.method !== "GET") {
        entityType = "Property";
        entityId = req.body._id || req.params.id;
        entityName = req.body.propertyName;
      }

      const ipAddress =
        req.ip ||
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress;
      const userAgent = req.headers["user-agent"];

      // Call audit logging asynchronously (don't block response)
      logAction(
        req.user.id,
        req.user.role,
        action,
        entityType,
        entityId,
        entityName,
        null,
        ipAddress,
        userAgent,
      ).catch((err) => console.error("Audit logging error:", err));
    }

    // Send response
    res.send = originalSend;
    return res.send(data);
  };

  next();
};

module.exports = auditMiddleware;
