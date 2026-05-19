const express = require("express");
const router = express.Router();
const { verifyToken, authorizeRoles } = require("../middleware/auth");
const {
  submitFeedback,
  getAllFeedbacks,
  deleteFeedback,
} = require("../controllers/feedbackController");

// Public route - anyone can submit feedback
router.post("/submit", submitFeedback);

// Admin only - get all feedbacks
router.get("/all", verifyToken, authorizeRoles("Admin"), getAllFeedbacks);

// Admin only - delete feedback
router.delete("/:id", verifyToken, authorizeRoles("Admin"), deleteFeedback);

module.exports = router;
