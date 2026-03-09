const jwt = require("jsonwebtoken");

/**
 * Verifies JWT token from Authorization header.
 * Attaches decoded user { id, role } to req.user
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

/**
 * Restrict access to specific roles.
 * Usage: authorizeRoles("Admin", "Manager")
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Forbidden. Insufficient permissions." });
    }
    next();
  };
};

module.exports = { verifyToken, authorizeRoles };
