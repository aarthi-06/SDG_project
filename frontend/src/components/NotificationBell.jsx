import { useEffect, useRef, useState } from "react";
import {
  Bell,
  CheckCheck,
  CircleCheck,
  CircleX,
  Loader2
} from "lucide-react";

import { authFetch } from "../services/authFetch";
import "../styles/notificationBell.css";

function NotificationBell() {
  const [notifications, setNotifications] =
    useState([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [isOpen, setIsOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const dropdownRef = useRef(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target
        )
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const data =
        await authFetch("/notifications");

      setNotifications(
        Array.isArray(data.notifications)
          ? data.notifications
          : []
      );

      setUnreadCount(
        Number(data.unreadCount) || 0
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to load notifications"
      );
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (
    notification
  ) => {
    if (notification.isRead) {
      return;
    }

    try {
      await authFetch(
        `/notifications/${notification._id}/read`,
        {
          method: "PUT"
        }
      );

      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id
            ? {
                ...item,
                isRead: true,
                readAt: new Date().toISOString()
              }
            : item
        )
      );

      setUnreadCount((current) =>
        Math.max(0, current - 1)
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to update notification"
      );
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) {
      return;
    }

    try {
      await authFetch(
        "/notifications/read-all",
        {
          method: "PUT"
        }
      );

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          isRead: true,
          readAt:
            item.readAt ||
            new Date().toISOString()
        }))
      );

      setUnreadCount(0);
    } catch (err) {
      setError(
        err.message ||
          "Unable to mark notifications as read"
      );
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "";
    }

    return new Date(
      dateValue
    ).toLocaleString();
  };

  return (
    <div
      className="notification-wrapper"
      ref={dropdownRef}
    >
      <button
        type="button"
        className="notification-bell-button"
        onClick={() =>
          setIsOpen((current) => !current)
        }
        aria-label="Open notifications"
      >
        <Bell size={21} />

        {unreadCount > 0 && (
          <span className="notification-count">
            {unreadCount > 9
              ? "9+"
              : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <div>
              <h3>Notifications</h3>

              <p>
                {unreadCount} unread
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                className="mark-all-button"
                onClick={markAllAsRead}
              >
                <CheckCheck size={16} />
                Mark all read
              </button>
            )}
          </div>

          {error && (
            <div className="notification-error">
              {error}
            </div>
          )}

          <div className="notification-list">
            {loading ? (
              <div className="notification-state">
                <Loader2
                  size={22}
                  className="notification-spinner"
                />
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-state">
                <Bell size={26} />
                <strong>
                  No notifications
                </strong>
                <span>
                  Collector decisions will
                  appear here.
                </span>
              </div>
            ) : (
              notifications.map(
                (notification) => {
                  const approved =
                    notification.decision ===
                    "APPROVED";

                  return (
                    <button
                      key={notification._id}
                      type="button"
                      className={`notification-item ${
                        notification.isRead
                          ? "read"
                          : "unread"
                      }`}
                      onClick={() =>
                        markAsRead(
                          notification
                        )
                      }
                    >
                      <span
                        className={`notification-icon ${
                          approved
                            ? "approved"
                            : "rejected"
                        }`}
                      >
                        {approved ? (
                          <CircleCheck
                            size={20}
                          />
                        ) : (
                          <CircleX
                            size={20}
                          />
                        )}
                      </span>

                      <span className="notification-content">
                        <span className="notification-title-row">
                          <strong>
                            {
                              notification.title
                            }
                          </strong>

                          {!notification.isRead && (
                            <span className="unread-dot" />
                          )}
                        </span>

                        <span className="notification-message">
                          {
                            notification.message
                          }
                        </span>

                        {notification.collectorRemarks && (
                          <span className="notification-remarks">
                            <b>Remarks:</b>{" "}
                            {
                              notification.collectorRemarks
                            }
                          </span>
                        )}

                        <span className="notification-time">
                          {formatDate(
                            notification.createdAt
                          )}
                        </span>
                      </span>
                    </button>
                  );
                }
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;