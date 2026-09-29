const express = require('express');
const router = express.Router();
const { getDocumentFile } = require('../../controllers/professional/documentController');
const { protect, requireAdmin } = require('../../middlewares/authMiddleware');

// Secure document route - strictly Admin only
router.get('/:id', protect, requireAdmin, getDocumentFile);

module.exports = router;
