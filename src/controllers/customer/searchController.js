const { ProfessionalProfile } = require('../../models');

// @desc    Search approved and active professionals
// @route   GET /api/search/professionals
// @access  Public / Customer
const searchProfessionals = async (req, res, next) => {
  try {
    const { category, location, minExperience, maxExperience, query, page = 1, limit = 20 } = req.query;

    // Strict filter: MUST be APPROVED and MUST be active
    const filter = {
      verificationStatus: 'APPROVED',
      isActive: true
    };

    if (category) {
      filter.$or = [
        { categoryId: category },
        { categories: category }
      ];
    }

    if (location) {
      filter.location = { $regex: location.trim(), $options: 'i' };
    }

    if (minExperience !== undefined || maxExperience !== undefined) {
      filter.experience = {};
      if (minExperience !== undefined && minExperience !== '') {
        filter.experience.$gte = Number(minExperience);
      }
      if (maxExperience !== undefined && maxExperience !== '') {
        filter.experience.$lte = Number(maxExperience);
      }
    }

    if (query) {
      const qRegex = { $regex: query.trim(), $options: 'i' };
      const queryOr = [
        { fullName: qRegex },
        { skills: { $in: [new RegExp(query.trim(), 'i')] } },
        { description: qRegex },
        { location: qRegex }
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: queryOr }];
        delete filter.$or;
      } else {
        filter.$or = queryOr;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [professionals, total] = await Promise.all([
      ProfessionalProfile.find(filter)
        .populate('categoryId', 'name icon description')
        .populate('categories', 'name icon description')
        .populate('userId', 'email phone isActive')
        .select('-address')
        .sort({ experience: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ProfessionalProfile.countDocuments(filter)
    ]);

    const safeData = professionals.map((pro) => ({
      _id: pro._id,
      userId: pro.userId?._id || pro.userId,
      fullName: pro.fullName,
      category: pro.categoryId,
      categories: pro.categories && pro.categories.length > 0 ? pro.categories : (pro.categoryId ? [pro.categoryId] : []),
      experience: pro.experience,
      skills: pro.skills,
      description: pro.description,
      location: pro.location,
      profilePhoto: pro.profilePhoto,
      phone: pro.phone,
      email: pro.email,
      verificationStatus: pro.verificationStatus
    }));

    res.status(200).json({
      success: true,
      count: safeData.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data: safeData
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchProfessionals
};
