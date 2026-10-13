import ConsultationSlot from '../models/ConsultationSlot.js';
import ConsultationBooking from '../models/ConsultationBooking.js';
import Setting from '../models/setting.js';
import User from '../models/user.js';
import emailService from '../utils/emailService.js';
import axios from 'axios';
import fs from 'fs';

// --- Admin Endpoints ---

// Create new slots
export const createSlots = async (req, res) => {
    try {
        const { slots } = req.body; 
        // Expected slots: [{ startTime, endTime, duration, price }]
        if (!slots || !Array.isArray(slots) || slots.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid slots data' });
        }

        const createdSlots = await ConsultationSlot.insertMany(slots);

        return res.status(201).json({
            success: true,
            message: 'Consultation slots created successfully',
            data: createdSlots
        });
    } catch (error) {
        console.error('Error creating slots:', error);
        return res.status(500).json({ success: false, message: 'Failed to create slots', error: error.message });
    }
};

// Get all slots for admin (including booked)
export const getAdminSlots = async (req, res) => {
    try {
        const slots = await ConsultationSlot.find().sort({ startTime: 1 });
        return res.status(200).json({
            success: true,
            data: slots
        });
    } catch (error) {
        console.error('Error fetching admin slots:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch slots', error: error.message });
    }
};

// Delete a slot (only if unbooked)
export const deleteSlot = async (req, res) => {
    try {
        const { id } = req.params;
        const slot = await ConsultationSlot.findById(id);
        if (!slot) {
            return res.status(404).json({ success: false, message: 'Slot not found' });
        }
        if (slot.isBooked) {
            return res.status(400).json({ success: false, message: 'Cannot delete a booked slot' });
        }
        
        await ConsultationSlot.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: 'Slot deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting slot:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete slot', error: error.message });
    }
};

// Get all bookings (for Admin)
export const getAdminBookings = async (req, res) => {
    try {
        const bookings = await ConsultationBooking.find()
            .populate('userId', 'fullName email phone')
            .populate('slotId')
            .sort({ createdAt: -1 });
        
        return res.status(200).json({
            success: true,
            data: bookings
        });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch bookings', error: error.message });
    }
};

// --- Frontend/Student Endpoints ---

// Get available slots (Filter by date if provided, otherwise all future slots)
export const getAvailableSlots = async (req, res) => {
    try {
        const { date } = req.query;
        let query = { isActive: true };

        if (date && typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            const [y, m, d] = date.split('-').map(Number);
            const startRange = new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - 14 * 60 * 60 * 1000);
            const endRange = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999) + 14 * 60 * 60 * 1000);
            query.startTime = { $gte: startRange, $lte: endRange };
        } else {
            // Default behavior: all upcoming slots from today onwards
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            query.startTime = { $gte: todayStart };
        }

        const slots = await ConsultationSlot.find(query).sort({ startTime: 1 });

        return res.status(200).json({
            success: true,
            data: slots
        });
    } catch (error) {
        console.error('Error fetching available slots:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch slots', error: error.message });
    }
};

// Create Razorpay Order for Consultation
export const createConsultationOrder = async (req, res) => {
    try {
        const { slotId } = req.body;
        if (!slotId) return res.status(400).json({ success: false, message: "slotId is required" });

        const slot = await ConsultationSlot.findById(slotId);
        if (!slot) return res.status(404).json({ success: false, message: "Slot not found" });
        if (slot.isBooked) return res.status(400).json({ success: false, message: "This slot is already booked by another user" });
        if (new Date(slot.startTime) < new Date()) return res.status(400).json({ success: false, message: "Cannot book a past slot" });

        // If it's a free slot, no order needed
        if (slot.price === 0 || slot.duration !== 30) {
            return res.status(200).json({ success: true, isFree: true });
        }

        const keySetting = await Setting.findOne({ key: "RAZORPAY_KEY_ID" });
        const secretSetting = await Setting.findOne({ key: "RAZORPAY_KEY_SECRET" });
        if (!keySetting || !secretSetting) {
            return res.status(500).json({ success: false, message: "Razorpay payment gateway settings not configured" });
        }

        const auth = Buffer.from(`${keySetting.value}:${secretSetting.value}`).toString("base64");
        const headers = { "Content-Type": "application/json", Authorization: `Basic ${auth}` };
        const amountPaise = Math.round(slot.price * 100);

        const orderOptions = {
            amount: amountPaise,
            currency: "INR",
            receipt: `rcpt_cns_${Date.now().toString().slice(-6)}`
        };

        const response = await axios.post("https://api.razorpay.com/v1/orders", orderOptions, { headers });
        
        return res.status(200).json({
            success: true,
            isFree: false,
            key: keySetting.value,
            orderId: response.data.id,
            amount: amountPaise,        // Razorpay expects paise (₹100 = 10000 paise)
            baseAmount: slot.price,     // The actual Rupee amount (₹100)
            currency: "INR"
        });
    } catch (error) {
        console.error('Error creating consultation order:', error.response?.data || error.message);
        return res.status(500).json({ success: false, message: 'Failed to create order', error: error.response?.data?.error?.description || error.message });
    }
};

// Book a consultation slot
export const bookConsultation = async (req, res) => {
    try {
        const { slotId, fullName, email, phone, designation, department, institute, query, paymentId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const userId = req.user?._id || null;

        if (!slotId || !fullName?.trim() || !designation?.trim() || !department?.trim()) {
            return res.status(400).json({ success: false, message: 'Required consultation booking fields must be provided' });
        }

        // Check if slot exists and is available
        const existingSlot = await ConsultationSlot.findById(slotId);
        if (!existingSlot) {
            return res.status(404).json({ success: false, message: 'Consultation slot not found' });
        }
        if (existingSlot.isBooked) {
            return res.status(400).json({ 
                success: false, 
                message: 'This slot has already been booked by another candidate. Please choose a different slot.' 
            });
        }
        if (new Date(existingSlot.startTime) < new Date()) {
            return res.status(400).json({ 
                success: false, 
                message: 'This slot has already passed. Please select an upcoming slot.' 
            });
        }

        let paymentStatus = 'free';
        let finalPaymentId = null;
        let finalOrderId = razorpay_order_id || null;

        // Check if paid slot
        if (existingSlot.price > 0 && existingSlot.duration === 30) {
            finalPaymentId = razorpay_payment_id || paymentId;
            if (!razorpay_order_id || !finalPaymentId || !razorpay_signature) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Payment details (order ID, payment ID, signature) are required for paid consultations' 
                });
            }

            const secretSetting = await Setting.findOne({ key: "RAZORPAY_KEY_SECRET" });
            if (!secretSetting) {
                return res.status(500).json({ success: false, message: 'Payment verification configuration not found' });
            }

            const crypto = await import('crypto');
            const hmac = crypto.createHmac("sha256", secretSetting.value);
            hmac.update(razorpay_order_id + "|" + finalPaymentId);
            const generatedSignature = hmac.digest("hex");

            if (generatedSignature !== razorpay_signature) {
                return res.status(400).json({ success: false, message: 'Payment signature verification failed' });
            }
            
            paymentStatus = 'paid';
        }

        // Handle File Upload from upload-middleware
        let fileUploadPath = null;
        if (req.files && req.files.fileUpload && req.files.fileUpload[0]) {
            fileUploadPath = req.files.fileUpload[0].filename;
        }

        // Atomically mark slot as booked to guarantee no double-booking
        const updatedSlot = await ConsultationSlot.findOneAndUpdate(
            { _id: slotId, isBooked: false },
            { $set: { isBooked: true } },
            { new: true }
        );

        if (!updatedSlot) {
            if (fileUploadPath && req.files?.fileUpload?.[0]?.path) {
                try {
                    await fs.promises.unlink(req.files.fileUpload[0].path);
                } catch (e) {}
            }
            return res.status(400).json({
                success: false,
                message: 'This slot was just booked by another user. Please choose another time slot.'
            });
        }

        // Create booking record
        const booking = new ConsultationBooking({
            userId,
            slotId,
            fullName: fullName.trim(),
            email: (email || req.user?.email || '').trim(),
            phone: (phone || req.user?.phone || '').trim(),
            designation: designation.trim(),
            department: department.trim(),
            institute: (institute || designation || '').trim(),
            query: (query || '').trim(),
            fileUpload: fileUploadPath,
            paymentStatus,
            paymentProvider: 'razorpay',
            paymentId: finalPaymentId,
            orderId: finalOrderId,
        });

        await booking.save();

        const populatedBooking = await ConsultationBooking.findById(booking._id)
            .populate('slotId')
            .populate('userId', 'fullName email phone');

        // Notify admins by email (best-effort, does not block the response)
        try {
            const admins = await User.find({
                role: { $in: ['admin', 'super_admin'] },
                isActive: { $ne: false },
            })
                .select('email')
                .lean();

            const adminEmails = [...new Set(admins.map((a) => a.email).filter(Boolean))];

            if (adminEmails.length > 0) {
                emailService
                    .sendConsultationBookingAdminEmail(adminEmails, populatedBooking)
                    .catch((mailError) =>
                        console.error('Failed to send consultation booking admin email:', mailError)
                    );
            } else {
                console.warn('Consultation booking created, but no admin email recipients were found.');
            }
        } catch (notifyError) {
            console.error('Failed to notify admins about consultation booking:', notifyError);
        }

        return res.status(201).json({
            success: true,
            message: 'Consultation booked successfully! Our team will connect with you at the scheduled time.',
            data: populatedBooking
        });

    } catch (error) {
        // Clean up uploaded file if error occurs
        if (req.files && req.files.fileUpload && req.files.fileUpload[0]) {
            try {
                await fs.promises.unlink(req.files.fileUpload[0].path);
            } catch (e) {
                console.error("Failed to delete uploaded file after error:", e);
            }
        }

        console.error('Error booking consultation:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to book consultation' });
    }
};
