require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { connectDB } = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const panchayatRoutes = require("./routes/panchayatRoutes");
const profileRoutes = require("./routes/profileRoutes");
const activityRoutes = require("./routes/activityRoutes");
const indicatorRoutes = require("./routes/indicatorRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://legendary-space-acorn-pjg7xxvxrvvvf75pj-5173.app.github.dev"
     
    ],
    credentials: true
  })
);
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/panchayats", panchayatRoutes);
app.use("/profiles", profileRoutes);
app.use("/activities", activityRoutes);
app.use("/indicators", indicatorRoutes);
app.use("/leaderboard", leaderboardRoutes);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
});