const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/master/notificationController');
const { protect, requireAdmin } = require('../../middlewares/authMiddleware');

// Public route to fetch active notifications
router.get('/', notificationController.getNotifications);

// Admin-only management routes
router.get('/admin', protect, requireAdmin, notificationController.getAllNotificationsAdmin);
router.post('/', protect, requireAdmin, notificationController.createNotification);
router.patch('/:id/status', protect, requireAdmin, notificationController.toggleNotificationStatus);
router.delete('/:id', protect, requireAdmin, notificationController.deleteNotification);

module.exports = router;
