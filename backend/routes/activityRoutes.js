const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");
const {
  createActivity,
  getActivitiesByVillage,
  updateActivity,
  deleteActivity
} = require("../controllers/activityController");

router.post("/", authenticateToken, createActivity);
router.get("/village/:villageCode", authenticateToken, getActivitiesByVillage);
router.put("/:activityId", authenticateToken, updateActivity);
router.delete("/:activityId", authenticateToken, deleteActivity);

module.exports = router;