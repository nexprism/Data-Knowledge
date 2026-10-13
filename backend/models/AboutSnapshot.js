import mongoose from 'mongoose';

const text = { type: String, trim: true, default: '' };

const statSchema = new mongoose.Schema(
  {
    value: { ...text, default: '100%' },
    label: { ...text, default: 'Practical Training' },
  },
  { _id: false }
);

const badgeSchema = new mongoose.Schema(
  {
    title: text,
    description: text,
  },
  { _id: false }
);

const pillarSchema = new mongoose.Schema(
  {
    icon: { ...text, default: 'trending' },
    badge: text,
    title: text,
    description: text,
  },
  { _id: false }
);

const toolSchema = new mongoose.Schema(
  {
    icon: { ...text, default: 'activity' },
    title: text,
    description: text,
  },
  { _id: false }
);

export const DEFAULT_ABOUT_US = {
  hero: {
    badgeText: 'Practical & Industry-Focused Hub',
    titleLine1: 'About Data Knowledge',
    titleLine2: 'Real Skills for Real-World Data Careers',
    description:
      'At Data Knowledge, our mission is to provide practical and industry-focused training in tools like SQL, Excel, Power BI, Tableau, Python, and Business Analysis. Our courses are designed to help learners gain real-world skills that companies actually look for in data analyst and data science roles.',
    stats: [
      { value: '100%', label: 'Practical Training' },
      { value: 'Real-Time', label: 'Industry Projects' },
      { value: 'Job-Ready', label: 'Mock Interviews & Resume' },
      { value: 'Mentors', label: 'Industry Analytics Experts' },
    ],
  },
  philosophy: {
    badgeText: 'Our Core Philosophy',
    headingPrefix: 'Bridging the gap between',
    headingHighlightOne: 'learning tools',
    headingConnector: 'and',
    headingHighlightTwo: 'solving business problems',
    paragraphs: [
      'The training programs focus on hands-on learning, real-time projects, and step-by-step guidance so that students can confidently work on real business problems. Whether you are a beginner starting your data analytics journey or a working professional looking to upgrade your skills, our courses are structured to support your career growth.',
      'Our mentors bring real industry experience across data engineering, business intelligence, ML modeling, and enterprise reporting, giving you the edge you need during technical hiring rounds.',
      'From building complex SQL queries and Python pipelines to presenting storytelling dashboards in Power BI and Tableau, we prepare you for every stage of modern analytics roles.',
    ],
    cardTitle: 'Data Knowledge',
    cardSubtitle: 'Practical & Industry-Focused Training',
    cardImage: '/data_knowlege/logo/logo.png',
    cardImageAlt: 'Data Knowledge Logo',
    valueBadges: [
      {
        title: 'Learn From Real Industry Experts',
        description: 'Real business scenarios, best practices, and industry workflows.',
      },
      {
        title: 'Designed to Make You Job Ready',
        description: 'Resume optimization, mock interviews, and portfolio projects.',
      },
      {
        title: 'Data Science, ML & AI',
        description: 'Hands-on algorithms, predictive models, and modern AI tools.',
      },
    ],
  },
  vision: {
    badgeText: 'Our Commitment',
    heading: 'Our Vision & Mission',
    quote:
      'At Data Knowledge, our mission is to provide practical and industry-focused training in tools like SQL, Excel, Power BI, Tableau, Python, and Business Analysis. Our courses are designed to help learners gain real-world skills that companies actually look for in data analyst and data science roles, supporting every student with hands-on learning, continuous project support, and mock interview preparation.',
  },
  pillars: {
    badgeText: 'Core Learning Tracks',
    heading: 'How We Train',
    description:
      'Every module is tailored to build practical competence, enabling you to step into data analyst, business analyst, and data science interviews with confidence:',
    items: [
      {
        icon: 'trending',
        badge: 'Core Tools',
        title: 'Practical & Industry-Focused Curriculum',
        description:
          'Our training is engineered around real-world tools that employers look for: SQL, Advanced Excel, Power BI, Tableau, Python, and Business Analysis frameworks.',
      },
      {
        icon: 'users',
        badge: 'Expert Mentors',
        title: 'Trained by Real Industry Experts',
        description:
          'Get trained by seasoned professionals with active industry experience in Data Analytics, Business Analysis, Machine Learning, Data Science, and AI.',
      },
      {
        icon: 'monitor',
        badge: 'Hands-on Projects',
        title: 'Real-Time Project Problem Solving',
        description:
          'Work on hands-on datasets, industry-level case studies, and business scenarios that empower you to confidently work on real business challenges.',
      },
      {
        icon: 'globe',
        badge: 'Next-Gen AI',
        title: 'Data Science, ML & Artificial Intelligence',
        description:
          'Comprehensive modules spanning predictive modeling, machine learning algorithms, deep learning fundamentals, and modern generative AI tools.',
      },
      {
        icon: 'star',
        badge: 'Job Readiness',
        title: 'Resume Building & Mock Interviews',
        description:
          'Structured career prep including profile building, LinkedIn optimization, mock interviews, and scenario-based technical questions to crack hiring rounds.',
      },
      {
        icon: 'bars',
        badge: 'Interactive Mentorship',
        title: 'Continuous Support & Live Classes',
        description:
          'Access our live classroom ecosystem at classes.dataknowledge.in with continuous doubt clearance, 1-on-1 mentorship, and step-by-step guidance.',
      },
    ],
  },
  tools: {
    heading: 'Master In-Demand Industry Tools',
    description:
      'Hands-on mastery over the top toolsets demanded by global technology and business analytics companies.',
    items: [
      {
        icon: 'activity',
        title: 'SQL & Database Querying',
        description: 'Master complex queries, joins, window functions, and database schema design for analytics.',
      },
      {
        icon: 'dashboard',
        title: 'Power BI & Tableau',
        description: 'Build executive dashboards, interactive visual reports, DAX calculations, and KPI tracking models.',
      },
      {
        icon: 'python',
        title: 'Python for Data Analytics',
        description: 'Pandas, NumPy, data cleaning, automated pipelines, and statistical modeling.',
      },
      {
        icon: 'excel',
        title: 'Advanced Excel Mastery',
        description: 'Advanced formulas, pivot tables, data modeling, Power Query, and analytical templates.',
      },
      {
        icon: 'bars',
        title: 'Business Analysis Frameworks',
        description: 'Business requirement gathering, agile frameworks, KPI discovery, and stakeholder communication.',
      },
      {
        icon: 'ai',
        title: 'Machine Learning & AI',
        description: 'Supervised and unsupervised learning, predictive modeling, regression, and AI applications.',
      },
    ],
  },
  cta: {
    heading: 'Start Your Journey with Data Knowledge Today',
    description: 'Explore our practical programs, schedule a counseling call, or connect with our mentoring team.',
    primaryButtonText: 'Explore Training Programs',
    primaryButtonLink: '/courses',
    secondaryButtonText: 'Connect with Mentors',
    secondaryButtonLink: '/contact',
  },
};

const aboutUsSchema = new mongoose.Schema(
  {
    hero: {
      badgeText: { ...text, default: DEFAULT_ABOUT_US.hero.badgeText },
      titleLine1: { ...text, default: DEFAULT_ABOUT_US.hero.titleLine1 },
      titleLine2: { ...text, default: DEFAULT_ABOUT_US.hero.titleLine2 },
      description: { ...text, default: DEFAULT_ABOUT_US.hero.description },
      stats: { type: [statSchema], default: () => DEFAULT_ABOUT_US.hero.stats },
    },
    philosophy: {
      badgeText: { ...text, default: DEFAULT_ABOUT_US.philosophy.badgeText },
      headingPrefix: { ...text, default: DEFAULT_ABOUT_US.philosophy.headingPrefix },
      headingHighlightOne: { ...text, default: DEFAULT_ABOUT_US.philosophy.headingHighlightOne },
      headingConnector: { ...text, default: DEFAULT_ABOUT_US.philosophy.headingConnector },
      headingHighlightTwo: { ...text, default: DEFAULT_ABOUT_US.philosophy.headingHighlightTwo },
      paragraphs: { type: [String], default: () => DEFAULT_ABOUT_US.philosophy.paragraphs },
      cardTitle: { ...text, default: DEFAULT_ABOUT_US.philosophy.cardTitle },
      cardSubtitle: { ...text, default: DEFAULT_ABOUT_US.philosophy.cardSubtitle },
      cardImage: { ...text, default: DEFAULT_ABOUT_US.philosophy.cardImage },
      cardImageAlt: { ...text, default: DEFAULT_ABOUT_US.philosophy.cardImageAlt },
      valueBadges: { type: [badgeSchema], default: () => DEFAULT_ABOUT_US.philosophy.valueBadges },
    },
    vision: {
      badgeText: { ...text, default: DEFAULT_ABOUT_US.vision.badgeText },
      heading: { ...text, default: DEFAULT_ABOUT_US.vision.heading },
      quote: { ...text, default: DEFAULT_ABOUT_US.vision.quote },
    },
    pillars: {
      badgeText: { ...text, default: DEFAULT_ABOUT_US.pillars.badgeText },
      heading: { ...text, default: DEFAULT_ABOUT_US.pillars.heading },
      description: { ...text, default: DEFAULT_ABOUT_US.pillars.description },
      items: { type: [pillarSchema], default: () => DEFAULT_ABOUT_US.pillars.items },
    },
    tools: {
      heading: { ...text, default: DEFAULT_ABOUT_US.tools.heading },
      description: { ...text, default: DEFAULT_ABOUT_US.tools.description },
      items: { type: [toolSchema], default: () => DEFAULT_ABOUT_US.tools.items },
    },
    cta: {
      heading: { ...text, default: DEFAULT_ABOUT_US.cta.heading },
      description: { ...text, default: DEFAULT_ABOUT_US.cta.description },
      primaryButtonText: { ...text, default: DEFAULT_ABOUT_US.cta.primaryButtonText },
      primaryButtonLink: { ...text, default: DEFAULT_ABOUT_US.cta.primaryButtonLink },
      secondaryButtonText: { ...text, default: DEFAULT_ABOUT_US.cta.secondaryButtonText },
      secondaryButtonLink: { ...text, default: DEFAULT_ABOUT_US.cta.secondaryButtonLink },
    },
  },
  { _id: false }
);

const aboutSnapshotSchema = new mongoose.Schema(
  {
    badgeText: {
      type: String,
      default: 'About Data Knowledge',
      trim: true,
    },
    headlinePrefix: {
      type: String,
      default: 'Empowering Learners with',
      trim: true,
    },
    headlineHighlight: {
      type: String,
      default: 'Real-World Skills.',
      trim: true,
    },
    paragraph1: {
      type: String,
      default:
        'At Data Knowledge, our mission is to provide practical and industry-focused training in tools like SQL, Excel, Power BI, Tableau, Python, and Business Analysis. Our courses are designed to help learners gain real-world skills that companies actually look for in data analyst and data science roles.',
      trim: true,
    },
    paragraph2: {
      type: String,
      default:
        'The training programs focus on hands-on learning, real-time projects, and step-by-step guidance so that students can confidently work on real business problems. Whether you are a beginner starting your data analytics journey or a working professional looking to upgrade your skills, our courses are structured to support your career growth.',
      trim: true,
    },
    bulletPoints: {
      type: [String],
      default: [
        'Hands-on training in SQL, Excel, Power BI, Tableau, Python & Business Analysis',
        'Learn from real industry experts with experience in Data Analytics, ML & AI',
        'Job-ready preparation with resume building, mock interviews & real-time projects',
        'Continuous project support, code reviews & personalized career mentorship',
      ],
    },
    primaryButtonText: {
      type: String,
      default: 'Discover More About Us',
      trim: true,
    },
    primaryButtonLink: {
      type: String,
      default: '/about-us',
      trim: true,
    },
    showPrimaryButton: {
      type: Boolean,
      default: true,
    },
    secondaryButtonText: {
      type: String,
      default: 'Explore Courses',
      trim: true,
    },
    secondaryButtonLink: {
      type: String,
      default: '/courses',
      trim: true,
    },
    showSecondaryButton: {
      type: Boolean,
      default: true,
    },
    image: {
      type: String,
      default: '/hero_section.png',
      trim: true,
    },
    imageAlt: {
      type: String,
      default: 'Data Knowledge Practical Learning',
      trim: true,
    },
    aboutUs: {
      type: aboutUsSchema,
      default: () => ({}),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const AboutSnapshot =
  mongoose.models.AboutSnapshot || mongoose.model('AboutSnapshot', aboutSnapshotSchema);
export default AboutSnapshot;
