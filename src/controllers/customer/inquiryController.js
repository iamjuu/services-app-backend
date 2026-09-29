const { Inquiry, ProfessionalProfile, ProfessionalDocument, User } = require('../../models');

// @desc    Get all inquiries (Admin / Management)
// @route   GET /api/inquiries
// @access  Private (Admin)
const getInquiries = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [inquiries, total] = await Promise.all([
      Inquiry.find(filter)
        .populate({
          path: 'professionalProfileId',
          populate: [
            { path: 'categoryId', select: 'name icon' },
            { path: 'categories', select: 'name icon' },
            { path: 'userId', select: 'name email phone createdAt' }
          ]
        })
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Inquiry.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      count: inquiries.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data: inquiries
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single inquiry detail with complete application & documents
// @route   GET /api/inquiries/:id
// @access  Private (Admin)
const getInquiryById = async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id)
      .populate({
        path: 'professionalProfileId',
        populate: [
          { path: 'categoryId', select: 'name icon description' },
          { path: 'categories', select: 'name icon description' },
          { path: 'userId', select: 'name email phone isActive loginAllowed createdAt' }
        ]
      })
      .populate('reviewedBy', 'name email');

    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    const profile = inquiry.professionalProfileId;
    let documents = [];
    if (profile) {
      documents = await ProfessionalDocument.find({ professionalId: profile._id });
    }

    res.status(200).json({
      success: true,
      data: {
        ...inquiry.toObject(),
        documents
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark inquiry as UNDER_REVIEW
// @route   PATCH /api/inquiries/:id/review
// @access  Private (Admin)
const markUnderReview = async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    inquiry.status = 'UNDER_REVIEW';
    inquiry.reviewedBy = req.user._id;
    inquiry.reviewedAt = new Date();
    if (req.body.notes) inquiry.notes = req.body.notes;
    await inquiry.save();

    await ProfessionalProfile.findByIdAndUpdate(inquiry.professionalProfileId, {
      verificationStatus: 'UNDER_REVIEW'
    });

    res.status(200).json({
      success: true,
      message: 'Inquiry marked as UNDER_REVIEW',
      data: inquiry
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve professional registration inquiry
// @route   PATCH /api/inquiries/:id/approve
// @access  Private (Admin)
const approveInquiry = async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    const profile = await ProfessionalProfile.findById(inquiry.professionalProfileId);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Associated professional profile not found' });
    }

    // Update Inquiry
    inquiry.status = 'APPROVED';
    inquiry.reviewedBy = req.user._id;
    inquiry.reviewedAt = new Date();
    inquiry.rejectionReason = '';
    if (req.body.notes) inquiry.notes = req.body.notes;
    await inquiry.save();

    // Update ProfessionalProfile
    profile.verificationStatus = 'APPROVED';
    profile.isActive = true;
    profile.rejectionReason = '';
    await profile.save();

    // Update User to allow login and activate
    await User.findByIdAndUpdate(profile.userId, {
      loginAllowed: true,
      isActive: true
    });

    res.status(200).json({
      success: true,
      message: 'Professional approved successfully. Professional can now log in.',
      data: inquiry
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject professional registration inquiry
// @route   PATCH /api/inquiries/:id/reject
// @access  Private (Admin)
const rejectInquiry = async (req, res, next) => {
  try {
    const { rejectionReason, notes } = req.body;

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Admin must provide a rejection reason'
      });
    }

    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    const profile = await ProfessionalProfile.findById(inquiry.professionalProfileId);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Associated professional profile not found' });
    }

    // Update Inquiry
    inquiry.status = 'REJECTED';
    inquiry.reviewedBy = req.user._id;
    inquiry.reviewedAt = new Date();
    inquiry.rejectionReason = rejectionReason.trim();
    if (notes) inquiry.notes = notes;
    await inquiry.save();

    // Update ProfessionalProfile
    profile.verificationStatus = 'REJECTED';
    profile.isActive = false;
    profile.rejectionReason = rejectionReason.trim();
    await profile.save();

    // Update User to prevent login and disable
    await User.findByIdAndUpdate(profile.userId, {
      loginAllowed: false,
      isActive: false
    });

    res.status(200).json({
      success: true,
      message: 'Professional inquiry rejected with specified reason.',
      data: inquiry
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInquiries,
  getInquiryById,
  markUnderReview,
  approveInquiry,
  rejectInquiry
};
