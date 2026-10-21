import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }, // Optional course reference
  name: { type: String }, // Required if created by admin
  role: { type: String },
  message: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5 },
  image: { type: String }, // URL or path to image / avatar
  screenshot: { type: String }, // URL or path to review screenshot proof
  reviewImages: [{ type: String }], // Array of user review images / screenshots
  video: { type: String }, // URL or path to video
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    required: true
  },
  order: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Testimonial', testimonialSchema);