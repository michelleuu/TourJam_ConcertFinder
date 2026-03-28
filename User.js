const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  profileImage: {
    type: String,
    default: "",
  },
  preferredGenres: {
    type: [String],
    default: [],
  },
  savedConcerts: {
    type: [
      {
        concertId: { type: String, required: true },
        name: String,
        date: String,
        venue: String,
        image: String,
        url: String,
        savedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    default: [],
  },
});

module.exports = mongoose.model("User", UserSchema);
