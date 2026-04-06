const express = require("express");
const router = express.Router();

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

// Get Spotify app token for verification
async function getSpotifyToken() {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(client_id + ":" + client_secret).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
    }),
  });

  const data = await response.json();
  return data.access_token;
}

router.get("/search", async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) {
      return res.status(400).json({ message: "Missing query" });
    }

    const token = await getSpotifyToken();

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=5`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Spotify search failed: ${response.status}`);
    }

    const data = await response.json();

    const artists = data.artists.items.map((artist) => ({
      id: artist.id,
      name: artist.name,
      images: artist.images,
    }));

    res.json(artists);
  } catch (err) {
    console.error("Spotify search error:", err);
    res.status(500).json({ message: "Spotify search failed" });
  }
});

// Fetch artist info by artist name
router.get("/:name", async (req, res) => {
  try {
    const artistName = req.params.name;

    const token = await getSpotifyToken();

    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        artistName,
      )}&type=artist&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!searchResponse.ok) {
      throw new Error(`Spotify search failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();

    const artist = searchData.artists?.items?.[0];

    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }

    let bio = "";

    try {
      // Search Wikipedia first
      // wikipedia bio resoruce: https://wikitech.wikimedia.org/wiki/API_Portal/Deprecation#Core_API 
      // reference: https://stackoverflow.com/questions/50518380/artist-information-with-wikipedia-api 
      const wikiSearch = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
          artist.name
        )}&format=json&origin=*`
      );

      const wikiSearchData = await wikiSearch.json();

      const firstResult = wikiSearchData.query?.search?.[0];

      if (firstResult) {
        const pageTitle = firstResult.title;

        const wikiSummary = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
            pageTitle
          )}`
        );

        if (wikiSummary.ok) {
          const wikiData = await wikiSummary.json();
          bio = wikiData.extract || "";
        }
      }
    } catch (wikiErr) {
      console.error("Wikipedia fetch failed:", wikiErr);
    }

    // Return only useful fields
    res.json({
      id: artist.id,
      name: artist.name,
      genres: artist.genres,
      followers: artist.followers.total,
      popularity: artist.popularity,
      image: artist.images?.[0]?.url || "",
      spotifyUrl: artist.external_urls.spotify,
      bio,
    });
  } catch (err) {
    console.error("Failed to fetch artist:", err);
    res.status(500).json({ message: "Failed to fetch artist" });
  }
});



module.exports = router;