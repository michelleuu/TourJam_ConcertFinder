const express = require("express");
const router = express.Router();

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

router.get("/", async (req, res) => {
  const API_KEY = process.env.TM_API_KEY;
  const city = "Vancouver";
  const countryCode = "CA";
  const startDateTime = getStartDateTime();
  const size = 10;

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

module.exports = router;
