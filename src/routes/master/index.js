const express = require('express');
const router = express.Router();
const categoryRoutes = require('./categoryRoutes');
const adminRoutes = require('./adminRoutes');
const bannerRoutes = require('./bannerRoutes');
const notificationRoutes = require('./notificationRoutes');

router.use('/categories', categoryRoutes);
router.use('/admin', adminRoutes);
router.use('/banners', bannerRoutes);
router.use('/notifications', notificationRoutes);

module.exports = {
  router,
  categoryRoutes,
  adminRoutes,
  bannerRoutes,
  notificationRoutes,
};
