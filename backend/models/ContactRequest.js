import mongoose from 'mongoose';

const contactRequestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      default: 'General Inquiry',
    },
    message: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved'],
      default: 'pending',
    },
    source: {
      type: String,
      trim: true,
      default: 'Contact Form',
    },
    adminNotes: {
      type: String,
      trim: true,
      default: '',
    },
    extra: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for quick lookups and search
contactRequestSchema.index({ createdAt: -1 });
contactRequestSchema.index({ status: 1, createdAt: -1 });
contactRequestSchema.index({ email: 1 });

const ContactRequest =
  mongoose.models.ContactRequest ||
  mongoose.model('ContactRequest', contactRequestSchema);

export default ContactRequest;
