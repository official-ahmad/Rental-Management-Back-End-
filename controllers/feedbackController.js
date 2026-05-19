const Feedback = require("../models/Feedback");

// Submit feedback
exports.submitFeedback = async (req, res) => {
  try {
    const { name, email, description } = req.body;

    if (!name || !email || !description) {
      return res.status(400).json({
        message: "Please fill in all fields",
      });
    }

    const feedback = new Feedback({
      name,
      email,
      description,
    });

    await feedback.save();

    res.status(201).json({
      message: "Feedback submitted successfully!",
      feedback,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error submitting feedback",
      error: error.message,
    });
  }
};

// Get all feedbacks (Admin only)
exports.getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });

    res.status(200).json({
      message: "Feedbacks retrieved successfully",
      count: feedbacks.length,
      feedbacks,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving feedbacks",
      error: error.message,
    });
  }
};

// Delete feedback (Admin only)
exports.deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findByIdAndDelete(id);

    if (!feedback) {
      return res.status(404).json({
        message: "Feedback not found",
      });
    }

    res.status(200).json({
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting feedback",
      error: error.message,
    });
  }
};
