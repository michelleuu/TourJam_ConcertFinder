const express = require("express");
const router = express.Router();
const User = require("../models/User");
const verifyToken = require("../middleware/authMiddleware");

// GET user profile info
router.get("/", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      "username profileImage preferredGenres spotifyAccessToken",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      username: user.username,
      profileImage: user.profileImage,
      preferredGenres: user.preferredGenres,
      spotifyConnected: !!user.spotifyAccessToken,
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

// Save a concert to the logged-in user's account
router.post("/interested", verifyToken, async (req, res) => {
  try {
    const { concertId, name, date, time, venue, image, url } = req.body;

    if (!concertId) {
      return res.status(400).json({ message: "concertId is required" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadySaved = user.savedConcerts.some(
      (concert) => concert.concertId === concertId,
    );

    if (alreadySaved) {
      return res.status(400).json({ message: "Concert already saved" });
    }

    user.savedConcerts.push({
      concertId,
      name,
      date,
      time,
      venue,
      image,
      url,
    });

    await user.save();
    
    res.status(201).json({
      message: "Concert saved to interested list",
      savedConcerts: user.savedConcerts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save concert" });
  }
});

// Remove a concert from interested list
router.delete("/interested/:concertId", verifyToken, async (req, res) => {
  try {
    const { concertId } = req.params;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.savedConcerts = user.savedConcerts.filter(
      (concert) => concert.concertId !== concertId,
    );

    await user.save();

    res.json({
      message: "Concert removed from interested list",
      savedConcerts: user.savedConcerts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to remove concert" });
  }
});

// Check if a concert is already saved
router.get("/interested/:concertId", verifyToken, async (req, res) => {
  try {
    const { concertId } = req.params;

    const user = await User.findById(req.userId).select("savedConcerts");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isSaved = user.savedConcerts.some(
      (concert) => concert.concertId === concertId,
    );

    res.json({ isSaved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to check saved concert" });
  }
});

// Optional: get all interested concerts for profile page
router.get("/interested", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("savedConcerts");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.savedConcerts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch saved concerts" });
  }
});

module.exports = router;
