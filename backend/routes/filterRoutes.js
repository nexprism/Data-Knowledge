import express from 'express';
import passport from 'passport';
import {
  createFilter,
  getFilterById,
  getAllFilters,
  updateFilter,
  deleteFilter,
  getFilterOptionsByCategory,
  getSubCategoriesByCategory,
  getFilteredContent
} from '../controllers/FilterController.js';
import accessTokenAutoRefresh from '../middlewares/accessTokenAutoRefresh.js';
import { isAdmin } from '../middlewares/isAdmin.js';

const router = express.Router();

// ✅ Admin-only routes (need valid token + admin role)
router.post(
  '/',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  createFilter
);

router.post('/content/category/:categoryId', accessTokenAutoRefresh, passport.authenticate('jwt', { session: false }), getFilteredContent);
router.post('/content/category/:categoryId/subcategory/:subCategoryId', accessTokenAutoRefresh, passport.authenticate('jwt', { session: false }), getFilteredContent);


router.put(
  '/:id',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  updateFilter
);

router.delete(
  '/:id',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  deleteFilter
);

// ✅ Public routes (no token needed)
router.get('/', getAllFilters);
router.get('/options/category/:categoryId', getFilterOptionsByCategory);
router.get('/subcategories/by-category/:categoryId', getSubCategoriesByCategory);
router.get('/:id', getFilterById);




export default router;
