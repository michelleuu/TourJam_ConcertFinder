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

// PUT update preferred genres for logged-in user
router.put("/", verifyToken, async (req, res) => {
  try {
    const {preferredGenres} = req.body;

    //findbyIDandUpdate: https://www.geeksforgeeks.org/mongodb/mongoose-findbyidandupdate-function/
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { preferredGenres: preferredGenres },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({preferredGenres: updatedUser.preferredGenres});

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error updating genres" });
    }
});

module.exports = router;
