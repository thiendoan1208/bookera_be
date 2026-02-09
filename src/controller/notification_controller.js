const {
  getNotificationsService,
  markNotificationAsReadService,
  markAllNotificationsAsReadService,
  getUnreadCountService,
} = require("../services/notification_service");

/**
 * Get notifications for authenticated user
 */
const getNotificationsController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const result = await getNotificationsService(userId, page, limit);

    res.status(200).json({
      message: "Notifications retrieved successfully",
      data: result.notifications,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      message: "Failed to get notifications",
      error: error.message,
    });
  }
};

/**
 * Mark a notification as read
 */
const markNotificationAsReadController = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const notification = await markNotificationAsReadService(
      notificationId,
      userId,
    );

    res.status(200).json({
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    console.error("Mark notification as read error:", error);

    if (error.message === "Notification not found") {
      return res.status(404).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
};

/**
 * Mark all notifications as read
 */
const markAllNotificationsAsReadController = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await markAllNotificationsAsReadService(userId);

    res.status(200).json({
      message: "All notifications marked as read",
      data: result,
    });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);
    res.status(500).json({
      message: "Failed to mark all notifications as read",
      error: error.message,
    });
  }
};

/**
 * Get unread notification count
 */
const getUnreadCountController = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await getUnreadCountService(userId);

    res.status(200).json({
      message: "Unread count retrieved successfully",
      data: result,
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      message: "Failed to get unread count",
      error: error.message,
    });
  }
};

module.exports = {
  getNotificationsController,
  markNotificationAsReadController,
  markAllNotificationsAsReadController,
  getUnreadCountController,
};
