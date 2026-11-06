const { logAction } = require("../controllers/auditController");

const auditMiddleware = async (req, res, next) => {

  if (!["POST", "PUT", "DELETE"].includes(req.method)) {
    return next();
  }


  if (req.originalUrl.split("?")[0].startsWith("/api/auth")) {
    return next();
  }


  const originalSend = res.send;

  res.send = function (data) {

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

      if (entityType === "Unknown") {
        res.send = originalSend;
        return res.send(data);
      }

      const ipAddress =
        req.ip ||
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress;
      const userAgent = req.headers["user-agent"];


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


    res.send = originalSend;
    return res.send(data);
  };

  next();
};

module.exports = auditMiddleware;
