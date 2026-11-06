const express = require("express");
const router = express.Router();
const { verifyToken, authorizeRoles } = require("../middleware/auth");
const {
  submitFeedback,
  getAllFeedbacks,
  deleteFeedback,
} = require("../controllers/feedbackController");


router.post("/submit", submitFeedback);


router.get("/all", verifyToken, authorizeRoles("Admin"), getAllFeedbacks);


router.delete("/:id", verifyToken, authorizeRoles("Admin"), deleteFeedback);

module.exports = router;
