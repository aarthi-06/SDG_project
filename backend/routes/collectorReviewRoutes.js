const express = require("express");

const router = express.Router();

const authenticateToken = require(
  "../middleware/authMiddleware"
);

const {
  getFlaggedActivities,
  reviewFlaggedActivity,
  getReviewedActivities
} = require(
  "../controllers/collectorReviewController"
);

router.get(
  "/flagged",
  authenticateToken,
  getFlaggedActivities
);

router.put(
  "/:activityId/decision",
  authenticateToken,
  reviewFlaggedActivity
);

router.get(
  "/reviewed",
  authenticateToken,
  getReviewedActivities
);

module.exports = router;