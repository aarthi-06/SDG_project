const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");
const { getIndicators } = require("../controllers/indicatorController");

router.get("/", authenticateToken, getIndicators);

module.exports = router;