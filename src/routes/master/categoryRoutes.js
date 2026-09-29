const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
  deleteCategory
} = require('../../controllers/master/categoryController');
const { protect, requireAdmin } = require('../../middlewares/authMiddleware');

router.route('/')
  .get(getCategories)
  .post(protect, requireAdmin, createCategory);

router.route('/:id')
  .get(getCategoryById)
  .put(protect, requireAdmin, updateCategory)
  .delete(protect, requireAdmin, deleteCategory);

router.patch('/:id/status', protect, requireAdmin, toggleCategoryStatus);

module.exports = router;
