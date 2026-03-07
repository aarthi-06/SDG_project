const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");
const {
  getPanchayats,
  getSinglePanchayat
} = require("../controllers/panchayatController");

router.get("/", authenticateToken, getPanchayats);
router.get("/:villageCode", authenticateToken, getSinglePanchayat);

module.exports = router;