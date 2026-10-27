import express from 'express';
import {
  getSettings,
  getAllSettings,
  getTaxAndPaymentSettingsController,
  updateTaxAndPaymentSettingsController,
  calculatePricingPreviewController,
  getRedisStatusController,
  toggleRedisController,
  testRedisConnectionController,
  flushRedisCacheController,
} from '../controllers/settingController.js';
import accessTokenAutoRefresh from '../middlewares/accessTokenAutoRefresh.js';
import passport from 'passport';
import { isAdmin, isSuperAdmin } from '../middlewares/isAdmin.js';

const router = express.Router();

// Tax & Payment Gateway Settings (Global)
// Public read for student checkout & preview
router.get('/tax-payment', getTaxAndPaymentSettingsController);
router.post('/calculate-preview', calculatePricingPreviewController);

// Redis Connection & Cache Management (Super Admin only)
router.get(
  '/redis/status',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isSuperAdmin,
  getRedisStatusController
);

router.post(
  '/redis/toggle',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isSuperAdmin,
  toggleRedisController
);

router.post(
  '/redis/test',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isSuperAdmin,
  testRedisConnectionController
);

router.post(
  '/redis/flush',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isSuperAdmin,
  flushRedisCacheController
);

// Admin-only update for tax & payment settings
router.put(
  '/tax-payment',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  updateTaxAndPaymentSettingsController
);

// SECURITY: POST /settings and GET /settings are intentionally PUBLIC — the
// student checkout frontend and mobile app read public settings (gstRate,
// RAZORPAY_KEY_ID) at checkout time without authentication.
// The controller is responsible for restricting which keys are returned
// (only PUBLIC_SETTING_KEYS are exposed; secrets like RAZORPAY_KEY_SECRET
// should never appear in that allowlist).

// POST /settings - Get settings by keys (public keys only)
router.post('/', getSettings);

// GET /settings - Get all public settings
router.get('/', getAllSettings);

// GET /settings/all - Full, unfiltered settings dump (Admin only)
// Secrets like RAZORPAY_KEY_SECRET are only reachable via this route.
router.get(
  '/all',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  getAllSettings
);

export default router;