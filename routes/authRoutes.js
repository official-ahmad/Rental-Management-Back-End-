const express = require("express");
const router = express.Router();
const {
  register,
  login,
  verifyAdminAccess,
  verifyPageAccess,
  adminLogin,
  forgotPassword,
  resetPassword,
} = require("../controllers/user");

// 1. Signup Route
router.post("/register", register);

// 2. Login Route
router.post("/login", login);

// 3. Verify Admin Access Key
router.post("/verify-admin-access", verifyAdminAccess);

// 4. Verify Page Access Key (for /page route)
router.post("/verify-page-access", verifyPageAccess);

// 5. Admin Login (Static Credentials)
router.post("/admin-login", adminLogin);

// 6. Forgot Password
router.post("/forgot-password", forgotPassword);

// 7. Reset Password
router.post("/reset-password/:token", resetPassword);

module.exports = router;
