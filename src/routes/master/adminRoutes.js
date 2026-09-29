const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getCustomers,
  toggleCustomerStatus,
  getAppSettings,
  updateAppSettings,
} = require('../../controllers/master/adminController');
const { protect, requireAdmin } = require('../../middlewares/authMiddleware');

router.use(protect, requireAdmin);

router.get('/stats', getDashboardStats);
router.get('/customers', getCustomers);
router.patch('/customers/:id/status', toggleCustomerStatus);

// Platform settings — registration fee, etc.
router.get('/settings', getAppSettings);
router.patch('/settings', updateAppSettings);

module.exports = router;
