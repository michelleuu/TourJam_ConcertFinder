const mongoose = require("mongoose");

const carouselArtistSchema = new mongoose.Schema({
  artistId: { type: String, required: true }, // Spotify or external API ID
  name: { type: String, required: true },
  image: { type: String },
  addedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("CarouselArtist", carouselArtistSchema);