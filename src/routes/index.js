const express = require('express');
const router = express.Router();

// Domain Routers
const master = require('./master');
const professional = require('./professional');
const customer = require('./customer');
const common = require('./common');
const paymentRoutes = require('./paymentRoutes');

// 1. Domain-specific namespaced routes
router.use('/master', master.router);
router.use('/professional', professional.router);
router.use('/customer', customer.router);
router.use('/common', common.router);

// 2. Direct API routes (Preserving 100% backward compatibility for mobile & web clients)
router.use('/auth', common.authRoutes);
router.use('/categories', master.categoryRoutes);
router.use('/banners', master.bannerRoutes);
router.use('/notifications', master.notificationRoutes);
router.use('/professionals', professional.professionalRoutes);
router.use('/documents', professional.documentRoutes);
router.use('/search', customer.searchRoutes);
router.use('/inquiries', customer.inquiryRoutes);
router.use('/conversations', common.conversationRoutes);
router.use('/admin', master.adminRoutes);
router.use('/payments', paymentRoutes);

module.exports = {
  apiRouter: router,
  Master: master,
  Professional: professional,
  Customer: customer,
  Common: common,

  // Direct subroutes
  categoryRoutes: master.categoryRoutes,
  adminRoutes: master.adminRoutes,
  bannerRoutes: master.bannerRoutes,
  notificationRoutes: master.notificationRoutes,
  professionalRoutes: professional.professionalRoutes,
  documentRoutes: professional.documentRoutes,
  searchRoutes: customer.searchRoutes,
  inquiryRoutes: customer.inquiryRoutes,
  authRoutes: common.authRoutes,
  conversationRoutes: common.conversationRoutes
};
