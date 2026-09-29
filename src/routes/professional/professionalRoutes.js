const express = require('express');
const router = express.Router();
const {
  getProfessionals,
  getProfessionalById,
  getMyProfile,
  updateMyProfile,
  toggleProfessionalStatus,
  addRating
} = require('../../controllers/professional/professionalController');
const { protect, requireAdmin, requireProfessional } = require('../../middlewares/authMiddleware');
const { uploadProfile } = require('../../middlewares/uploadMiddleware');

// Professional's own profile routes
router.route('/me')
  .get(protect, requireProfessional, getMyProfile)
  .put(protect, requireProfessional, uploadProfile.single('profilePhoto'), updateMyProfile);

// Admin list of professionals
router.route('/')
  .get(protect, requireAdmin, getProfessionals);

// Single professional profile (public safe view or admin full view)
const optionalProtect = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return protect(req, res, next);
  }
  next();
};

router.route('/:id')
  .get(optionalProtect, getProfessionalById);

router.post('/:id/rating', addRating);

router.patch('/:id/status', protect, requireAdmin, toggleProfessionalStatus);

module.exports = router;
