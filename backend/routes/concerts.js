const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const User = require("../models/User");

function getStartDateTime() {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, "0");

  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(
    now.getUTCDate(),
  )}T${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(
    now.getUTCSeconds(),
  )}Z`;
}

const GENRE_ID_MAP = {
  pop: "KnvZfZ7vAev",
  "r&b": "KnvZfZ7vAee",
  rb: "KnvZfZ7vAee",
  rock: "KnvZfZ7vAeA",
  "hip hop": "KnvZfZ7vAv1",
  "hip-hop": "KnvZfZ7vAv1",
  rap: "KnvZfZ7vAv1",
  jazz: "KnvZfZ7vAvE",
  country: "KnvZfZ7vAv6",
  metal: "KnvZfZ7vAvt",
  alternative: "KnvZfZ7vAvv",
  classical: "KnvZfZ7vAeJ",
  dance: "KnvZfZ7vAvF",
  electronic: "KnvZfZ7vAvF",
  "dance/electronic": "KnvZfZ7vAvF",
  folk: "KnvZfZ7vAva",
};

const COUNTRY_CODE_MAP = {
  canada: "CA",
  ca: "CA",
  usa: "US",
  us: "US",
  "united states": "US",
  uk: "GB",
  "united kingdom": "GB",
  britain: "GB",
  england: "GB",
  australia: "AU",
  au: "AU",
};

function normalizeGenreKey(value = "") {
  return value.trim().toLowerCase();
}

function parseGenres(rawGenre) {
  if (!rawGenre) return [];
  return rawGenre
    .split(",")
    .map((g) => normalizeGenreKey(g))
    .filter(Boolean);
}

router.get("/", async (req, res) => {
  try {
    const {
      location = "",
      keyword = "",
      genre = "",
      startDate = "",
      endDate = "",
      page = "0",
      size = "100",
    } = req.query;

    const trimmedLocation = location.trim();
    const trimmedKeyword = keyword.trim();
    const parsedGenres = parseGenres(genre);

    let city = "";
    let countryCode = "";

    if (trimmedLocation) {
      const normalizedLocation = trimmedLocation.toLowerCase();
      if (COUNTRY_CODE_MAP[normalizedLocation]) {
        countryCode = COUNTRY_CODE_MAP[normalizedLocation];
      } else {
        city = trimmedLocation;
      }
    }

    const genreIds = parsedGenres.map((g) => GENRE_ID_MAP[g]).filter(Boolean);

    const params = new URLSearchParams({
      apikey: process.env.TM_API_KEY,
      classificationName: "music",
      sort: "date,asc",
      size: String(Number(size) || 40),
      page: String(Number(page) || 0),
      startDateTime: startDate ? `${startDate}T00:00:00Z` : getStartDateTime(),
    });

    if (city) params.set("city", city);
    if (countryCode) params.set("countryCode", countryCode);
    if (trimmedKeyword) params.set("keyword", trimmedKeyword);
    if (genreIds.length > 0) params.set("genreId", genreIds.join(","));
    if (endDate) params.set("endDateTime", `${endDate}T23:59:59Z`);

    const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`;

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
    const events = data?._embedded?.events || [];
    const pageInfo = data?.page || {};

    res.json({
      concerts: events,
      page: pageInfo.number ?? Number(page) ?? 0,
      size: pageInfo.size ?? Number(size) ?? 40,
      totalElements: pageInfo.totalElements ?? events.length,
      totalPages: pageInfo.totalPages ?? 1,
    });
  } catch (err) {
    console.error("Failed to fetch concerts:", err);
    res.status(500).json({ message: "Failed to fetch concerts" });
  }
});

// Logged in users only - Recommended concerts based on genre
router.get("/recommended", verifyToken, async (req, res) => {
  try {
    const API_KEY = process.env.TM_API_KEY;
    const user = await User.findById(req.userId).select("preferredGenres");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const genreIds = (user.preferredGenres || [])
      .map((g) => GENRE_ID_MAP[normalizeGenreKey(g)])
      .filter(Boolean);

    if (genreIds.length === 0) {
      return res.json([]);
    }

    const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${API_KEY}&classificationName=music&genreId=${genreIds.join(
      ",",
    )}&sort=relevance,desc&size=50`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TourJam/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`Ticketmaster API error: ${response.status}`);
    }

    const data = await response.json();
    const events = data?._embedded?.events || [];

    const seenArtists = new Set();
    const filteredEvents = events.filter((event) => {
      const artistName = event?._embedded?.attractions?.[0]?.name;
      if (!artistName) return false;
      if (seenArtists.has(artistName)) return false;
      seenArtists.add(artistName);
      return true;
    });

    res.json(filteredEvents.slice(0, 10));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch recommended concerts" });
  }
});

// Public - Featured concerts for dashboard header carousel
router.get("/featured", async (req, res) => {
  try {
    const API_KEY = process.env.TM_API_KEY;

    const featuredArtists = ["Ariana Grande", "ASAP Rocky", "Don Toliver"];
    const requests = featuredArtists.map(async (artist) => {
      const params = new URLSearchParams({
        apikey: API_KEY,
        classificationName: "music",
        keyword: artist,
        sort: "relevance,desc",
        size: "1",
      });

      const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; TourJam/1.0)",
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data?._embedded?.events?.[0] || null;
    });

    const concerts = (await Promise.all(requests)).filter(Boolean);

    res.json({ concerts });
  } catch (err) {
    console.error("Failed to fetch featured dashboard concerts:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch featured dashboard concerts" });
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
