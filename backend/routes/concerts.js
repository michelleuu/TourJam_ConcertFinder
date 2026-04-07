const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const User = require("../models/User");
const CarouselArtist = require("../models/CarouselArtist"); // add at top of file
const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

//for refreshing the spoitfy token when the original token expires
async function refreshSpotifyToken(refreshToken) {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(client_id + ":" + client_secret).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const data = await response.json();

  if (!data.access_token) {
    throw new Error(data.error || "Failed to refresh Spotify token");
  }

  return data.access_token;
}

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
      size = "10",
      sort = "",
    } = req.query;

    const trimmedLocation = location.trim();
    const trimmedKeyword = keyword.trim();
    const parsedGenres = parseGenres(genre);

    let city = "";
    let countryCode = "";

    // Figure out whether the location is a city or a country
    if (trimmedLocation) {
      const normalizedLocation = trimmedLocation.toLowerCase();

      if (COUNTRY_CODE_MAP[normalizedLocation]) {
        countryCode = COUNTRY_CODE_MAP[normalizedLocation];
      } else {
        city = trimmedLocation;
      }
    }

    // Convert selected genres into Ticketmaster genre IDs
    const genreIds = parsedGenres.map((g) => GENRE_ID_MAP[g]).filter(Boolean);

    // Base Ticketmaster params
    const params = new URLSearchParams({
      apikey: process.env.TM_API_KEY,
      classificationName: "music",
      size: String(Number(size) || 10),
      page: String(Number(page) || 0),
      startDateTime: startDate ? `${startDate}T00:00:00Z` : getStartDateTime(),
    });

    // Apply sort only if frontend sends one
    // Your frontend now sends sort=date,asc so pagination stays in date order
    if (sort) {
      params.set("sort", sort);
    }

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
      size: pageInfo.size ?? Number(size) ?? 10,
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

    const params = new URLSearchParams({
      apikey: API_KEY,
      classificationName: "music",
      genreId: genreIds.join(","),
      sort: "relevance,desc",
      size: "30",
    });

    const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TourJam/1.0)",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Ticketmaster /recommended failed:",
        response.status,
        errorText,
      );

      // Do not crash the page because upstream failed
      return res.json([]);
    }

    const data = await response.json();
    const events = Array.isArray(data?._embedded?.events)
      ? data._embedded.events
      : [];

    const seenArtists = new Set();
    const filteredEvents = events.filter((event) => {
      const artistName = event?._embedded?.attractions?.[0]?.name;
      if (!artistName) return false;
      if (seenArtists.has(artistName)) return false;
      seenArtists.add(artistName);
      return true;
    });

    return res.json(filteredEvents.slice(0, 7));
  } catch (err) {
    console.error("Failed to fetch recommended concerts:", err);
    return res.json([]);
  }
});

// Public - Featured concerts for dashboard header carousel
router.get("/featured", async (req, res) => {
  try {
    const API_KEY = process.env.TM_API_KEY;

    const { size = "20", page = "0", startDate = "", sort = "" } = req.query;

    const artistsFromDB = await CarouselArtist.find();

    const featuredArtists =
      artistsFromDB.length > 0
        ? artistsFromDB.map((a) => a.name)
        : ["Ariana Grande", "A$AP Rocky", "Don Toliver"];

    const requests = featuredArtists.map(async (artist) => {
      const params = new URLSearchParams({
        apikey: API_KEY,
        classificationName: "music",
        size: String(Number(size) || 20),
        page: String(Number(page) || 0),
        startDateTime: startDate
          ? `${startDate}T00:00:00Z`
          : getStartDateTime(),
      });

      params.set("keyword", artist);

      // Optional sorting
      if (sort === "date") {
        params.set("sort", "date,asc");
      } else if (sort === "name") {
        params.set("sort", "name,asc");
      } else if (sort === "name_desc") {
        params.set("sort", "name,desc");
      }

      const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`;

      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; TourJam/1.0)",
          },
        });

        if (!response.ok) {
          console.log(`${artist}: failed with ${response.status}`);
          return null;
        }

        const data = await response.json();
        const events = data?._embedded?.events || [];

        if (events.length === 0) return null;

        return events[0]; // take first event per artist
      } catch (err) {
        console.log(`${artist}: fetch error -> ${err.message}`);
        return null;
      }
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

// Logged in users only - GET Favourite Artsists from Spotify API
// and then fetch availalbe concerts of artists from TM API
router.get("/spotify-favourites", verifyToken, async (req, res) => {
  try {
    const API_KEY = process.env.TM_API_KEY;
    const user = await User.findById(req.userId).select(
      "spotifyAccessToken spotifyRefreshToken",
    );

    if (!user || !user.spotifyAccessToken) {
      return res.status(400).json({ message: "Spotify not connected" });
    }

    // Fetch top artists from SPOTIFY API
    // Source: https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
    let spotifyRes = await fetch(
      "https://api.spotify.com/v1/me/top/artists?limit=6",
      {
        headers: {
          Authorization: `Bearer ${user.spotifyAccessToken}`,
        },
      },
    );

    if (spotifyRes.status === 401 && user.spotifyRefreshToken) {
      // Refresh token
      const newToken = await refreshSpotifyToken(user.spotifyRefreshToken);
      user.spotifyAccessToken = newToken;
      await user.save();

      // Retry
      spotifyRes = await fetch(
        "https://api.spotify.com/v1/me/top/artists?limit=5",
        {
          headers: { Authorization: `Bearer ${newToken}` },
        },
      );
    }

    if (!spotifyRes.ok) {
      throw Error(`Spotify API error: ${spotifyRes.status}`);
    }
    const spotifyData = await spotifyRes.json();

    const favouriteArtists = spotifyData.items || [];

    //fetch availalbe concerts
    const artistConcerts = await Promise.all(
      favouriteArtists.map(async (artistObj) => {
        const artist = {
          id: artistObj.id,
          name: artistObj.name,
          image: artistObj.images?.[0]?.url || "",
        };

        const params = new URLSearchParams({
          apikey: API_KEY,
          classificationName: "music",
          keyword: artist.name,
          sort: "relevance,desc",
          size: "10",
        });

        const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`;

        try {
          const response = await fetch(url);

          if (!response.ok) {
            return { artist, concerts: [] };
          }

          const data = await response.json();
          const concerts = data?._embedded?.events || [];

          return { artist, concerts };
        } catch (err) {
          console.log(`${artist}: fetch error -> ${err.message}`);
          return { artist, concerts: [] };
        }
      }),
    );

    res.json({ favouriteArtists: artistConcerts });
  } catch (err) {
    console.error("Failed to fetch Spotify favourite artists:", err);
    res.status(500).json({
      message: "Failed to fetch Spotify artists",
      error: err.message,
    });
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
