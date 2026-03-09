const express = require("express");
const router = express.Router();
const User = require("../models/User");
const verifyToken = require("../middleware/authMiddleware");

// GET user profile info
router.get("/", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      "username profileImage preferredGenres",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      username: user.username,
      profileImage: user.profileImage,
      preferredGenres: user.preferredGenres,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT update user profile info
router.put("/", verifyToken, async (req, res) => {
  try {
    const { username, profileImage, preferredGenres } = req.body;

    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (profileImage !== undefined) updateData.profileImage = profileImage; // allow empty string
    if (preferredGenres !== undefined)
      updateData.preferredGenres = preferredGenres;

    const updatedUser = await User.findByIdAndUpdate(req.userId, updateData, {
      new: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      username: updatedUser.username,
      profileImage: updatedUser.profileImage,
      preferredGenres: updatedUser.preferredGenres,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error updating profile" });
  }
});

module.exports = router;
