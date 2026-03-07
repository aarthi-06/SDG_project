const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");
const {
  getProfileByVillage,
  upsertProfile
} = require("../controllers/profileController");

router.get("/:villageCode", authenticateToken, getProfileByVillage);
router.put("/:villageCode", authenticateToken, upsertProfile);

module.exports = router;