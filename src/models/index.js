// Centralized Models Index with domain-driven grouping
const Category = require('./master/Category');
const Banner = require('./master/Banner');
const Notification = require('./master/Notification');
const ProfessionalProfile = require('./professional/ProfessionalProfile');
const ProfessionalDocument = require('./professional/ProfessionalDocument');
const Inquiry = require('./customer/Inquiry');
const User = require('./common/User');
const Conversation = require('./common/Conversation');
const Message = require('./common/Message');
const AppSetting = require('./AppSetting');

module.exports = {
  // Domain Groups
  Master: {
    Category,
    Banner,
    Notification,
  },
  Professional: {
    ProfessionalProfile,
    ProfessionalDocument,
  },
  Customer: {
    Inquiry,
  },
  Common: {
    User,
    Conversation,
    Message,
  },

  // Flat Exports for direct destructuring
  Category,
  Banner,
  Notification,
  ProfessionalProfile,
  ProfessionalDocument,
  Inquiry,
  User,
  Conversation,
  Message,
  AppSetting,
};
