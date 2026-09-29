const Notification = require('../../models/master/Notification');

/**
 * @desc    Get active notifications for users (Customer / All)
 * @route   GET /api/notifications
 * @access  Public
 */
const getNotifications = async (req, res) => {
  try {
    const role = req.user?.role || 'customer';
    const filter = {
      isActive: true,
      targetRole: { $in: ['all', role] },
    };

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    return res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all notifications (Admin)
 * @route   GET /api/notifications/admin
 * @access  Private (Admin)
 */
const getAllNotificationsAdmin = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin notifications',
      error: error.message,
    });
  }
};

/**
 * @desc    Create a new notification (Admin)
 * @route   POST /api/notifications
 * @access  Private (Admin)
 */
const createNotification = async (req, res) => {
  try {
    const { title, description, icon, type, targetRole, isActive } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required',
      });
    }

    const notification = await Notification.create({
      title: title.trim(),
      description: description.trim(),
      icon: icon || 'notifications',
      type: type || 'announcement',
      targetRole: targetRole || 'all',
      isActive: isActive !== undefined ? isActive : true,
    });

    return res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create notification',
      error: error.message,
    });
  }
};

/**
 * @desc    Toggle notification active state (Admin)
 * @route   PATCH /api/notifications/:id/status
 * @access  Private (Admin)
 */
const toggleNotificationStatus = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    notification.isActive = !notification.isActive;
    await notification.save();

    return res.status(200).json({
      success: true,
      message: `Notification ${notification.isActive ? 'activated' : 'paused'}`,
      data: notification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update notification status',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a notification (Admin)
 * @route   DELETE /api/notifications/:id
 * @access  Private (Admin)
 */
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message,
    });
  }
};

module.exports = {
  getNotifications,
  getAllNotificationsAdmin,
  createNotification,
  toggleNotificationStatus,
  deleteNotification,
};
