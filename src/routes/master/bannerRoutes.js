const express = require('express');
const router = express.Router();
const {
  getBanners,
  getBannerById,
  createBanner,
  updateBanner,
  toggleBannerStatus,
  deleteBanner,
} = require('../../controllers/master/bannerController');
const { protect, requireAdmin } = require('../../middlewares/authMiddleware');
const { uploadProfile } = require('../../middlewares/uploadMiddleware');

router.route('/')
  .get(getBanners)
  .post(protect, requireAdmin, uploadProfile.single('image'), createBanner);

router.route('/:id')
  .get(getBannerById)
  .put(protect, requireAdmin, uploadProfile.single('image'), updateBanner)
  .delete(protect, requireAdmin, deleteBanner);

router.patch('/:id/status', protect, requireAdmin, toggleBannerStatus);

module.exports = router;
