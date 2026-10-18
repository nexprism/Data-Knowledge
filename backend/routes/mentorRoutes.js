import express from 'express';
import {
  createMentor,
  getMentors,
  getMentorById,
  updateMentor,
  deleteMentor
} from '../controllers/mentorController.js';
import { upload } from '../middlewares/upload-middleware.js';
import { isAdmin } from '../middlewares/isAdmin.js';
import accessTokenAutoRefresh from '../middlewares/accessTokenAutoRefresh.js';
import passport from 'passport';

const router = express.Router();

const mentorUpload = upload.fields([
  { name: 'image', maxCount: 1 }
]);

// Admin routes
router.post(
  '/admin/mentors',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  mentorUpload,
  createMentor
);

router.post(
  '/mentors',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  mentorUpload,
  createMentor
);

router.get(
  '/admin/mentors',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  getMentors
);

router.patch(
  '/admin/mentors/:id',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  mentorUpload,
  updateMentor
);

router.put(
  '/admin/mentors/:id',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  mentorUpload,
  updateMentor
);

router.patch(
  '/mentors/:id',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  mentorUpload,
  updateMentor
);

router.put(
  '/mentors/:id',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  mentorUpload,
  updateMentor
);

router.delete(
  '/admin/mentors/:id',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  deleteMentor
);

router.delete(
  '/mentors/:id',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  deleteMentor
);

router.get(
  '/admin/mentors/:id',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  getMentorById
);

// Public route for web
router.get('/mentors', getMentors);
router.get('/mentors/:id', getMentorById);

export default router;
