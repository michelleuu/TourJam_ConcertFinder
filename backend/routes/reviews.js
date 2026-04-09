const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const verifyToken = require("../middleware/authMiddleware");

// GET reviews for logged-in user
router.get("/user", verifyToken, async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.userId }).populate(
      "userId",
      "username profileImage",
    );

    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch user reviews" });
  }
});

// GET all reviews for a concert
router.get("/:concertId", async (req, res) => {
  try {
    const reviews = await Review.find({
      concertId: req.params.concertId,
    }).populate("userId", "username profileImage");

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// CREATE review (protected)
router.post("/", verifyToken, async (req, res) => {
  try {
    const review = new Review({
      concertId: req.body.concertId,
      rating: req.body.rating,
      comment: req.body.comment,

      // IMPORTANT: use token-based user
      userId: req.userId,

      username: req.body.username,
      owner: req.userId,
    });

    await review.save();

    const populatedReview = await Review.findById(review._id).populate(
      "userId",
      "username profileImage",
    );

    res.json(populatedReview);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create review" });
  }
});

// DELETE review (only owner can delete)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // ownership check
    if (review.userId.toString() !== req.userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this review" });
    }

    await Review.findByIdAndDelete(req.params.id);

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete review" });
  }
});

router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Ownership check
    if (review.userId.toString() !== req.userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    review.rating = rating;
    review.comment = comment;

    await review.save();

    const updatedReview = await Review.findById(review._id).populate(
      "userId",
      "username profileImage",
    );

    res.json(updatedReview);

    res.json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update review" });
  }
});

module.exports = router;
