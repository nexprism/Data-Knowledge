import testimonialService from '../service/testimonialService.js';
import Testimonial from '../models/Testimonial.js';

// Admin: Add testimonial manually
export const addTestimonialAdmin = async (req, res) => {
  try {
    const { name, role, message, rating, courseId, order } = req.body;
    if (!message || !name) {
      return res.status(400).json({ success: false, message: 'Name and message are required.' });
    }

    const image = req.files?.image?.[0]?.path?.replace(/\\/g, '/');
    const reviewImageFiles = [
      ...(req.files?.reviewImages || []),
      ...(req.files?.screenshot || [])
    ];
    const reviewImages = reviewImageFiles.slice(0, 1).map(f => f.path.replace(/\\/g, '/'));
    const screenshot = reviewImages[0] || req.files?.screenshot?.[0]?.path?.replace(/\\/g, '/') || null;
    const video = req.files?.video?.[0]?.path?.replace(/\\/g, '/');

    const testimonial = await testimonialService.createTestimonial({ 
      name, 
      role, 
      message, 
      rating, 
      courseId, 
      image, 
      screenshot, 
      reviewImages, 
      video,
      order: order !== undefined ? Number(order) : 0
    }, true);
    res.json({ success: true, message: 'Testimonial added and approved.', data: testimonial });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: List all testimonials with filters
export const listTestimonialsAdmin = async (req, res) => {
  try {
    const { status, search, courseId } = req.query;
    let filter = {};
    if (status) filter.status = status;
    if (search) filter.message = { $regex: search, $options: 'i' };
    if (courseId) filter.courseId = courseId;
    const testimonials = await testimonialService.getTestimonials(filter, { sort: { order: 1, createdAt: -1 } });
    res.json({ success: true, message: 'Testimonials fetched.', data: testimonials });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: Update testimonial
export const updateTestimonialAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, message, status, rating, courseId, existingReviewImages, order } = req.body;
    const update = {};
    if (name) update.name = name;
    if (role !== undefined) update.role = role;
    if (message) update.message = message;
    if (status) update.status = status;
    if (rating) update.rating = rating;
    if (courseId !== undefined) update.courseId = courseId || null;
    if (order !== undefined) update.order = Number(order);

    if (req.files?.image?.[0]) {
      update.image = req.files.image[0].path.replace(/\\/g, '/');
    }

    const newFiles = [
      ...(req.files?.reviewImages || []),
      ...(req.files?.screenshot || [])
    ].map(f => f.path.replace(/\\/g, '/'));

    let keptExisting = [];
    if (existingReviewImages !== undefined) {
      try {
        keptExisting = typeof existingReviewImages === 'string' ? JSON.parse(existingReviewImages) : existingReviewImages;
        if (!Array.isArray(keptExisting)) keptExisting = [keptExisting];
      } catch {
        keptExisting = [existingReviewImages];
      }
    }

    if (newFiles.length > 0 || existingReviewImages !== undefined) {
      const combined = [...keptExisting, ...newFiles].filter(Boolean).slice(0, 1);
      update.reviewImages = combined;
      update.screenshot = combined[0] || null;
    } else if (req.files?.screenshot?.[0]) {
      update.screenshot = req.files.screenshot[0].path.replace(/\\/g, '/');
      update.reviewImages = [update.screenshot];
    }

    if (req.files?.video?.[0]) {
      update.video = req.files.video[0].path.replace(/\\/g, '/');
    }

    const testimonial = await testimonialService.updateTestimonial(id, update);
    if (!testimonial) return res.status(404).json({ success: false, message: 'Testimonial not found.' });
    res.json({ success: true, message: 'Testimonial updated.', data: testimonial });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: Delete testimonial
export const deleteTestimonialAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const testimonial = await testimonialService.deleteTestimonial(id);
    if (!testimonial) return res.status(404).json({ success: false, message: 'Testimonial not found.' });
    res.json({ success: true, message: 'Testimonial deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: Reorder testimonials and/or batch update status (Kanban drag-and-drop)
export const reorderTestimonialsAdmin = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items array is required.' });
    }

    const bulkOps = items.map((item, idx) => {
      const setFields = {};
      if (item.order !== undefined) {
        setFields.order = Number(item.order);
      } else {
        setFields.order = idx;
      }
      if (item.status && ['pending', 'approved', 'rejected'].includes(item.status)) {
        setFields.status = item.status;
      }

      return {
        updateOne: {
          filter: { _id: item.id || item._id },
          update: { $set: setFields }
        }
      };
    });

    await Testimonial.bulkWrite(bulkOps);
    res.json({ success: true, message: 'Testimonials positions updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// User: Submit own testimonial
export const submitTestimonial = async (req, res) => {
  try {
    let { message, rating, role, courseId, name, userId } = req.body;
    
    // Clean up escaped quotes from multipart form data
    const cleanString = (str) => {
      if (typeof str === 'string') {
        // Remove escaped quotes and extra quotes
        return str.replace(/^["']|["']$/g, '').replace(/\\"/g, '"').replace(/\\'/g, "'").trim();
      }
      return str;
    };
    
    message = cleanString(message);
    role = cleanString(role);
    name = cleanString(name);
    userId = cleanString(userId);
    
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }
    
    // Get userId from authenticated user if available, otherwise from request body (cleaned)
    const finalUserId = req.user?._id || req.user?.id || (userId && userId !== '' ? userId : null) || null;

    // Optional: Check if user is enrolled in the course (only if userId and courseId provided)
    if (finalUserId && courseId) {
      const CourseEnrollment = (await import('../models/CourseEnrollment.js')).default;
      const isEnrolled = await CourseEnrollment.findOne({
        userId: finalUserId,
        courseId,
        status: { $in: ['active', 'completed'] }
      });

      if (!isEnrolled) {
        return res.status(403).json({
          success: false,
          message: 'You must be enrolled in this course to leave a testimonial.'
        });
      }
    }

    const image = req.files?.image?.[0]?.path?.replace(/\\/g, '/');
    const reviewImageFiles = [
      ...(req.files?.reviewImages || []),
      ...(req.files?.screenshot || [])
    ];
    const reviewImages = reviewImageFiles.map(f => f.path.replace(/\\/g, '/'));
    const screenshot = reviewImages[0] || req.files?.screenshot?.[0]?.path?.replace(/\\/g, '/') || null;
    const video = req.files?.video?.[0]?.path?.replace(/\\/g, '/');

    // Include name and userId in testimonial data if provided
    const testimonialData = { message, rating, role, courseId, image, screenshot, reviewImages, video };
    if (finalUserId) {
      testimonialData.userId = finalUserId;
    }
    if (name) {
      testimonialData.name = name;
    }

    const testimonial = await testimonialService.createTestimonial(testimonialData, false);
    
    // Get user information to populate name if userId is available
    let userName = null;
    if (finalUserId) {
      try {
        const User = (await import('../models/user.js')).default;
        const user = await User.findById(finalUserId).select('fullName');
        userName = user?.fullName || null;
      } catch (userErr) {
        console.error('Error fetching user:', userErr);
        // Fallback to req.user if available
        userName = req.user?.fullName || req.user?.name || null;
      }
    }
    
    // Convert testimonial to plain object
    const testimonialObj = testimonial.toObject ? testimonial.toObject() : testimonial;
    
    // Ensure userId is included as string - prioritize from request body, then from saved testimonial
    let userIdString = null;
    if (finalUserId) {
      userIdString = finalUserId.toString ? finalUserId.toString() : String(finalUserId);
    } else if (testimonialObj.userId) {
      userIdString = testimonialObj.userId.toString ? testimonialObj.userId.toString() : String(testimonialObj.userId);
    }
    
    // Use name from body if provided, otherwise use user's fullName, otherwise use saved name
    const finalName = name || userName || testimonialObj.name || null;
    
    // Prepare response data with userId and name
    const responseData = {
      ...testimonialObj,
      userId: userIdString,
      name: finalName
    };
    
    res.json({ success: true, message: 'Testimonial submitted for approval.', data: responseData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// User: Get own testimonials
export const getMyTestimonials = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const testimonials = await testimonialService.getTestimonials({ userId }, { sort: '-createdAt' });
    res.json({ success: true, message: 'Your testimonials fetched.', data: testimonials });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// User: Get all approved testimonials
export const getApprovedTestimonials = async (req, res) => {
  try {
    const { courseId } = req.query;
    const filter = { status: 'approved' };

    // Add courseId filter if provided
    if (courseId) {
      filter.courseId = courseId;
    }

    const hasPagination = req.query.page !== undefined || req.query.limit !== undefined;
    if (!hasPagination) {
      const testimonials = await testimonialService.getTestimonials(filter, { sort: { order: 1, createdAt: -1 } });
      return res.json({ success: true, message: 'Approved testimonials fetched.', data: testimonials });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 9));
    const [total, testimonials] = await Promise.all([
      Testimonial.countDocuments(filter),
      testimonialService.getTestimonials(filter, {
        sort: { order: 1, createdAt: -1 },
        skip: (page - 1) * limit,
        limit,
      }),
    ]);

    res.json({
      success: true,
      message: 'Approved testimonials fetched.',
      data: testimonials,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// User: Get single testimonial (if approved or belongs to user)
export const getTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const testimonial = await testimonialService.getTestimonialById(id);
    if (!testimonial) return res.status(404).json({ success: false, message: 'Testimonial not found.' });
    if (testimonial.status === 'approved' || (req.user && testimonial.userId?.toString() === req.user._id.toString())) {
      return res.json({ success: true, message: 'Testimonial fetched.', data: testimonial });
    }
    res.status(403).json({ success: false, message: 'Not authorized to view this testimonial.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};