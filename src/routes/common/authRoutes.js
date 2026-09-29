const express = require('express');
const router = express.Router();
const {
  registerCustomer,
  registerProfessional,
  login,
  getMe,
  logout
} = require('../../controllers/common/authController');
const { protect } = require('../../middlewares/authMiddleware');
const { uploadProfile, uploadProfessionalFiles } = require('../../middlewares/uploadMiddleware');

router.post('/register/customer', uploadProfile.single('profilePhoto'), registerCustomer);
router.post('/register/professional', uploadProfessionalFiles, registerProfessional);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getMe);

module.exports = router;
