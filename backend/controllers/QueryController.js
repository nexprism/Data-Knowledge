import QueryService from '../service/QueryService.js';
import emailService from '../utils/emailService.js';
import { getAdminNotificationRecipients } from './contactController.js';

const queryService = new QueryService();

export const createQuery = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    // Save query to database first
    const query = await queryService.createQuery(req.body);

    // After successful save, trigger email notification asynchronously
    try {
      const recipients = await getAdminNotificationRecipients();
      if (recipients.length > 0) {
        emailService
          .sendCourseQueryAdminEmail(recipients, query)
          .catch((mailErr) => {
            console.error('⚠️ Best-effort course query email failed:', mailErr.message);
          });
      } else {
        console.warn('⚠️ No recipients resolved for student course query notification.');
      }
    } catch (mailErr) {
      console.error('⚠️ Error resolving recipients for course query notification:', mailErr.message);
    }

    res.status(201).json({ success: true, message: 'Query submitted successfully', data: query });
  } catch (err) {
    console.error('Error creating query:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to submit query' });
  }
};

export const getAllQueries = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status, category } = req.query;

    const queries = await queryService.getAllQueries({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status,
      category
    });

    res.status(200).json({ success: true, message: 'Queries fetched', ...queries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


export const getQueryById = async (req, res) => {
  try {
    const query = await queryService.getQueryById(req.params.id);
    if (!query) return res.status(404).json({ success: false, message: 'Query not found' });
    res.status(200).json({ success: true, message: 'Query fetched', data: query });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateQuery = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.status && typeof updateData.status === 'string') {
      updateData.status = updateData.status.toLowerCase().trim().replace(/\s+/g, '_');
    }
    const updated = await queryService.updateQuery(req.params.id, updateData);
    if (!updated) return res.status(404).json({ success: false, message: 'Query not found' });
    res.status(200).json({ success: true, message: 'Query updated successfully', data: updated });
  } catch (err) {
    console.error('Error in updateQuery:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to update query' });
  }
};
