const express = require("express");
const {
  getNotificationsController,
  markNotificationAsReadController,
  markAllNotificationsAsReadController,
  getUnreadCountController,
} = require("../controller/notification_controller");
const { verifyAuth } = require("../middleware/auth_middleware");

const notificationRoutes = express.Router();

// All notification routes require authentication
notificationRoutes.use(verifyAuth);

// Get notifications with pagination
notificationRoutes.get("/", getNotificationsController);

// Get unread count
notificationRoutes.get("/unread-count", getUnreadCountController);

// Mark notification as read
notificationRoutes.patch("/:id/read", markNotificationAsReadController);

// Mark all notifications as read
notificationRoutes.patch("/read-all", markAllNotificationsAsReadController);

module.exports = {
  notificationRoutes,
};
