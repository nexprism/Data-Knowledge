import express from 'express';
import {
  addTestimonialAdmin,
  listTestimonialsAdmin,
  updateTestimonialAdmin,
  deleteTestimonialAdmin,
  reorderTestimonialsAdmin,
  submitTestimonial,
  getMyTestimonials,
  getApprovedTestimonials,
  getTestimonial
} from '../controllers/testimonialController.js';
import { upload } from '../middlewares/upload-middleware.js';
import { isAdmin } from '../middlewares/isAdmin.js';
import accessTokenAutoRefresh from '../middlewares/accessTokenAutoRefresh.js';
import passport from 'passport';

const router = express.Router();

const testimonialUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'screenshot', maxCount: 1 },
  { name: 'reviewImages', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]);

// Admin routes
router.post(
  '/admin/testimonials',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  testimonialUpload,
  addTestimonialAdmin
);
router.get(
  '/admin/testimonials',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  listTestimonialsAdmin
);
router.put(
  '/admin/testimonials/reorder',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  reorderTestimonialsAdmin
);
router.patch(
  '/admin/testimonials/:id',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  testimonialUpload,
  updateTestimonialAdmin
);
router.put(
  '/admin/testimonials/:id',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  testimonialUpload,
  updateTestimonialAdmin
);
router.delete(
  '/admin/testimonials/:id',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  deleteTestimonialAdmin
);

// Optional auth middleware: extracts user if token provided, but allows public submission
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    passport.authenticate('jwt', { session: false }, (err, user) => {
      if (user) {
        req.user = user;
      }
      return next();
    })(req, res, next);
  } else {
    next();
  }
};

// User routes
router.post(
  '/testimonials',
  optionalAuth,
  testimonialUpload,
  submitTestimonial
);
router.get(
  '/testimonials/me',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  getMyTestimonials
);
router.get('/testimonials', getApprovedTestimonials);
router.get('/testimonials/:id', getTestimonial);

export default router;