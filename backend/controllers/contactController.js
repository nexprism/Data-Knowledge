import ContactPage from '../models/ContactPage.js';
import ContactRequest from '../models/ContactRequest.js';
import User from '../models/user.js';
import emailService from '../utils/emailService.js';

export const DEFAULT_CONTACT_PAGE = {
  badgeText: 'GET IN TOUCH',
  title: 'CONTACT US.',
  description:
    'We are here to help! Whether you have questions about our courses, need technical support, or just want to share feedback, the Support Team is always ready to assist you.',
  primaryEmail: 'dataknowledge.class@gmail.com',
  emailSupportDescription:
    'For program inquiries, course questions, or mentorship assistance:',
  primaryPhone: '+91 74837 41501',
  alternatePhone: '+91 82377 00626',
  whatsappNumber: '917483741501',
  whatsappText: 'Chat on WhatsApp',
  portalTitle: 'Live Classes Portal',
  portalUrl: 'https://classes.dataknowledge.in/',
  portalDescription:
    'Access online live sessions, assignments, and mock test portal:',
  address: 'Data Knowledge Classes & Training, India',
  notificationEmail: '',
  subjectOptions: [
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
  isActive: true,
};

/**
 * Helper to resolve admin email recipients dynamically without hardcoding.
 */
export async function getAdminNotificationRecipients(customEmail = null) {
  const recipients = new Set();

  if (customEmail && typeof customEmail === 'string' && customEmail.includes('@')) {
    customEmail.split(',').forEach((e) => e.trim() && recipients.add(e.trim()));
  }

  if (process.env.ADMIN_NOTIFICATION_EMAIL) {
    process.env.ADMIN_NOTIFICATION_EMAIL.split(',').forEach(
      (e) => e.trim() && recipients.add(e.trim())
    );
  }

  if (process.env.ADMIN_EMAIL) {
    process.env.ADMIN_EMAIL.split(',').forEach(
      (e) => e.trim() && recipients.add(e.trim())
    );
  }

  try {
    const adminUsers = await User.find({
      role: { $in: ['admin', 'super_admin'] },
      isActive: { $ne: false },
    })
      .select('email')
      .lean();

    adminUsers.forEach((u) => {
      if (u.email) recipients.add(u.email.trim());
    });
  } catch (err) {
    console.warn('⚠️ Could not query admin user emails:', err.message);
  }

  if (recipients.size === 0) {
    const fallback =
      process.env.SupportEmail ||
      process.env.EMAIL_FROM ||
      process.env.SMTP_USER ||
      'support@edrilla.com';
    recipients.add(fallback.trim());
  }

  return Array.from(recipients);
}

// -------------------------------------------------------------
// PUBLIC: GET CONTACT PAGE CONTENT
// -------------------------------------------------------------
export const getContactPage = async (req, res) => {
  try {
    let page = await ContactPage.findOne({ isActive: true }).sort({ updatedAt: -1 });
    if (!page) {
      return res.status(200).json({
        success: true,
        message: 'Default Contact Page retrieved',
        data: { contactPage: DEFAULT_CONTACT_PAGE },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contact Page retrieved successfully',
      data: { contactPage: page },
    });
  } catch (error) {
    console.error('Error fetching contact page:', error.message);
    res.status(200).json({
      success: true,
      message: 'Fallback Contact Page retrieved',
      data: { contactPage: DEFAULT_CONTACT_PAGE },
    });
  }
};

// -------------------------------------------------------------
// ADMIN: GET CONTACT PAGE CONTENT
// -------------------------------------------------------------
export const getContactPageAdmin = async (req, res) => {
  try {
    let page = await ContactPage.findOne().sort({ updatedAt: -1 });
    if (!page) {
      page = await ContactPage.create(DEFAULT_CONTACT_PAGE);
    }

    res.status(200).json({
      success: true,
      data: { contactPage: page },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch contact page configuration',
    });
  }
};

// -------------------------------------------------------------
// ADMIN: UPDATE CONTACT PAGE CONTENT
// -------------------------------------------------------------
export const updateContactPage = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Parse subjectOptions if passed as a string or array
    if (typeof updateData.subjectOptions === 'string') {
      try {
        updateData.subjectOptions = JSON.parse(updateData.subjectOptions);
      } catch (e) {
        updateData.subjectOptions = updateData.subjectOptions
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    if (updateData.isActive !== undefined) {
      updateData.isActive =
        updateData.isActive === 'true' || updateData.isActive === true;
    }

    let page = await ContactPage.findOne().sort({ updatedAt: -1 });
    if (page) {
      page = await ContactPage.findByIdAndUpdate(page._id, updateData, {
        new: true,
        runValidators: true,
      });
    } else {
      page = await ContactPage.create({
        ...DEFAULT_CONTACT_PAGE,
        ...updateData,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contact page configuration updated successfully',
      data: { contactPage: page },
    });
  } catch (error) {
    console.error('Error updating contact page:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update contact page configuration',
    });
  }
};

// -------------------------------------------------------------
// PUBLIC: SUBMIT CONTACT FORM REQUEST
// -------------------------------------------------------------
export const submitContactRequest = async (req, res) => {
  try {
    const {
      name,
      userName,
      email,
      userEmail,
      phone,
      phoneNumber,
      code,
      subject,
      message,
      description,
      source,
      extra,
    } = req.body;

    const finalName = (name || userName || '').trim();
    const finalEmail = (email || userEmail || '').trim().toLowerCase();
    let finalPhone = (phone || phoneNumber || '').trim();
    if (code && !finalPhone.startsWith('+')) {
      finalPhone = `${code.trim()} ${finalPhone}`.trim();
    }
    const finalSubject = (subject || 'General Inquiry').trim();
    const finalMessage = (message || description || '').trim();

    if (!finalName) {
      return res.status(400).json({
        success: false,
        message: 'Name is required.',
      });
    }

    if (!finalEmail || !/^\S+@\S+\.\S+$/.test(finalEmail)) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required.',
      });
    }

    if (!finalPhone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required.',
      });
    }

    // Duplicate submission protection (check if identical submission in last 60 seconds)
    const duplicateWindow = new Date(Date.now() - 60 * 1000);
    const existingDuplicate = await ContactRequest.findOne({
      email: finalEmail,
      subject: finalSubject,
      createdAt: { $gte: duplicateWindow },
    });

    if (existingDuplicate) {
      return res.status(200).json({
        success: true,
        message: 'We have already received your submission. Thank you!',
        data: existingDuplicate,
      });
    }

    // Save submission to database
    const contactRequest = new ContactRequest({
      name: finalName,
      email: finalEmail,
      phone: finalPhone,
      subject: finalSubject,
      message: finalMessage,
      source: source || 'Contact Form',
      extra: extra || {},
      status: 'pending',
    });

    await contactRequest.save();

    // Trigger email notification to appropriate configured recipient(s)
    try {
      const contactConfig = await ContactPage.findOne().sort({ updatedAt: -1 }).lean();
      const customRecipient = contactConfig?.notificationEmail || null;
      const recipients = await getAdminNotificationRecipients(customRecipient);

      if (recipients.length > 0) {
        emailService
          .sendContactFormAdminEmail(recipients, contactRequest)
          .catch((mailErr) => {
            console.error('⚠️ Best-effort contact email send failed:', mailErr.message);
          });
      } else {
        console.warn('⚠️ No email recipients resolved for contact form submission.');
      }
    } catch (mailErr) {
      console.error('⚠️ Error resolving recipients for contact notification:', mailErr.message);
    }

    return res.status(201).json({
      success: true,
      message:
        'Your message has been sent successfully! Our team will contact you shortly.',
      data: contactRequest,
    });
  } catch (error) {
    console.error('Error submitting contact request:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit contact request',
    });
  }
};

// -------------------------------------------------------------
// ADMIN: GET ALL CONTACT REQUESTS (WITH SEARCH & STATUS FILTER)
// -------------------------------------------------------------
export const getContactRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const query = { isDeleted: false };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: regex },
        { email: regex },
        { phone: regex },
        { subject: regex },
        { message: regex },
      ];
    }

    const [requests, total, counts] = await Promise.all([
      ContactRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ContactRequest.countDocuments(query),
      ContactRequest.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const summary = {
      total: 0,
      pending: 0,
      in_progress: 0,
      resolved: 0,
    };

    counts.forEach((item) => {
      summary.total += item.count;
      if (summary[item._id] !== undefined) {
        summary[item._id] = item.count;
      }
    });

    res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
      summary,
    });
  } catch (error) {
    console.error('Error fetching contact requests:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch contact requests',
    });
  }
};

// -------------------------------------------------------------
// ADMIN: GET SINGLE CONTACT REQUEST BY ID
// -------------------------------------------------------------
export const getContactRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await ContactRequest.findById(id);

    if (!request || request.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Contact request not found',
      });
    }

    res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch contact request',
    });
  }
};

// -------------------------------------------------------------
// ADMIN: UPDATE CONTACT REQUEST STATUS & ADMIN NOTES
// -------------------------------------------------------------
export const updateContactRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const allowedStatuses = ['pending', 'in_progress', 'resolved'];
    const updatePayload = {};

    if (status) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`,
        });
      }
      updatePayload.status = status;
    }

    if (adminNotes !== undefined) {
      updatePayload.adminNotes = adminNotes;
    }

    const updated = await ContactRequest.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Contact request not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contact request updated successfully',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update contact request',
    });
  }
};

// -------------------------------------------------------------
// ADMIN: DELETE CONTACT REQUEST
// -------------------------------------------------------------
export const deleteContactRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ContactRequest.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Contact request not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contact request deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete contact request',
    });
  }
};
