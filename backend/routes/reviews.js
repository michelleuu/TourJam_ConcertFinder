const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const verifyToken = require("../middleware/authMiddleware");


// GET all reviews for a concert
router.get("/:concertId", async (req, res) => {
  try {
    const reviews = await Review.find({ concertId: req.params.concertId });
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
      userId: req.userId,
      username: req.body.username
    });

    await review.save();

    console.log("Review body:", req.body);

    res.json(review);
  } catch (error) {
    res.status(500).json({ error: "Failed to create review" });
  }
});

module.exports = router;