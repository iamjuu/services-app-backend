const express = require('express');
const router = express.Router();
const {
  getInquiries,
  getInquiryById,
  markUnderReview,
  approveInquiry,
  rejectInquiry
} = require('../../controllers/customer/inquiryController');
const { protect, requireAdmin } = require('../../middlewares/authMiddleware');

router.use(protect, requireAdmin);

router.get('/', getInquiries);
router.get('/:id', getInquiryById);
router.patch('/:id/review', markUnderReview);
router.patch('/:id/approve', approveInquiry);
router.patch('/:id/reject', rejectInquiry);

module.exports = router;
