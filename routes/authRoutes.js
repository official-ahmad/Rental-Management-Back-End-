const express = require("express");
const router = express.Router();
const {
  register,
  login,
  verifyAdminAccess,
  verifyPageAccess,
  adminLogin,
  getAdminProfile,
  updateAdminProfile,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} = require("../controllers/user");
const { verifyToken, authorizeRoles } = require("../middleware/auth");


router.post("/register", register);


router.post("/login", login);


router.post("/verify-admin-access", verifyAdminAccess);


router.post("/verify-page-access", verifyPageAccess);


router.post("/admin-login", adminLogin);
router.get("/admin-profile", verifyToken, authorizeRoles("Admin"), getAdminProfile);
router.put("/admin-profile", verifyToken, authorizeRoles("Admin"), updateAdminProfile);


router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);


router.post("/reset-password/:token", resetPassword);

module.exports = router;
