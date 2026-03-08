const express = require("express");
const router = express.Router();
const User = require("../models/User");
const verifyToken = require("../middleware/authMiddleware");

// GET preferred genres for logged-in user
router.get("/", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("preferredGenres");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ preferredGenres: user.preferredGenres });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
