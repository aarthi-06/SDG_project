const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

/*
 * Get notifications for the logged-in user.
 */
async function getMyNotifications(req, res) {
  try {
    const db = getDB();

    const notificationsCollection =
      db.collection("notifications");

    const username =
      req.user.username;

    if (!username) {
      return res.status(400).json({
        message:
          "Logged-in username is missing"
      });
    }

    const notifications =
      await notificationsCollection
        .find({
          recipientUsername:
            username
        })
        .sort({
          createdAt: -1
        })
        .toArray();

    const unreadCount =
      notifications.filter(
        (notification) =>
          !notification.isRead
      ).length;

    return res.status(200).json({
      count:
        notifications.length,

      unreadCount,

      notifications
    });
  } catch (error) {
    console.error(
      "Error fetching notifications:",
      error
    );

    return res.status(500).json({
      message:
        "Server error while fetching notifications"
    });
  }
}

/*
 * Mark one notification as read.
 */
async function markNotificationAsRead(
  req,
  res
) {
  try {
    const db = getDB();

    const notificationsCollection =
      db.collection("notifications");

    const { notificationId } =
      req.params;

    const username =
      req.user.username;

    if (
      !ObjectId.isValid(
        notificationId
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid notification ID"
      });
    }

    const notification =
      await notificationsCollection.findOne({
        _id:
          new ObjectId(
            notificationId
          ),

        recipientUsername:
          username
      });

    if (!notification) {
      return res.status(404).json({
        message:
          "Notification not found"
      });
    }

    if (notification.isRead) {
      return res.status(200).json({
        message:
          "Notification already marked as read"
      });
    }

    await notificationsCollection.updateOne(
      {
        _id:
          new ObjectId(
            notificationId
          ),

        recipientUsername:
          username
      },
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      }
    );

    return res.status(200).json({
      message:
        "Notification marked as read"
    });
  } catch (error) {
    console.error(
      "Error marking notification as read:",
      error
    );

    return res.status(500).json({
      message:
        "Server error while updating notification"
    });
  }
}

/*
 * Mark all notifications as read.
 */
async function markAllNotificationsAsRead(
  req,
  res
) {
  try {
    const db = getDB();

    const notificationsCollection =
      db.collection("notifications");

    const username =
      req.user.username;

    const result =
      await notificationsCollection.updateMany(
        {
          recipientUsername:
            username,

          isRead: false
        },
        {
          $set: {
            isRead: true,
            readAt: new Date()
          }
        }
      );

    return res.status(200).json({
      message:
        "All notifications marked as read",

      modifiedCount:
        result.modifiedCount
    });
  } catch (error) {
    console.error(
      "Error marking all notifications as read:",
      error
    );

    return res.status(500).json({
      message:
        "Server error while updating notifications"
    });
  }
}

module.exports = {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
};