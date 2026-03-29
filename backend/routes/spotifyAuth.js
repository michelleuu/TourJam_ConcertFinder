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

  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
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
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.spotifyAccessToken = data.access_token;
    await user.save();

    res.json({
      message: "Spotify connected successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

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

module.exports = router;

