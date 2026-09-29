// Master Controllers
const categoryController = require('./master/categoryController');
const adminController = require('./master/adminController');
const bannerController = require('./master/bannerController');
const notificationController = require('./master/notificationController');

// Professional Controllers
const professionalController = require('./professional/professionalController');
const documentController = require('./professional/documentController');

// Customer Controllers
const searchController = require('./customer/searchController');
const inquiryController = require('./customer/inquiryController');

// Common Controllers
const authController = require('./common/authController');
const conversationController = require('./common/conversationController');
const messageController = require('./common/messageController');

module.exports = {
  // Domain groupings
  Master: {
    categoryController,
    adminController,
    bannerController,
    notificationController,
  },
  Professional: {
    professionalController,
    documentController
  },
  Customer: {
    searchController,
    inquiryController
  },
  Common: {
    authController,
    conversationController,
    messageController
  },

  // Flat re-exports
  categoryController,
  adminController,
  bannerController,
  notificationController,
  professionalController,
  documentController,
  searchController,
  inquiryController,
  authController,
  conversationController,
  messageController
};
