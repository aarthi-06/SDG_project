const express = require("express");
const router = express.Router();

const authenticateToken =
  require("../middleware/authMiddleware");

const {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} = require(
  "../controllers/notificationController"
);

router.get(
  "/",
  authenticateToken,
  getMyNotifications
);

router.put(
  "/read-all",
  authenticateToken,
  markAllNotificationsAsRead
);

router.put(
  "/:notificationId/read",
  authenticateToken,
  markNotificationAsRead
);

module.exports = router;