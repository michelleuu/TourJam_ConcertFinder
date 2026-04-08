const express = require("express");
const router = express.Router();
const querystring = require("querystring");
const verifyToken = require("../middleware/authMiddleware");
const User = require("../models/User");

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = "http://127.0.0.1:3000/callback";

//Redirect into a new page for Spotify login
//sourced from Spotify Developers Documentation: https://developer.spotify.com/documentation/web-api/tutorials/code-flow 
router.get('/login', function(req, res) {
  const scope = 'user-read-private user-read-email user-top-read user-follow-read';

  const token = req.query.token;

  if (!token) {
    return res.status(400).send("Missing token");
  }

  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state:token,
    }));
});

// Request an Access Token
router.post("/token", verifyToken, async (req, res) => {
  try {
    const { code } = req.body;

    const authResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(client_id + ":" + client_secret).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirect_uri,
      }),
    });

    const data = await authResponse.json();
    //console.log("Spotify token response:", data);

    if (!data.access_token) {
      return res.status(400).json({
        error: data.error,
        description: data.error_description,
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.spotifyAccessToken = data.access_token;

    if (data.refresh_token) {
      user.spotifyRefreshToken = data.refresh_token;
    }
    await user.save();

    const updatedUser = await User.findById(req.userId);
    //console.log("Saved user:", updatedUser);

    res.json({
      message: "Spotify connected successfully",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

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

//refresh the Api Token when time expires
router.post("/refresh", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("spotifyRefreshToken spotifyAccessToken");
    if (!user || !user.spotifyRefreshToken) {
      return res.status(400).json({ message: "Spotify not connected or no refresh token" });
    }

    const newAccessToken = await refreshSpotifyToken(user.spotifyRefreshToken);

    // Save the new access token to the user
    user.spotifyAccessToken = newAccessToken;
    await user.save();

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error("Spotify token refresh failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

//check user status if they are connected with spotify account
router.get("/status", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("spotifyAccessToken spotifyRefreshToken");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const connected = !!(user.spotifyAccessToken || user.spotifyRefreshToken);

    res.json({ connected });
  } catch (err) {
    console.error("Spotify status check failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

