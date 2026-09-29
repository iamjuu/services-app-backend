const express = require('express');
const router = express.Router();
const { searchProfessionals } = require('../../controllers/customer/searchController');

router.get('/professionals', searchProfessionals);

module.exports = router;
