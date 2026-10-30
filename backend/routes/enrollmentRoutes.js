import express from 'express';
import multer from 'multer';
import {
  createEnrollment,
  getAllEnrollments,
  getEnrollmentById,
  deleteEnrollment,
  updateEnrollment,
  adminEnrollStudent,
  createFreeEnrollment,
  removeEnrollmentAndUpdateCourse,
  updateAccessExpiry
} from '../controllers/enrollmentController.js';
import { bulkEnrollFromExcel, enrollFromMigration, bulkEnrollSpecial } from '../controllers/bulkEnrollmentController.js';
import accessTokenAutoRefresh from '../middlewares/accessTokenAutoRefresh.js';
import passport from 'passport';
import { isAdmin } from '../middlewares/isAdmin.js';

import enrollmentService from '../service/enrollmentService.js';

// In-memory multer for Excel uploads (no disk write needed)
const excelUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx / .xls) are accepted'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

const router = express.Router();

// Create enrollment (admin only — students go through checkout)
router.post(
  '/',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  createEnrollment
);

// Get all enrollments (admin only)
router.get(
  '/',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  getAllEnrollments
);


router.put(
  '/:id/access-expiry',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  updateAccessExpiry
);

// Get single enrollment (admin only)
router.get(
  '/:id',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  getEnrollmentById
);

// Delete enrollment (admin only)
router.delete(
  '/:id',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  deleteEnrollment
);

// Update enrollment (admin only)
router.put(
  '/:id',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  updateEnrollment
);

// Admin manual enroll
router.post('/admin-enroll', accessTokenAutoRefresh, passport.authenticate('jwt', { session: false }), isAdmin, adminEnrollStudent);

// Free enroll (authenticated — student must be logged in)
router.post(
  '/free-enroll',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  createFreeEnrollment
);

// Remove enrollment (admin only)
router.delete(
  '/:id/remove',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  removeEnrollmentAndUpdateCourse
);

/**
 * POST /enrollment/bulk-enroll
 * Admin only — upload an Excel sheet to bulk-enroll students into a course.
 * Body (multipart/form-data):
 *   file         – Excel file (.xlsx or .xls)
 *   courseId     – Target course ID
 *   planId       – Target course plan ID
 *   accessExpiry – (optional) ISO date string, defaults to 2026-09-10
 */
router.post(
  '/bulk-enroll',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  excelUpload.single('file'),
  bulkEnrollFromExcel
);

/**
 * POST /enrollment/bulk-enroll-special
 * Admin only — bulk-enroll into primary AND secondary course.
 */
router.post(
  '/bulk-enroll-special',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  excelUpload.single('file'),
  bulkEnrollSpecial
);

/**
 * POST /enrollment/migrate-enroll
 * Admin only — Auto-enroll students who have source-course/plan and 1+ month left.
 */
router.post(
  '/migrate-enroll',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  enrollFromMigration
);

// Get enrollments for a specific course (admin only)
router.get(
  '/courses/:courseId/enrollments',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isAdmin,
  async (req, res) => {
    try {
      const { courseId } = req.params;
      // You may want to validate ObjectId here
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const result = await enrollmentService.getAllEnrollments(
        { courseId },
        { page, limit }
      );
      if (res.locals) {
        res.locals.docCount = result.data?.length ?? 0;
      }
      res.status(200).json({
        success: true,
        message: 'Course enrollments fetched successfully',
        data: {
          enrollments: result.data,
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
          },
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);


export default router;
