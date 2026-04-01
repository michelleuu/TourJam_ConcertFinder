const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Review = require("../models/Review"); // adjust if needed
const CarouselArtist = require("../models/CarouselArtist");

const verifyToken = require("../middleware/authMiddleware");
const verifyAdmin = require("../middleware/verifyAdmin");

// ✅ Get all users
router.get("/users", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete user
router.delete("/users/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get all reviews
router.get("/reviews", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const reviews = await Review.find();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete review
router.delete("/reviews/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// CAROUSEL

router.post("/carousel", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { artistId, name, image } = req.body;

    const exists = await CarouselArtist.findOne({ artistId });
    if (exists) {
      return res.status(400).json({ message: "Artist already in carousel" });
    }

    const artist = new CarouselArtist({ artistId, name, image });
    await artist.save();

    res.json(artist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/carousel/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    await CarouselArtist.findByIdAndDelete(req.params.id);
    res.json({ message: "Artist removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/carousel", async (req, res) => {
  try {
    const artists = await CarouselArtist.find().sort({ addedAt: -1 });
    res.json(artists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;