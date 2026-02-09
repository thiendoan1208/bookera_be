const { Notification, User } = require("../models");
const { Op } = require("sequelize");

/**
 * Create a new notification
 */
const createNotificationService = async ({
  user_id,
  type,
  title,
  content,
  image_url = null,
  reference_type = null,
  reference_id = null,
}) => {
  const notification = await Notification.create({
    user_id,
    type,
    title,
    content,
    image_url,
    reference_type,
    reference_id,
    is_read: false,
  });

  return notification;
};

/**
 * Get notifications for a user with pagination
 */
const getNotificationsService = async (userId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const { count, rows: notifications } = await Notification.findAndCountAll({
    where: { user_id: userId },
    order: [["created_at", "DESC"]],
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  return {
    notifications,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
      hasMore: offset + notifications.length < count,
    },
  };
};

/**
 * Mark a notification as read
 */
const markNotificationAsReadService = async (notificationId, userId) => {
  const notification = await Notification.findOne({
    where: {
      id: notificationId,
      user_id: userId,
    },
  });

  if (!notification) {
    throw new Error("Notification not found");
  }

  await notification.update({ is_read: true });

  return notification;
};

/**
 * Mark all notifications as read for a user
 */
const markAllNotificationsAsReadService = async (userId) => {
  const result = await Notification.update(
    { is_read: true },
    {
      where: {
        user_id: userId,
        is_read: false,
      },
    },
  );

  return { success: true, count: result[0] };
};

/**
 * Get unread notification count
 */
const getUnreadCountService = async (userId) => {
  const count = await Notification.count({
    where: {
      user_id: userId,
      is_read: false,
    },
  });

  return { count };
};

/**
 * Delete old notifications (optional - for cleanup)
 */
const deleteOldNotificationsService = async (userId, daysOld = 30) => {
  const oldDate = new Date();
  oldDate.setDate(oldDate.getDate() - daysOld);

  const result = await Notification.destroy({
    where: {
      user_id: userId,
      created_at: {
        [Op.lt]: oldDate,
      },
      is_read: true,
    },
  });

  return { deleted: result };
};

module.exports = {
  createNotificationService,
  getNotificationsService,
  markNotificationAsReadService,
  markAllNotificationsAsReadService,
  getUnreadCountService,
  deleteOldNotificationsService,
};
