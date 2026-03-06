const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");

// Helper to format startDateTime
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
  const city = "Vancouver";
  const countryCode = "CA";
  const startDateTime = getStartDateTime();
  const size = 5;

  const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${API_KEY}&city=${encodeURIComponent(
    city,
  )}&countryCode=${countryCode}&classificationName=music&startDateTime=${startDateTime}&size=${size}`;

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
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${API_KEY}&classificationName=music&keyword=Pop&size=5`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TourJam/1.0)",
      },
    });
    if (!response.ok) {
      throw new Error(
        `Ticketmaster API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    res.json(data._embedded?.events || []);
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
