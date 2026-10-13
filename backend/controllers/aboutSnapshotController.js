import AboutSnapshot, { DEFAULT_ABOUT_US } from '../models/AboutSnapshot.js';

export const DEFAULT_ABOUT_SNAPSHOT = {
  badgeText: 'About Data Knowledge',
  headlinePrefix: 'Empowering Learners with',
  headlineHighlight: 'Real-World Skills.',
  paragraph1:
    'At Data Knowledge, our mission is to provide practical and industry-focused training in tools like SQL, Excel, Power BI, Tableau, Python, and Business Analysis. Our courses are designed to help learners gain real-world skills that companies actually look for in data analyst and data science roles.',
  paragraph2:
    'The training programs focus on hands-on learning, real-time projects, and step-by-step guidance so that students can confidently work on real business problems. Whether you are a beginner starting your data analytics journey or a working professional looking to upgrade your skills, our courses are structured to support your career growth.',
  bulletPoints: [
    'Hands-on training in SQL, Excel, Power BI, Tableau, Python & Business Analysis',
    'Learn from real industry experts with experience in Data Analytics, ML & AI',
    'Job-ready preparation with resume building, mock interviews & real-time projects',
    'Continuous project support, code reviews & personalized career mentorship',
  ],
  primaryButtonText: 'Discover More About Us',
  primaryButtonLink: '/about-us',
  showPrimaryButton: true,
  secondaryButtonText: 'Explore Courses',
  secondaryButtonLink: '/courses',
  showSecondaryButton: true,
  image: '/hero_section.png',
  imageAlt: 'Data Knowledge Practical Learning',
  aboutUs: DEFAULT_ABOUT_US,
  isActive: true,
};

const pick = (value, fallback) =>
  value === undefined || value === null ? fallback : String(value);

const pickArray = (value, fallback) => (Array.isArray(value) ? value : fallback);

const sanitizeStats = (arr, fallback) => {
  if (!Array.isArray(arr)) return fallback;
  return arr.map((s) => ({
    value: pick(s?.value, ''),
    label: pick(s?.label, ''),
  }));
};

const sanitizeBadges = (arr, fallback) => {
  if (!Array.isArray(arr)) return fallback;
  return arr.map((b) => ({
    title: pick(b?.title, ''),
    description: pick(b?.description, ''),
  }));
};

const sanitizePillars = (arr, fallback) => {
  if (!Array.isArray(arr)) return fallback;
  return arr.map((p) => ({
    icon: pick(p?.icon, 'trending'),
    badge: pick(p?.badge, ''),
    title: pick(p?.title, ''),
    description: pick(p?.description, ''),
  }));
};

const sanitizeTools = (arr, fallback) => {
  if (!Array.isArray(arr)) return fallback;
  return arr.map((t) => ({
    icon: pick(t?.icon, 'activity'),
    title: pick(t?.title, ''),
    description: pick(t?.description, ''),
  }));
};

// Ensures every About Us section/field is present, falling back to defaults.
export const normalizeAboutUs = (input) => {
  const src = input && typeof input === 'object' ? input.toObject?.() || input : {};
  const b = DEFAULT_ABOUT_US;

  const hero = src.hero || {};
  const philosophy = src.philosophy || {};
  const vision = src.vision || {};
  const pillars = src.pillars || {};
  const tools = src.tools || {};
  const cta = src.cta || {};

  return {
    hero: {
      badgeText: pick(hero.badgeText, b.hero.badgeText),
      titleLine1: pick(hero.titleLine1, b.hero.titleLine1),
      titleLine2: pick(hero.titleLine2, b.hero.titleLine2),
      description: pick(hero.description, b.hero.description),
      stats: sanitizeStats(hero.stats, b.hero.stats),
    },
    philosophy: {
      badgeText: pick(philosophy.badgeText, b.philosophy.badgeText),
      headingPrefix: pick(philosophy.headingPrefix, b.philosophy.headingPrefix),
      headingHighlightOne: pick(philosophy.headingHighlightOne, b.philosophy.headingHighlightOne),
      headingConnector: pick(philosophy.headingConnector, b.philosophy.headingConnector),
      headingHighlightTwo: pick(philosophy.headingHighlightTwo, b.philosophy.headingHighlightTwo),
      paragraphs: pickArray(philosophy.paragraphs, b.philosophy.paragraphs).map((p) => String(p)),
      cardTitle: pick(philosophy.cardTitle, b.philosophy.cardTitle),
      cardSubtitle: pick(philosophy.cardSubtitle, b.philosophy.cardSubtitle),
      cardImage: pick(philosophy.cardImage, b.philosophy.cardImage),
      cardImageAlt: pick(philosophy.cardImageAlt, b.philosophy.cardImageAlt),
      valueBadges: sanitizeBadges(philosophy.valueBadges, b.philosophy.valueBadges),
    },
    vision: {
      badgeText: pick(vision.badgeText, b.vision.badgeText),
      heading: pick(vision.heading, b.vision.heading),
      quote: pick(vision.quote, b.vision.quote),
    },
    pillars: {
      badgeText: pick(pillars.badgeText, b.pillars.badgeText),
      heading: pick(pillars.heading, b.pillars.heading),
      description: pick(pillars.description, b.pillars.description),
      items: sanitizePillars(pillars.items, b.pillars.items),
    },
    tools: {
      heading: pick(tools.heading, b.tools.heading),
      description: pick(tools.description, b.tools.description),
      items: sanitizeTools(tools.items, b.tools.items),
    },
    cta: {
      heading: pick(cta.heading, b.cta.heading),
      description: pick(cta.description, b.cta.description),
      primaryButtonText: pick(cta.primaryButtonText, b.cta.primaryButtonText),
      primaryButtonLink: pick(cta.primaryButtonLink, b.cta.primaryButtonLink),
      secondaryButtonText: pick(cta.secondaryButtonText, b.cta.secondaryButtonText),
      secondaryButtonLink: pick(cta.secondaryButtonLink, b.cta.secondaryButtonLink),
    },
  };
};

const serializeSnapshot = (doc) => {
  const obj = doc && doc.toObject ? doc.toObject() : doc;
  if (!obj) return { ...DEFAULT_ABOUT_SNAPSHOT };
  return {
    ...obj,
    aboutUs: normalizeAboutUs(obj.aboutUs),
  };
};

// Public: Get About Snapshot data
export const getAboutSnapshot = async (req, res) => {
  try {
    let data = await AboutSnapshot.findOne({ isActive: true }).sort({ updatedAt: -1 });
    if (!data) {
      return res.status(200).json({
        success: true,
        message: 'Default About Snapshot retrieved',
        data: { aboutSnapshot: { ...DEFAULT_ABOUT_SNAPSHOT } },
      });
    }

    res.status(200).json({
      success: true,
      message: 'About Snapshot retrieved successfully',
      data: { aboutSnapshot: serializeSnapshot(data) },
    });
  } catch (error) {
    console.error('Error fetching About Snapshot:', error.message);
    res.status(200).json({
      success: true,
      message: 'Fallback About Snapshot retrieved',
      data: { aboutSnapshot: { ...DEFAULT_ABOUT_SNAPSHOT } },
    });
  }
};

// Admin: Get full About Snapshot config
export const getAboutSnapshotAdmin = async (req, res) => {
  try {
    let data = await AboutSnapshot.findOne().sort({ updatedAt: -1 });
    if (!data) {
      data = await AboutSnapshot.create({
        ...DEFAULT_ABOUT_SNAPSHOT,
        aboutUs: DEFAULT_ABOUT_US,
      });
    }

    res.status(200).json({
      success: true,
      data: { aboutSnapshot: serializeSnapshot(data) },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch About Snapshot config',
    });
  }
};

// Admin: Update About Snapshot
export const updateAboutSnapshot = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Handle image file upload
    if (req.file) {
      updateData.image = `uploads/${req.file.filename}`;
    }

    // Parse bulletPoints if passed as JSON string
    if (typeof updateData.bulletPoints === 'string') {
      try {
        updateData.bulletPoints = JSON.parse(updateData.bulletPoints);
      } catch (e) {
        updateData.bulletPoints = updateData.bulletPoints
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    // Parse aboutUs if passed as JSON string (multipart form-data)
    if (typeof updateData.aboutUs === 'string') {
      try {
        updateData.aboutUs = JSON.parse(updateData.aboutUs);
      } catch (e) {
        delete updateData.aboutUs;
      }
    }

    if (updateData.aboutUs !== undefined) {
      updateData.aboutUs = normalizeAboutUs(updateData.aboutUs);
    }

    if (updateData.showPrimaryButton !== undefined) {
      updateData.showPrimaryButton =
        updateData.showPrimaryButton === 'true' || updateData.showPrimaryButton === true;
    }
    if (updateData.showSecondaryButton !== undefined) {
      updateData.showSecondaryButton =
        updateData.showSecondaryButton === 'true' || updateData.showSecondaryButton === true;
    }
    if (updateData.isActive !== undefined) {
      updateData.isActive = updateData.isActive === 'true' || updateData.isActive === true;
    }

    let data = await AboutSnapshot.findOne().sort({ updatedAt: -1 });

    if (data) {
      data = await AboutSnapshot.findByIdAndUpdate(data._id, updateData, {
        new: true,
        runValidators: true,
      });
    } else {
      data = await AboutSnapshot.create({ ...DEFAULT_ABOUT_SNAPSHOT, ...updateData });
    }

    res.status(200).json({
      success: true,
      message: 'About Snapshot updated successfully',
      data: { aboutSnapshot: serializeSnapshot(data) },
    });
  } catch (error) {
    console.error('Error updating About Snapshot:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update About Snapshot',
    });
  }
};
