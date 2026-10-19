import express from 'express';
import {
  getContactPage,
  getContactPageAdmin,
  updateContactPage,
  submitContactRequest,
  getContactRequests,
  getContactRequestById,
  updateContactRequest,
  deleteContactRequest,
} from '../controllers/contactController.js';
import accessTokenAutoRefresh from '../middlewares/accessTokenAutoRefresh.js';
import passport from 'passport';
import { isAdmin } from '../middlewares/isAdmin.js';

const router = express.Router();

// -------------------------------------------------------------
// Public Routes
// -------------------------------------------------------------
router.get('/page', getContactPage);
router.get('/config', getContactPage);
router.post('/submit', submitContactRequest);
router.post('/', submitContactRequest);

// -------------------------------------------------------------
// Admin Routes (Authenticated + Admin)
// -------------------------------------------------------------
router.get(
  '/admin/page',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  getContactPageAdmin
);

router.put(
  '/admin/page',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  updateContactPage
);

router.get(
  '/admin/requests',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  getContactRequests
);

router.get(
  '/admin/requests/:id',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  getContactRequestById
);

router.patch(
  '/admin/requests/:id',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  updateContactRequest
);

router.put(
  '/admin/requests/:id',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  updateContactRequest
);

router.delete(
  '/admin/requests/:id',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  deleteContactRequest
);

export default router;
