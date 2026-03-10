
const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");
const {
  getLeaderboard,
  getLeaderboardDetails
} = require("../controllers/leaderboardController");

router.get("/", authenticateToken, getLeaderboard);
router.get("/:villageCode/details", authenticateToken, getLeaderboardDetails);

module.exports = router;