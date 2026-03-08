const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const User = require("../models/User");

// Helper to format startDateTime since ticket master requires this specific format
function getStartDateTime() {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, "0");
  const year = now.getUTCFullYear();
  const month = pad(now.getUTCMonth() + 1);
  const day = pad(now.getUTCDate());
  const hours = pad(now.getUTCHours());
  const minutes = pad(now.getUTCMinutes());
  const seconds = pad(now.getUTCSeconds());
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
}

// Public - GET a list of concerts
router.get("/", async (req, res) => {
  const API_KEY = process.env.TM_API_KEY;
  const city = req.query.city || "Vancouver";
  const countryCode = "CA";
  const size = 10;

  const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${API_KEY}&city=${encodeURIComponent(
    city,
  )}&countryCode=${countryCode}&classificationName=music&size=${size}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Ticketmaster API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    if (data._embedded && data._embedded.events) {
      res.json(data._embedded.events);
    } else {
      res.json({ message: "No concerts found." });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: err.message });
  }
});

// Logged in users only - Recommended Concerts based on genre
router.get("/recommended", verifyToken, async (req, res) => {
  const API_KEY = process.env.TM_API_KEY;

  try {
    const user = await User.findById(req.userId).select("preferredGenres");
    if (!user) return res.status(404).json({ message: "User not found" });

    const genreMap = {
      pop: "KnvZfZ7vAev",
      "r&b": "KnvZfZ7vAee",
      rock: "KnvZfZ7vAeA",
      "hip hop": "KnvZfZ7vAv1",
      rap: "KnvZfZ7vAv1",
      jazz: "KnvZfZ7vAvE",
      country: "KnvZfZ7vAv6",
      metal: "KnvZfZ7vAvt",
      alternative: "KnvZfZ7vAvv",
      classical: "KnvZfZ7vAeJ",
      dance: "KnvZfZ7vAvF",
      electronic: "KnvZfZ7vAvF",
      folk: "KnvZfZ7vAva",
    };

    // Map user genres to IDs
    const genreIds = user.preferredGenres
      .map((g) => genreMap[g.trim().toLowerCase()])
      .filter(Boolean);
    if (genreIds.length === 0) return res.json([]);
    console.log("Genre IDs:", genreIds);

    const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${API_KEY}&classificationName=music&genreId=${genreIds.join(",")}&sort=relevance,desc&size=50`;
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TourJam/1.0)" },
    });
    if (!response.ok)
      throw new Error(`Ticketmaster API error: ${response.status}`);

    const data = await response.json();
    const events = data._embedded?.events || [];

    // Deduplicate by artist
    const seenArtists = new Set();
    const filteredEvents = events.filter((event) => {
      const artistName = event._embedded?.attractions?.[0]?.name;
      if (!artistName) return false; // skip events without artist info
      if (seenArtists.has(artistName)) return false; // already included
      seenArtists.add(artistName);
      return true;
    });

    // Limit to top 10 events after dedup
    res.json(filteredEvents.slice(0, 10));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch recommended concerts" });
  }
});

// Public - GET concert by id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const API_KEY = process.env.TM_API_KEY;
  const url = `https://app.ticketmaster.com/discovery/v2/events/${id}.json?apikey=${API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Ticketmaster API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch concert" });
  }
});

module.exports = router;
