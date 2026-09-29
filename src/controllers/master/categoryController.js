const { Category, ProfessionalProfile } = require('../../models');

// @desc    Get all categories (public gets active ones, admin can query all)
// @route   GET /api/categories
// @access  Public / Private (Admin)
const getCategories = async (req, res, next) => {
  try {
    const { all } = req.query;
    const filter = all === 'true' ? {} : { isActive: true };

    const categories = await Category.find(filter).sort({ name: 1 });

    // Aggregate professional count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const professionalCount = await ProfessionalProfile.countDocuments({
          $or: [{ categoryId: cat._id }, { categories: cat._id }],
          verificationStatus: 'APPROVED',
          isActive: true
        });
        const totalRegistered = await ProfessionalProfile.countDocuments({
          $or: [{ categoryId: cat._id }, { categories: cat._id }]
        });
        return {
          ...cat.toObject(),
          professionalCount,
          totalRegistered
        };
      })
    );

    res.status(200).json({
      success: true,
      count: categoriesWithCount.length,
      data: categoriesWithCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single category by ID
// @route   GET /api/categories/:id
// @access  Public
const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const professionalCount = await ProfessionalProfile.countDocuments({
      categoryId: category._id,
      verificationStatus: 'APPROVED',
      isActive: true
    });

    res.status(200).json({
      success: true,
      data: {
        ...category.toObject(),
        professionalCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Category
// @route   POST /api/categories
// @access  Private (Admin)
const createCategory = async (req, res, next) => {
  try {
    const { name, description, icon, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const existing = await Category.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A category with this name already exists' });
    }

    const category = await Category.create({
      name: name.trim(),
      description: description || '',
      icon: icon || 'Wrench',
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Category
// @route   PUT /api/categories/:id
// @access  Private (Admin)
const updateCategory = async (req, res, next) => {
  try {
    const { name, description, icon, isActive } = req.body;

    let category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (name && name.trim().toLowerCase() !== category.name.toLowerCase()) {
      const existing = await Category.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'A category with this name already exists' });
      }
      category.name = name.trim();
    }

    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle Category Active Status
// @route   PATCH /api/categories/:id/status
// @access  Private (Admin)
const toggleCategoryStatus = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    category.isActive = req.body.isActive !== undefined ? req.body.isActive : !category.isActive;
    await category.save();

    res.status(200).json({
      success: true,
      message: `Category is now ${category.isActive ? 'Active' : 'Inactive'}`,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Check if any professionals are registered under this category
    const proCount = await ProfessionalProfile.countDocuments({ categoryId: category._id });
    if (proCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category: ${proCount} professional(s) are registered under it. Consider deactivating it instead.`
      });
    }

    await Category.findByIdAndDelete(category._id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
  deleteCategory
};
