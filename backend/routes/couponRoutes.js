import express from 'express';
import {
  createCoupon,
  getCouponById,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
  applyCoupon,
  validateCoupon
} from '../controllers/CouponController.js';
import accessTokenAutoRefresh from '../middlewares/accessTokenAutoRefresh.js';
import passport from 'passport';
import { isAdmin } from '../middlewares/isAdmin.js';

const couponRouter = express.Router();

// Get all coupons - guests see active coupons, admins see all (including expired)
couponRouter.get(
  '/',
  (req, res, next) => {
    const token = req.cookies?.accessToken || (req.headers?.authorization && req.headers.authorization.startsWith('Bearer ') && req.headers.authorization.slice(7));
    if (!token) return next();
    passport.authenticate('jwt', { session: false }, (err, user) => {
      if (user) req.user = user;
      next();
    })(req, res, next);
  },
  getAllCoupons
);

// Create a coupon (admin only)
couponRouter.post(
  '/',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  createCoupon
);

couponRouter.post(
  '/create',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  createCoupon
);

// Get a coupon by ID (admin only)
couponRouter.get(
  '/:id',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  getCouponById
);

// Update a coupon (admin only)
couponRouter.put(
  '/:id',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  updateCoupon
);

// Delete a coupon (admin only, soft delete)
couponRouter.delete(
  '/:id',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  deleteCoupon
);

// Apply/Validate coupon (authenticated users)
couponRouter.post(
  '/apply',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  applyCoupon
);

// Validate coupon without applying (authenticated users)
couponRouter.post(
  '/validate',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  validateCoupon
);

export default couponRouter;