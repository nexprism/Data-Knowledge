import Testimonial from '../models/Testimonial.js';
import Course from '../models/Course.js';
import mongoose from 'mongoose';

const updateCourseStats = async (courseId) => {
  if (!courseId) return;

  const stats = await Testimonial.aggregate([
    { $match: { courseId: new mongoose.Types.ObjectId(courseId), status: 'approved', rating: { $exists: true, $ne: null } } },
    {
      $group: {
        _id: '$courseId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await Course.findByIdAndUpdate(courseId, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      totalReviews: stats[0].totalReviews
    });
  } else {
    await Course.findByIdAndUpdate(courseId, {
      averageRating: 0,
      totalReviews: 0
    });
  }
};

const createTestimonial = async (data, isAdmin = false) => {
  if (isAdmin) {
    data.status = 'approved';
  } else {
    data.status = 'pending';
  }
  const testimonial = new Testimonial(data);
  const saved = await testimonial.save();
  if (saved.status === 'approved' && saved.courseId) {
    await updateCourseStats(saved.courseId);
  }
  return saved;
};

const defaultSeedReviews = [
  {
    name: 'Pooja Sharma',
    role: 'Data Analyst @ Accenture',
    message: 'The Data Analyst masterclass was a career turnaround for me. Coming from a non-IT background, the step-by-step SQL, Power BI, and Python projects gave me the confidence to crack my interviews in 45 days!',
    rating: 5,
    status: 'approved',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=688&auto=format&fit=crop'
  },
  {
    name: 'Karan Verma',
    role: 'BI Developer @ Deloitte',
    message: "Hands down the best practical data analytics training in India. Rushikesh's mentorship and direct doubt resolution sessions are phenomenal.",
    rating: 5,
    status: 'approved',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=688&auto=format&fit=crop'
  },
  {
    name: 'Deepak Patel',
    role: 'Data Engineer @ TCS',
    message: 'The curriculum is 100% industry-driven. Real-world ETL pipelines, cloud data warehouses, and portfolio guidance helped me secure a 140% salary hike.',
    rating: 5,
    status: 'approved',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=688&auto=format&fit=crop'
  },
  {
    name: 'Ananya Deshmukh',
    role: 'Product Analyst @ Swiggy',
    message: 'The end-to-end assignments and mock interviews felt exactly like real hiring assessments. Highly recommend Data Knowledge to anyone serious about transitioning to data!',
    rating: 5,
    status: 'approved',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=688&auto=format&fit=crop'
  },
  {
    name: 'Rohit Joshi',
    role: 'Junior Data Scientist @ Capgemini',
    message: 'From basic Excel to complex predictive models and dashboards. The structured modules and community support made learning effortless.',
    rating: 5,
    status: 'approved',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=688&auto=format&fit=crop'
  },
  {
    name: 'Snehal Kulkarni',
    role: 'Data Consultant @ PwC',
    message: 'Exceptional quality. The live projects and mentorship support are unmatched. Got placed within 2 months of course completion!',
    rating: 5,
    status: 'approved',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=688&auto=format&fit=crop'
  }
];

const getTestimonials = async (filter = {}, options = {}) => {
  const approvedCount = await Testimonial.countDocuments({ status: 'approved' });
  if (approvedCount === 0) {
    try {
      await Testimonial.insertMany(defaultSeedReviews);
    } catch (e) {
      console.error('Error seeding default testimonials:', e);
    }
  }
  let query = Testimonial.find(filter);
  if (options.sort) {
    query = query.sort(options.sort);
  } else {
    query = query.sort({ order: 1, createdAt: -1 });
  }
  if (options.skip !== undefined) {
    query = query.skip(options.skip);
  }
  if (options.limit !== undefined) {
    query = query.limit(options.limit);
  }
  return await query
    .populate('userId', 'fullName email profilePicture')
    .lean();
};

const getTestimonialById = async (id) => {
  return await Testimonial.findById(id);
};

const updateTestimonial = async (id, update) => {
  const testimonial = await Testimonial.findByIdAndUpdate(id, update, { new: true });
  if (testimonial && testimonial.courseId) {
    await updateCourseStats(testimonial.courseId);
  }
  return testimonial;
};

const deleteTestimonial = async (id) => {
  const testimonial = await Testimonial.findByIdAndDelete(id);
  if (testimonial && testimonial.courseId && testimonial.status === 'approved') {
    await updateCourseStats(testimonial.courseId);
  }
  return testimonial;
};

export default {
  createTestimonial,
  getTestimonials,
  getTestimonialById,
  updateTestimonial,
  deleteTestimonial
};