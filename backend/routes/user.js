const express = require("express");
const router = express.Router();
const User = require("../models/User");
const verifyToken = require("../middleware/authMiddleware");

// GET
router.get("/genres", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("preferredGenres");

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
