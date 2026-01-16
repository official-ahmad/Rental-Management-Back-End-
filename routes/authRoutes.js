const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/user");

// 1. Signup Route
router.post("/register", register);

// 2. Login Route
router.post("/login", login);

module.exports = router;
