const express = require('express');
const router = express.Router();
const searchRoutes = require('./searchRoutes');
const inquiryRoutes = require('./inquiryRoutes');

router.use('/search', searchRoutes);
router.use('/inquiries', inquiryRoutes);

module.exports = {
  router,
  searchRoutes,
  inquiryRoutes
};
