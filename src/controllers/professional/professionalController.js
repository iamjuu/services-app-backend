const { ProfessionalProfile, User, ProfessionalDocument } = require('../../models');

// @desc    Get all professionals (Admin view)
// @route   GET /api/professionals
// @access  Private (Admin)
const getProfessionals = async (req, res, next) => {
  try {
    const { status, categoryId, search, page = 1, limit = 20 } = req.query;
    const conditions = [];
    if (status) {
      conditions.push({ verificationStatus: status });
    }
    if (categoryId) {
      conditions.push({
        $or: [{ categoryId }, { categories: categoryId }]
      });
    }
    if (search) {
      conditions.push({
        $or: [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } }
        ]
      });
    }
    const filter = conditions.length > 0 ? { $and: conditions } : {};

    const skip = (Number(page) - 1) * Number(limit);

    const [professionals, total] = await Promise.all([
      ProfessionalProfile.find(filter)
        .populate('categoryId', 'name icon')
        .populate('categories', 'name icon')
        .populate('userId', 'email phone isActive loginAllowed')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ProfessionalProfile.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      count: professionals.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data: professionals
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Professional Profile by ID
// @route   GET /api/professionals/:id
// @access  Public / Private (Admin gets full doc info, Customer gets safe public view)
const getProfessionalById = async (req, res, next) => {
  try {
    const profile = await ProfessionalProfile.findById(req.params.id)
      .populate('categoryId', 'name icon description')
      .populate('categories', 'name icon description')
      .populate('userId', 'email phone isActive');

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Professional not found' });
    }

    const isAdmin = req.user && req.user.role === 'ADMIN';

    if (!isAdmin) {
      if (profile.verificationStatus !== 'APPROVED' || !profile.isActive) {
        return res.status(404).json({ success: false, message: 'Professional profile is not available' });
      }

      return res.status(200).json({
        success: true,
        data: {
          _id: profile._id,
          userId: profile.userId?._id || profile.userId,
          fullName: profile.fullName,
          category: profile.categoryId,
          categories: profile.categories && profile.categories.length > 0 ? profile.categories : (profile.categoryId ? [profile.categoryId] : []),
          experience: profile.experience,
          skills: profile.skills,
          description: profile.description,
          location: profile.location,
          profilePhoto: profile.profilePhoto,
          phone: profile.phone,
          email: profile.email,
          createdAt: profile.createdAt
        }
      });
    }

    const documents = await ProfessionalDocument.find({ professionalId: profile._id });

    res.status(200).json({
      success: true,
      data: {
        ...profile.toObject(),
        documents
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current professional's own profile
// @route   GET /api/professionals/me
// @access  Private (Professional)
const getMyProfile = async (req, res, next) => {
  try {
    const profile = await ProfessionalProfile.findOne({ userId: req.user._id })
      .populate('categoryId', 'name icon')
      .populate('categories', 'name icon');

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current professional's profile
// @route   PUT /api/professionals/me
// @access  Private (Professional)
const updateMyProfile = async (req, res, next) => {
  try {
    const { experience, skills, description, address, location, phone } = req.body;

    const profile = await ProfessionalProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    if (experience !== undefined) profile.experience = Number(experience);
    if (description !== undefined) profile.description = description;
    if (address !== undefined) profile.address = address;
    if (location !== undefined) profile.location = location;
    if (phone !== undefined) profile.phone = phone;

    if (skills) {
      if (typeof skills === 'string') {
        try {
          profile.skills = JSON.parse(skills);
        } catch (e) {
          profile.skills = skills.split(',').map(s => s.trim()).filter(Boolean);
        }
      } else if (Array.isArray(skills)) {
        profile.skills = skills;
      }
    }

    if (req.file) {
      profile.profilePhoto = `/uploads/profiles/${req.file.filename}`;
    }

    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle professional active status (Admin)
// @route   PATCH /api/professionals/:id/status
// @access  Private (Admin)
const toggleProfessionalStatus = async (req, res, next) => {
  try {
    const profile = await ProfessionalProfile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Professional not found' });
    }

    const nextState = req.body.isActive !== undefined ? req.body.isActive : !profile.isActive;
    profile.isActive = nextState;
    await profile.save();

    // Sync with User model
    await User.findByIdAndUpdate(profile.userId, {
      isActive: nextState,
      loginAllowed: profile.verificationStatus === 'APPROVED' ? nextState : false
    });

    res.status(200).json({
      success: true,
      message: `Professional is now ${profile.isActive ? 'Active' : 'Inactive'}`,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add customer rating & review for a professional
// @route   POST /api/professionals/:id/rating
// @access  Public / Customer
const addRating = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, feedback, jobTitle, customerName } = req.body;

    const profile = await ProfessionalProfile.findById(id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Professional not found' });
    }

    const newHistoryItem = {
      jobTitle: jobTitle || 'Service Request',
      customerName: customerName || 'Verified Customer',
      completedDate: new Date(),
      rating: Number(rating) || 5,
      feedback: feedback || 'Great experience with this artisan.',
      status: 'COMPLETED',
      location: profile.location || 'Kerala'
    };

    if (!profile.workHistory) {
      profile.workHistory = [];
    }
    profile.workHistory.unshift(newHistoryItem);
    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Rating and review recorded successfully',
      data: newHistoryItem
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfessionals,
  getProfessionalById,
  getMyProfile,
  updateMyProfile,
  toggleProfessionalStatus,
  addRating
};
