const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ProfessionalProfile = require('../models/ProfessionalProfile');

// Protect routes: verify JWT token
const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_skilled_service_jwt_key_2026');

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found or session expired.' });
      }

      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Not authorized, invalid token.' });
    }
  } else {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided.' });
  }
};

// Require ADMIN role
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Access denied: Admin role required.' });
  }
};

// Require CUSTOMER role
const requireCustomer = (req, res, next) => {
  if (req.user && req.user.role === 'CUSTOMER') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Access denied: Customer role required.' });
  }
};

// Require PROFESSIONAL role (and verify approved status)
const requireProfessional = async (req, res, next) => {
  if (!req.user || req.user.role !== 'PROFESSIONAL') {
    return res.status(403).json({ success: false, message: 'Access denied: Professional role required.' });
  }

  const profile = await ProfessionalProfile.findOne({ userId: req.user._id });
  if (!profile) {
    return res.status(404).json({ success: false, message: 'Professional profile not found.' });
  }

  if (profile.verificationStatus !== 'APPROVED' || !req.user.loginAllowed) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Professional account is not approved.',
      status: profile.verificationStatus,
      rejectionReason: profile.rejectionReason
    });
  }

  req.professionalProfile = profile;
  next();
};

module.exports = {
  protect,
  requireAdmin,
  requireCustomer,
  requireProfessional
};
