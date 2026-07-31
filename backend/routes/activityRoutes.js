const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");
const evidenceUpload = require("../middleware/evidenceUpload");

const {
  createActivity,
  getActivitiesByVillage,
  
  deleteActivity
} = require("../controllers/activityController");

router.post(
  "/",
  authenticateToken,
  evidenceUpload.array("evidence", 5),
  createActivity
);

router.get(
  "/village/:villageCode",
  authenticateToken,
  getActivitiesByVillage
);



router.delete(
  "/:activityId",
  authenticateToken,
  deleteActivity
);

module.exports = router;