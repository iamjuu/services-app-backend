const { Banner } = require('../../models');

// @desc    Get all banners (public gets active ones, admin can query all)
// @route   GET /api/banners
// @access  Public / Private (Admin)
const getBanners = async (req, res, next) => {
  try {
    const { all } = req.query;
    const filter = all === 'true' ? {} : { isActive: true };

    const banners = await Banner.find(filter).sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: banners.length,
      data: banners,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single banner by ID
// @route   GET /api/banners/:id
// @access  Public
const getBannerById = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    res.status(200).json({
      success: true,
      data: banner,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Banner (Admin only)
// @route   POST /api/banners
// @access  Private (Admin)
const createBanner = async (req, res, next) => {
  try {
    const { title, subtitle, tag, imageUrl, ctaText, targetCategory, order, isActive } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Banner title is required' });
    }

    let finalImageUrl = imageUrl;
    if (req.file) {
      finalImageUrl = `/uploads/profiles/${req.file.filename}`;
    }

    if (!finalImageUrl) {
      finalImageUrl = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80';
    }

    const banner = await Banner.create({
      title: title.trim(),
      subtitle: subtitle || '',
      tag: tag || 'Special Offer',
      imageUrl: finalImageUrl,
      ctaText: ctaText || 'Explore Now',
      targetCategory: targetCategory || 'All',
      order: order !== undefined ? Number(order) : 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: banner,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Banner (Admin only)
// @route   PUT /api/banners/:id
// @access  Private (Admin)
const updateBanner = async (req, res, next) => {
  try {
    const { title, subtitle, tag, imageUrl, ctaText, targetCategory, order, isActive } = req.body;

    let banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    if (title !== undefined) banner.title = title.trim();
    if (subtitle !== undefined) banner.subtitle = subtitle;
    if (tag !== undefined) banner.tag = tag;
    if (ctaText !== undefined) banner.ctaText = ctaText;
    if (targetCategory !== undefined) banner.targetCategory = targetCategory;
    if (order !== undefined) banner.order = Number(order);
    if (isActive !== undefined) banner.isActive = isActive;

    if (req.file) {
      banner.imageUrl = `/uploads/profiles/${req.file.filename}`;
    } else if (imageUrl !== undefined) {
      banner.imageUrl = imageUrl;
    }

    await banner.save();

    res.status(200).json({
      success: true,
      message: 'Banner updated successfully',
      data: banner,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle Banner Active Status (Admin only)
// @route   PATCH /api/banners/:id/status
// @access  Private (Admin)
const toggleBannerStatus = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    banner.isActive = req.body.isActive !== undefined ? req.body.isActive : !banner.isActive;
    await banner.save();

    res.status(200).json({
      success: true,
      message: `Banner is now ${banner.isActive ? 'Active' : 'Inactive'}`,
      data: banner,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Banner (Admin only)
// @route   DELETE /api/banners/:id
// @access  Private (Admin)
const deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    await Banner.findByIdAndDelete(banner._id);

    res.status(200).json({
      success: true,
      message: 'Banner deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBanners,
  getBannerById,
  createBanner,
  updateBanner,
  toggleBannerStatus,
  deleteBanner,
};
