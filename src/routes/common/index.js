const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const conversationRoutes = require('./conversationRoutes');

router.use('/auth', authRoutes);
router.use('/conversations', conversationRoutes);

module.exports = {
  router,
  authRoutes,
  conversationRoutes
};
