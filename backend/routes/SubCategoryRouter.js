import express from 'express';
import { createSubCategory, getSubCategoryById, getAllSubCategories, updateSubCategory, deleteSubCategory } from '../controllers/SubCategoryController.js';
import { getSubCategoriesByCategory } from '../controllers/FilterController.js';
import accessTokenAutoRefresh from '../middlewares/accessTokenAutoRefresh.js';
import passport from 'passport';
import { isAdmin } from '../middlewares/isAdmin.js';

const subCategoryRouter = express.Router();

// Create a subcategory (admin only)
subCategoryRouter.post(
  '/',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  createSubCategory
);

// Get all subcategories (public)
subCategoryRouter.get('/', getAllSubCategories);

// Category-based subcategories lookup (must precede generic /:id)
subCategoryRouter.get('/by-category/:categoryId', getSubCategoriesByCategory);
subCategoryRouter.get('/category/:categoryId', getSubCategoriesByCategory);

// Get a subcategory by ID (public)
subCategoryRouter.get('/:id', getSubCategoryById);

// Update a subcategory (admin only)
subCategoryRouter.put(
  '/:id',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  updateSubCategory
);

// Delete a subcategory (admin only, soft delete)
subCategoryRouter.delete(
  '/:id',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  deleteSubCategory
);

export default subCategoryRouter;