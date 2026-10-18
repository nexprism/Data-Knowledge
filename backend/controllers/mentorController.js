import Mentor from '../models/Mentor.js';
import mongoose from 'mongoose';

const safeJsonParse = (val, fallback = []) => {
  if (val === undefined || val === null || val === '') return fallback;
  if (Array.isArray(val)) return val;
  if (typeof val === 'object') return val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return fallback;
    try {
      return JSON.parse(trimmed);
    } catch {
      if (trimmed.includes('\n')) {
        return trimmed.split('\n').map(s => s.trim()).filter(Boolean);
      }
      if (trimmed.includes(',')) {
        return trimmed.split(',').map(s => s.trim()).filter(Boolean);
      }
      return [trimmed];
    }
  }
  return fallback;
};

export const createMentor = async (req, res) => {
  try {
    const { name, role, exCompanies, experienceBadge, stats, bio, skills, accentGradient, glowColor, borderColor, status } = req.body;
    
    const image = req.files?.image?.[0]?.path?.replace(/\\/g, '/');

    const mentor = new Mentor({
      name,
      role,
      exCompanies: safeJsonParse(exCompanies),
      experienceBadge,
      image,
      stats: safeJsonParse(stats),
      bio: safeJsonParse(bio),
      skills: safeJsonParse(skills),
      accentGradient,
      glowColor,
      borderColor,
      status: status || 'active'
    });

    await mentor.save();
    res.status(201).json({ success: true, message: 'Mentor created successfully', data: mentor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMentors = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    const mentors = await Mentor.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: mentors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMentorById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid mentor ID format' });
    }
    const mentor = await Mentor.findById(req.params.id);
    if (!mentor) {
      return res.status(404).json({ success: false, message: 'Mentor not found' });
    }
    res.json({ success: true, data: mentor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMentor = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid mentor ID format' });
    }

    const { name, role, exCompanies, experienceBadge, stats, bio, skills, accentGradient, glowColor, borderColor, status } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (exCompanies !== undefined) updateData.exCompanies = safeJsonParse(exCompanies);
    if (experienceBadge !== undefined) updateData.experienceBadge = experienceBadge;
    if (stats !== undefined) updateData.stats = safeJsonParse(stats);
    if (bio !== undefined) updateData.bio = safeJsonParse(bio);
    if (skills !== undefined) updateData.skills = safeJsonParse(skills);
    if (accentGradient !== undefined) updateData.accentGradient = accentGradient;
    if (glowColor !== undefined) updateData.glowColor = glowColor;
    if (borderColor !== undefined) updateData.borderColor = borderColor;
    if (status !== undefined) updateData.status = status;

    if (req.files?.image?.[0]) {
      updateData.image = req.files.image[0].path.replace(/\\/g, '/');
    }

    const mentor = await Mentor.findByIdAndUpdate(id, updateData, { new: true });
    if (!mentor) {
      return res.status(404).json({ success: false, message: 'Mentor not found' });
    }

    res.json({ success: true, message: 'Mentor updated successfully', data: mentor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteMentor = async (req, res) => {
  try {
    const { id } = req.params;
    const mentor = await Mentor.findByIdAndDelete(id);
    if (!mentor) {
      return res.status(404).json({ success: false, message: 'Mentor not found' });
    }
    res.json({ success: true, message: 'Mentor deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
