require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const concertRoutes = require("./routes/concerts");
const userRoutes = require("./routes/user");
const reviewRoutes = require("./routes/reviews"); //for reviews
const spotifyAuthRoutes = require("./routes/spotifyAuth"); // for spotify authentication
const artistRoutes = require("./routes/artists");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = 5001;

app.use(cors({ origin: ["http://localhost:3000", "http://127.0.0.1:3000"] }));
app.use(express.json());

// database connection
const uri = process.env.MONGO_URI;

const clientOptions = {
  serverApi: { version: "1", strict: true, deprecationErrors: true },
};

async function connectDB() {
  try {
    await mongoose.connect(uri, clientOptions);

    // optional: the "Ping" command just confirms everything is working
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log("✅ Pinged the db. You successfully connected to MongoDB!");
  } catch (err) {
    console.error("❌ Connection failed:", err);
    // If the DB is down, we might want to stop the server
    // process.exit(1);
  }
}

// execute the connection function
connectDB();

// routes
app.use("/api/auth", authRoutes);
app.use("/api/concerts", concertRoutes);
app.use("/api/genres", userRoutes);
app.use("/api/profile", userRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/spotify", spotifyAuthRoutes);
app.use("/api/artists", artistRoutes);
app.use("/api/admin", adminRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});