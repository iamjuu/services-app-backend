const { User, ProfessionalProfile, Inquiry, Category, Conversation, Message, AppSetting } = require('../../models');

// @desc    Get Admin Dashboard Statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalCustomers,
      totalProfessionals,
      pendingInquiries,
      approvedProfessionals,
      rejectedProfessionals,
      underReviewInquiries,
      totalCategories,
      totalConversations,
      totalMessages
    ] = await Promise.all([
      User.countDocuments({ role: 'CUSTOMER' }),
      ProfessionalProfile.countDocuments(),
      Inquiry.countDocuments({ status: 'PENDING' }),
      ProfessionalProfile.countDocuments({ verificationStatus: 'APPROVED' }),
      ProfessionalProfile.countDocuments({ verificationStatus: 'REJECTED' }),
      Inquiry.countDocuments({ status: 'UNDER_REVIEW' }),
      Category.countDocuments(),
      Conversation.countDocuments(),
      Message.countDocuments()
    ]);

    // Recent 5 inquiries
    const recentInquiries = await Inquiry.find()
      .populate({
        path: 'professionalProfileId',
        populate: [
          { path: 'categoryId', select: 'name icon' },
          { path: 'userId', select: 'name email phone' }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(5);

    // Categories breakdown
    const categories = await Category.find().lean();
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const approvedCount = await ProfessionalProfile.countDocuments({
          categoryId: cat._id,
          verificationStatus: 'APPROVED'
        });
        return {
          _id: cat._id,
          name: cat.name,
          icon: cat.icon,
          approvedProfessionals: approvedCount
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        totalProfessionals,
        pendingInquiries,
        approvedProfessionals,
        rejectedProfessionals,
        underReviewInquiries,
        totalCategories,
        totalConversations,
        totalMessages,
        recentInquiries,
        categoriesBreakdown: categoriesWithCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Customers list (Admin)
// @route   GET /api/admin/customers
// @access  Private (Admin)
const getCustomers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const filter = { role: 'CUSTOMER' };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [customers, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter)
    ]);

    // Include conversation count for each customer
    const customersWithData = await Promise.all(
      customers.map(async (cust) => {
        const conversationsCount = await Conversation.countDocuments({ customerId: cust._id });
        return {
          ...cust.toObject(),
          conversationsCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: customersWithData.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data: customersWithData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle Customer Active Status (Admin)
// @route   PATCH /api/admin/customers/:id/status
// @access  Private (Admin)
const toggleCustomerStatus = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'CUSTOMER' });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    user.isActive = req.body.isActive !== undefined ? req.body.isActive : !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Customer is now ${user.isActive ? 'Active' : 'Disabled'}`,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get platform app settings (Admin)
// @route   GET /api/admin/settings
// @access  Private (Admin)
const getAppSettings = async (req, res, next) => {
  try {
    let setting = await AppSetting.findOne({ key: 'global' });
    if (!setting) {
      // Auto-create with defaults
      setting = await AppSetting.create({ key: 'global' });
    }
    res.status(200).json({ success: true, data: setting });
  } catch (error) {
    next(error);
  }
};

// @desc    Update platform app settings (Admin)
// @route   PATCH /api/admin/settings
// @access  Private (Admin)
const updateAppSettings = async (req, res, next) => {
  try {
    const { registrationFeePaise } = req.body;

    if (registrationFeePaise !== undefined) {
      const fee = Number(registrationFeePaise);
      if (isNaN(fee) || fee < 100) {
        return res.status(400).json({ success: false, message: 'Registration fee must be at least ₹1 (100 paise)' });
      }
    }

    const setting = await AppSetting.findOneAndUpdate(
      { key: 'global' },
      { $set: { registrationFeePaise: Number(registrationFeePaise) } },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: setting,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getCustomers,
  toggleCustomerStatus,
  getAppSettings,
  updateAppSettings,
};
