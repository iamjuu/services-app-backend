const express = require('express');
const router = express.Router();
const professionalRoutes = require('./professionalRoutes');
const documentRoutes = require('./documentRoutes');

router.use('/', professionalRoutes);
router.use('/documents', documentRoutes);

module.exports = {
  router,
  professionalRoutes,
  documentRoutes
};
