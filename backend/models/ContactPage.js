import mongoose from 'mongoose';

const contactPageSchema = new mongoose.Schema(
  {
    badgeText: {
      type: String,
      default: 'GET IN TOUCH',
      trim: true,
    },
    title: {
      type: String,
      default: 'CONTACT US.',
      trim: true,
    },
    description: {
      type: String,
      default:
        'We are here to help! Whether you have questions about our courses, need technical support, or just want to share feedback, the Support Team is always ready to assist you.',
      trim: true,
    },
    primaryEmail: {
      type: String,
      default: 'dataknowledge.class@gmail.com',
      trim: true,
    },
    emailSupportDescription: {
      type: String,
      default:
        'For program inquiries, course questions, or mentorship assistance:',
      trim: true,
    },
    primaryPhone: {
      type: String,
      default: '+91 74837 41501',
      trim: true,
    },
    alternatePhone: {
      type: String,
      default: '+91 82377 00626',
      trim: true,
    },
    whatsappNumber: {
      type: String,
      default: '917483741501',
      trim: true,
    },
    whatsappText: {
      type: String,
      default: 'Chat on WhatsApp',
      trim: true,
    },
    portalTitle: {
      type: String,
      default: 'Live Classes Portal',
      trim: true,
    },
    portalUrl: {
      type: String,
      default: 'https://classes.dataknowledge.in/',
      trim: true,
    },
    portalDescription: {
      type: String,
      default:
        'Access online live sessions, assignments, and mock test portal:',
      trim: true,
    },
    address: {
      type: String,
      default: 'Data Knowledge Classes & Training, India',
      trim: true,
    },
    notificationEmail: {
      type: String,
      default: '',
      trim: true,
    },
    subjectOptions: {
      type: [String],
      default: [
        'General Inquiry',
        'Course Enquiry',
        'Solopreneur',
        'Personal Branding',
        'Studio Services',
        'Cohort Enrollment',
        'Offline Mentorship Enrollment',
        'Billing or Payment Issue',
        'Feedback',
        'Complaint',
        'Other',
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const ContactPage =
  mongoose.models.ContactPage ||
  mongoose.model('ContactPage', contactPageSchema);

export default ContactPage;
