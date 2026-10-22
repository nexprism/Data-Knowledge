import express from 'express';
import passport from 'passport';
import { isAdmin } from '../middlewares/isAdmin.js';
import accessTokenAutoRefresh from '../middlewares/accessTokenAutoRefresh.js';
import optionalTokenAutoRefresh from '../middlewares/optionalTokenAutoRefresh.js';
import { upload } from '../middlewares/upload-middleware.js';
import optionalAuthenticate from '../middlewares/optionalAuthenticate.js';
import {
    createSlots,
    getAdminSlots,
    updateSlot,
    deleteSlot,
    clearAllSlots,
    getAdminBookings,
    getAvailableSlots,
    createConsultationOrder,
    bookConsultation
} from '../controllers/consultationController.js';

const router = express.Router();

// --- Admin Routes ---
router.post('/slots', accessTokenAutoRefresh, passport.authenticate('jwt', { session: false }), isAdmin, createSlots);
router.get('/admin/slots', accessTokenAutoRefresh, passport.authenticate('jwt', { session: false }), isAdmin, getAdminSlots);
router.delete('/slots/clear-all', accessTokenAutoRefresh, passport.authenticate('jwt', { session: false }), isAdmin, clearAllSlots);
router.delete('/slots', accessTokenAutoRefresh, passport.authenticate('jwt', { session: false }), isAdmin, clearAllSlots);
router.put('/slots/:id', accessTokenAutoRefresh, passport.authenticate('jwt', { session: false }), isAdmin, updateSlot);
router.delete('/slots/:id', accessTokenAutoRefresh, passport.authenticate('jwt', { session: false }), isAdmin, deleteSlot);
router.get('/bookings', accessTokenAutoRefresh, passport.authenticate('jwt', { session: false }), isAdmin, getAdminBookings);

// --- Student/Frontend Routes ---
router.get('/slots/available', getAvailableSlots);
router.post('/create-order', optionalTokenAutoRefresh, optionalAuthenticate, createConsultationOrder);

// `upload.fields` handles multiple file uploads, here we expect 'fileUpload'
// optionalTokenAutoRefresh: guests (no tokens) can book; logged-in users still get token refresh
router.post('/book', 
    optionalTokenAutoRefresh, 
    optionalAuthenticate, 
    upload.fields([{ name: 'fileUpload', maxCount: 1 }]), 
    bookConsultation
);

export default router;
