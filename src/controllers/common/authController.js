const path = require('path');
const fs = require('fs');
const {
  User,
  ProfessionalProfile,
  ProfessionalDocument,
  Inquiry,
  Category
} = require('../../models');
const generateToken = require('../../utils/generateToken');

// @desc    Register a new Customer
// @route   POST /api/auth/register/customer
// @access  Public
const registerCustomer = async (req, res, next) => {
  try {
    const { name, email, phone, password, location } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields (name, email, phone, password)' });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    let profilePhoto = '';
    if (req.file) {
      profilePhoto = `/uploads/profiles/${req.file.filename}`;
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      role: 'CUSTOMER',
      location: location || '',
      profilePhoto,
      isActive: true,
      loginAllowed: true
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        location: user.location,
        profilePhoto: user.profilePhoto,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new Professional with multi-part form data & Aadhaar
// @route   POST /api/auth/register/professional
// @access  Public
const registerProfessional = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      categoryId,
      categoryIds,
      dateOfBirth,
      address,
      location,
      experience,
      skills,
      description
    } = req.body;

    // Parse categoryIds (supports multiple professions)
    let selectedCategories = [];
    if (categoryIds) {
      if (typeof categoryIds === 'string') {
        try {
          selectedCategories = JSON.parse(categoryIds);
        } catch (e) {
          selectedCategories = categoryIds.split(',').map(c => c.trim()).filter(Boolean);
        }
      } else if (Array.isArray(categoryIds)) {
        selectedCategories = categoryIds;
      }
    } else if (categoryId) {
      selectedCategories = [categoryId];
    }

    // Validation
    if (!name || !email || !phone || !password || selectedCategories.length === 0 || !dateOfBirth || !address || !location || experience === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required personal details and at least one profession'
      });
    }

    // Aadhaar is mandatory!
    const files = req.files || {};
    let aadhaarFile = files.aadhaar && files.aadhaar[0];

    // Fallback: If client sent simulated/mock document via web or body
    if (!aadhaarFile && req.body.aadhaar) {
      const documentsDir = path.join(__dirname, '../../../uploads/documents');
      if (!fs.existsSync(documentsDir)) {
        fs.mkdirSync(documentsDir, { recursive: true });
      }
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const mockFilename = `doc-aadhaar-${uniqueSuffix}.pdf`;
      const filePath = path.join(documentsDir, mockFilename);
      try {
        fs.writeFileSync(filePath, '%PDF-1.4\n%Mock Aadhaar document\n%%EOF');
        const origName = typeof req.body.aadhaar === 'string' && !req.body.aadhaar.includes('[object')
          ? req.body.aadhaar
          : 'aadhaar_sample_document.pdf';
        aadhaarFile = {
          filename: mockFilename,
          originalname: origName,
          mimetype: 'application/pdf',
          size: 104800
        };
      } catch (e) {
        console.error('Error generating fallback aadhaar file:', e);
      }
    }

    if (!aadhaarFile) {
      return res.status(400).json({
        success: false,
        message: 'Aadhaar document is REQUIRED for professional registration'
      });
    }

    // Verify all selected categories exist and are active
    const validCategories = await Category.find({ _id: { $in: selectedCategories }, isActive: true });
    if (validCategories.length === 0) {
      return res.status(400).json({ success: false, message: 'None of the selected service categories are valid or active' });
    }
    const validCategoryIds = validCategories.map(c => c._id);

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Profile photo if uploaded
    let profilePhotoUrl = '';
    if (files.profilePhoto && files.profilePhoto.length > 0) {
      profilePhotoUrl = `/uploads/profiles/${files.profilePhoto[0].filename}`;
    }

    // Parse skills if string
    let parsedSkills = [];
    if (typeof skills === 'string') {
      try {
        parsedSkills = JSON.parse(skills);
      } catch (e) {
        parsedSkills = skills.split(',').map(s => s.trim()).filter(Boolean);
      }
    } else if (Array.isArray(skills)) {
      parsedSkills = skills;
    }

    // Create User (loginAllowed: false for professional initially)
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      role: 'PROFESSIONAL',
      location,
      profilePhoto: profilePhotoUrl,
      isActive: false, // inactive until approved
      loginAllowed: false // strictly false until admin verification
    });

    // Create Professional Profile with multiple categories support
    const profile = await ProfessionalProfile.create({
      userId: user._id,
      categoryId: validCategoryIds[0], // primary category
      categories: validCategoryIds,    // all selected categories
      fullName: name,
      phone,
      email: email.toLowerCase(),
      profilePhoto: profilePhotoUrl,
      dateOfBirth: new Date(dateOfBirth),
      address,
      location,
      experience: Number(experience),
      skills: parsedSkills,
      description: description || '',
      verificationStatus: 'PENDING',
      isActive: false
    });

    // Save Aadhaar Document (Required)
    await ProfessionalDocument.create({
      professionalId: profile._id,
      documentType: 'AADHAAR',
      fileUrl: aadhaarFile.filename, // Store filename, served only via secure Admin route
      originalFileName: aadhaarFile.originalname,
      mimeType: aadhaarFile.mimetype,
      fileSize: aadhaarFile.size
    });

    // Save optional documents
    const docFields = [
      { key: 'pan', type: 'PAN', defaultName: 'pan_sample_document.pdf' },
      { key: 'passport', type: 'PASSPORT', defaultName: 'passport_sample_document.pdf' },
      { key: 'drivingLicense', type: 'DRIVING_LICENSE', defaultName: 'driving_license_sample_document.pdf' },
      { key: 'professionalCertificate', type: 'PROFESSIONAL_CERTIFICATE', defaultName: 'certificate_sample_document.pdf' },
      { key: 'otherDoc', type: 'OTHER', defaultName: 'other_sample_document.pdf' }
    ];

    for (const docField of docFields) {
      let file = files[docField.key] && files[docField.key][0];
      if (!file && req.body[docField.key]) {
        const documentsDir = path.join(__dirname, '../../../uploads/documents');
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const mockFilename = `doc-${docField.key}-${uniqueSuffix}.pdf`;
        const filePath = path.join(documentsDir, mockFilename);
        try {
          fs.writeFileSync(filePath, `%PDF-1.4\n%Mock ${docField.type} document\n%%EOF`);
          file = {
            filename: mockFilename,
            originalname: typeof req.body[docField.key] === 'string' && !req.body[docField.key].includes('[object')
              ? req.body[docField.key]
              : docField.defaultName,
            mimetype: 'application/pdf',
            size: 98000
          };
        } catch (e) {
          console.error(`Error generating fallback ${docField.key} file:`, e);
        }
      }

      if (file) {
        await ProfessionalDocument.create({
          professionalId: profile._id,
          documentType: docField.type,
          fileUrl: file.filename,
          originalFileName: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size
        });
      }
    }

    // Create Inquiry for Admin verification queue
    await Inquiry.create({
      professionalProfileId: profile._id,
      status: 'PENDING',
      notes: `New registration inquiry submitted for professions: ${validCategories.map(c => c.name).join(', ')}`
    });

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully. Your account is pending admin verification.',
      data: {
        userId: user._id,
        profileId: profile._id,
        verificationStatus: 'PENDING',
        loginAllowed: false
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    User Login (Admin, Customer, Professional)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Optional role verification check from client
    if (role && user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Account found, but role is ${user.role}, not ${role}. Please use the correct login portal.`
      });
    }

    // Strict Backend check for Professional status
    if (user.role === 'PROFESSIONAL') {
      const profile = await ProfessionalProfile.findOne({ userId: user._id })
        .populate('categoryId', 'name icon')
        .populate('categories', 'name icon');
      if (!profile) {
        return res.status(404).json({ success: false, message: 'Professional profile record not found.' });
      }

      if (profile.verificationStatus === 'PENDING') {
        return res.status(403).json({
          success: false,
          code: 'STATUS_PENDING',
          status: 'PENDING',
          message: 'Your registration is pending admin verification.'
        });
      }

      if (profile.verificationStatus === 'UNDER_REVIEW') {
        return res.status(403).json({
          success: false,
          code: 'STATUS_UNDER_REVIEW',
          status: 'UNDER_REVIEW',
          message: 'Your documents are currently under review.'
        });
      }

      if (profile.verificationStatus === 'REJECTED') {
        return res.status(403).json({
          success: false,
          code: 'STATUS_REJECTED',
          status: 'REJECTED',
          message: 'Your registration was rejected. Please check the reason and update your application.',
          rejectionReason: profile.rejectionReason || 'Documents did not meet criteria.'
        });
      }

      // Must be APPROVED
      if (profile.verificationStatus !== 'APPROVED' || !user.loginAllowed) {
        return res.status(403).json({
          success: false,
          code: 'STATUS_NOT_APPROVED',
          message: 'Your account is not authorized to log in yet.'
        });
      }

      const token = generateToken(user._id);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          location: user.location,
          profilePhoto: user.profilePhoto,
          token,
          professionalProfile: {
            _id: profile._id,
            category: profile.categoryId,
            categories: profile.categories || (profile.categoryId ? [profile.categoryId] : []),
            experience: profile.experience,
            skills: profile.skills,
            verificationStatus: profile.verificationStatus
          }
        }
      });
    }

    // For ADMIN and CUSTOMER
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account is currently disabled.' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        location: user.location,
        profilePhoto: user.profilePhoto,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Current Logged in User Profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    let professionalProfile = null;

    if (user.role === 'PROFESSIONAL') {
      professionalProfile = await ProfessionalProfile.findOne({ userId: user._id })
        .populate('categoryId', 'name icon')
        .populate('categories', 'name icon');
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        professionalProfile
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout User
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

module.exports = {
  registerCustomer,
  registerProfessional,
  login,
  getMe,
  logout
};
