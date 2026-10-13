import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosConfig";

export interface AboutStat {
  value: string;
  label: string;
}

export interface AboutBadge {
  title: string;
  description: string;
}

export interface AboutPillar {
  icon: string;
  badge: string;
  title: string;
  description: string;
}

export interface AboutTool {
  icon: string;
  title: string;
  description: string;
}

export interface AboutUsData {
  hero: {
    badgeText: string;
    titleLine1: string;
    titleLine2: string;
    description: string;
    stats: AboutStat[];
  };
  philosophy: {
    badgeText: string;
    headingPrefix: string;
    headingHighlightOne: string;
    headingConnector: string;
    headingHighlightTwo: string;
    paragraphs: string[];
    cardTitle: string;
    cardSubtitle: string;
    cardImage: string;
    cardImageAlt: string;
    valueBadges: AboutBadge[];
  };
  vision: {
    badgeText: string;
    heading: string;
    quote: string;
  };
  pillars: {
    badgeText: string;
    heading: string;
    description: string;
    items: AboutPillar[];
  };
  tools: {
    heading: string;
    description: string;
    items: AboutTool[];
  };
  cta: {
    heading: string;
    description: string;
    primaryButtonText: string;
    primaryButtonLink: string;
    secondaryButtonText: string;
    secondaryButtonLink: string;
  };
}

export interface AboutSnapshotData {
  _id?: string;
  badgeText: string;
  headlinePrefix: string;
  headlineHighlight: string;
  paragraph1: string;
  paragraph2: string;
  bulletPoints: string[];
  primaryButtonText: string;
  primaryButtonLink: string;
  showPrimaryButton: boolean;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  showSecondaryButton: boolean;
  image: string;
  imageAlt: string;
  aboutUs: AboutUsData;
  isActive: boolean;
  updatedAt?: string;
}

export interface AboutSnapshotState {
  aboutSnapshot: AboutSnapshotData;
  loading: boolean;
  saving: boolean;
  error: string | null;
  successMessage: string | null;
}

export const DEFAULT_ABOUT_US: AboutUsData = {
  hero: {
    badgeText: "Practical & Industry-Focused Hub",
    titleLine1: "About Data Knowledge",
    titleLine2: "Real Skills for Real-World Data Careers",
    description:
      "At Data Knowledge, our mission is to provide practical and industry-focused training in tools like SQL, Excel, Power BI, Tableau, Python, and Business Analysis. Our courses are designed to help learners gain real-world skills that companies actually look for in data analyst and data science roles.",
    stats: [
      { value: "100%", label: "Practical Training" },
      { value: "Real-Time", label: "Industry Projects" },
      { value: "Job-Ready", label: "Mock Interviews & Resume" },
      { value: "Mentors", label: "Industry Analytics Experts" },
    ],
  },
  philosophy: {
    badgeText: "Our Core Philosophy",
    headingPrefix: "Bridging the gap between",
    headingHighlightOne: "learning tools",
    headingConnector: "and",
    headingHighlightTwo: "solving business problems",
    paragraphs: [
      "The training programs focus on hands-on learning, real-time projects, and step-by-step guidance so that students can confidently work on real business problems. Whether you are a beginner starting your data analytics journey or a working professional looking to upgrade your skills, our courses are structured to support your career growth.",
      "Our mentors bring real industry experience across data engineering, business intelligence, ML modeling, and enterprise reporting, giving you the edge you need during technical hiring rounds.",
      "From building complex SQL queries and Python pipelines to presenting storytelling dashboards in Power BI and Tableau, we prepare you for every stage of modern analytics roles.",
    ],
    cardTitle: "Data Knowledge",
    cardSubtitle: "Practical & Industry-Focused Training",
    cardImage: "/data_knowlege/logo/logo.png",
    cardImageAlt: "Data Knowledge Logo",
    valueBadges: [
      {
        title: "Learn From Real Industry Experts",
        description: "Real business scenarios, best practices, and industry workflows.",
      },
      {
        title: "Designed to Make You Job Ready",
        description: "Resume optimization, mock interviews, and portfolio projects.",
      },
      {
        title: "Data Science, ML & AI",
        description: "Hands-on algorithms, predictive models, and modern AI tools.",
      },
    ],
  },
  vision: {
    badgeText: "Our Commitment",
    heading: "Our Vision & Mission",
    quote:
      "At Data Knowledge, our mission is to provide practical and industry-focused training in tools like SQL, Excel, Power BI, Tableau, Python, and Business Analysis. Our courses are designed to help learners gain real-world skills that companies actually look for in data analyst and data science roles, supporting every student with hands-on learning, continuous project support, and mock interview preparation.",
  },
  pillars: {
    badgeText: "Core Learning Tracks",
    heading: "How We Train",
    description:
      "Every module is tailored to build practical competence, enabling you to step into data analyst, business analyst, and data science interviews with confidence:",
    items: [
      {
        icon: "trending",
        badge: "Core Tools",
        title: "Practical & Industry-Focused Curriculum",
        description:
          "Our training is engineered around real-world tools that employers look for: SQL, Advanced Excel, Power BI, Tableau, Python, and Business Analysis frameworks.",
      },
      {
        icon: "users",
        badge: "Expert Mentors",
        title: "Trained by Real Industry Experts",
        description:
          "Get trained by seasoned professionals with active industry experience in Data Analytics, Business Analysis, Machine Learning, Data Science, and AI.",
      },
      {
        icon: "monitor",
        badge: "Hands-on Projects",
        title: "Real-Time Project Problem Solving",
        description:
          "Work on hands-on datasets, industry-level case studies, and business scenarios that empower you to confidently work on real business challenges.",
      },
      {
        icon: "globe",
        badge: "Next-Gen AI",
        title: "Data Science, ML & Artificial Intelligence",
        description:
          "Comprehensive modules spanning predictive modeling, machine learning algorithms, deep learning fundamentals, and modern generative AI tools.",
      },
      {
        icon: "star",
        badge: "Job Readiness",
        title: "Resume Building & Mock Interviews",
        description:
          "Structured career prep including profile building, LinkedIn optimization, mock interviews, and scenario-based technical questions to crack hiring rounds.",
      },
      {
        icon: "bars",
        badge: "Interactive Mentorship",
        title: "Continuous Support & Live Classes",
        description:
          "Access our live classroom ecosystem at classes.dataknowledge.in with continuous doubt clearance, 1-on-1 mentorship, and step-by-step guidance.",
      },
    ],
  },
  tools: {
    heading: "Master In-Demand Industry Tools",
    description:
      "Hands-on mastery over the top toolsets demanded by global technology and business analytics companies.",
    items: [
      {
        icon: "activity",
        title: "SQL & Database Querying",
        description: "Master complex queries, joins, window functions, and database schema design for analytics.",
      },
      {
        icon: "dashboard",
        title: "Power BI & Tableau",
        description: "Build executive dashboards, interactive visual reports, DAX calculations, and KPI tracking models.",
      },
      {
        icon: "python",
        title: "Python for Data Analytics",
        description: "Pandas, NumPy, data cleaning, automated pipelines, and statistical modeling.",
      },
      {
        icon: "excel",
        title: "Advanced Excel Mastery",
        description: "Advanced formulas, pivot tables, data modeling, Power Query, and analytical templates.",
      },
      {
        icon: "bars",
        title: "Business Analysis Frameworks",
        description: "Business requirement gathering, agile frameworks, KPI discovery, and stakeholder communication.",
      },
      {
        icon: "ai",
        title: "Machine Learning & AI",
        description: "Supervised and unsupervised learning, predictive modeling, regression, and AI applications.",
      },
    ],
  },
  cta: {
    heading: "Start Your Journey with Data Knowledge Today",
    description: "Explore our practical programs, schedule a counseling call, or connect with our mentoring team.",
    primaryButtonText: "Explore Training Programs",
    primaryButtonLink: "/courses",
    secondaryButtonText: "Connect with Mentors",
    secondaryButtonLink: "/contact",
  },
};

const DEFAULT_ABOUT_SNAPSHOT_STATE: AboutSnapshotData = {
  badgeText: "About Data Knowledge",
  headlinePrefix: "Empowering Learners with",
  headlineHighlight: "Real-World Skills.",
  paragraph1:
    "At Data Knowledge, our mission is to provide practical and industry-focused training in tools like SQL, Excel, Power BI, Tableau, Python, and Business Analysis. Our courses are designed to help learners gain real-world skills that companies actually look for in data analyst and data science roles.",
  paragraph2:
    "The training programs focus on hands-on learning, real-time projects, and step-by-step guidance so that students can confidently work on real business problems. Whether you are a beginner starting your data analytics journey or a working professional looking to upgrade your skills, our courses are structured to support your career growth.",
  bulletPoints: [
    "Hands-on training in SQL, Excel, Power BI, Tableau, Python & Business Analysis",
    "Learn from real industry experts with experience in Data Analytics, ML & AI",
    "Job-ready preparation with resume building, mock interviews & real-time projects",
    "Continuous project support, code reviews & personalized career mentorship",
  ],
  primaryButtonText: "Discover More About Us",
  primaryButtonLink: "/about-us",
  showPrimaryButton: true,
  secondaryButtonText: "Explore Courses",
  secondaryButtonLink: "/courses",
  showSecondaryButton: true,
  image: "/hero_section.png",
  imageAlt: "Data Knowledge Practical Learning",
  aboutUs: DEFAULT_ABOUT_US,
  isActive: true,
};

const mergeAboutUs = (incoming?: Partial<AboutUsData>): AboutUsData => {
  const src: Partial<AboutUsData> = incoming && typeof incoming === "object" ? incoming : {};
  const b = DEFAULT_ABOUT_US;
  return {
    hero: { ...b.hero, ...(src.hero || {}), stats: src.hero?.stats?.length ? src.hero.stats : b.hero.stats },
    philosophy: {
      ...b.philosophy,
      ...(src.philosophy || {}),
      paragraphs: src.philosophy?.paragraphs?.length ? src.philosophy.paragraphs : b.philosophy.paragraphs,
      valueBadges: src.philosophy?.valueBadges?.length ? src.philosophy.valueBadges : b.philosophy.valueBadges,
    },
    vision: { ...b.vision, ...(src.vision || {}) },
    pillars: {
      ...b.pillars,
      ...(src.pillars || {}),
      items: src.pillars?.items?.length ? src.pillars.items : b.pillars.items,
    },
    tools: {
      ...b.tools,
      ...(src.tools || {}),
      items: src.tools?.items?.length ? src.tools.items : b.tools.items,
    },
    cta: { ...b.cta, ...(src.cta || {}) },
  };
};

const normalizeSnapshot = (payload?: Partial<AboutSnapshotData> | null): AboutSnapshotData => {
  const data = payload || {};
  const merged: AboutSnapshotData = {
    ...DEFAULT_ABOUT_SNAPSHOT_STATE,
    ...data,
    bulletPoints: data.bulletPoints?.length
      ? data.bulletPoints
      : DEFAULT_ABOUT_SNAPSHOT_STATE.bulletPoints,
  };
  merged.aboutUs = mergeAboutUs(data.aboutUs);
  return merged;
};

const initialState: AboutSnapshotState = {
  aboutSnapshot: DEFAULT_ABOUT_SNAPSHOT_STATE,
  loading: false,
  saving: false,
  error: null,
  successMessage: null,
};

// FETCH (ADMIN)
export const fetchAboutSnapshotAdmin = createAsyncThunk(
  "aboutSnapshot/fetchAboutSnapshotAdmin",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/about-snapshot/admin");
      return res.data?.data?.aboutSnapshot || DEFAULT_ABOUT_SNAPSHOT_STATE;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// UPDATE (ADMIN)
export const updateAboutSnapshotAdmin = createAsyncThunk(
  "aboutSnapshot/updateAboutSnapshotAdmin",
  async (data: Partial<AboutSnapshotData>, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put("/about-snapshot", data);
      return res.data?.data?.aboutSnapshot;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const aboutSnapshotSlice = createSlice({
  name: "aboutSnapshot",
  initialState,
  reducers: {
    clearAboutSnapshotMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAboutSnapshotAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAboutSnapshotAdmin.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.aboutSnapshot = normalizeSnapshot(action.payload);
        }
      })
      .addCase(fetchAboutSnapshotAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateAboutSnapshotAdmin.pending, (state) => {
        state.saving = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateAboutSnapshotAdmin.fulfilled, (state, action) => {
        state.saving = false;
        if (action.payload) {
          state.aboutSnapshot = normalizeSnapshot(action.payload);
        }
        state.successMessage = "About section updated successfully!";
      })
      .addCase(updateAboutSnapshotAdmin.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearAboutSnapshotMessages } = aboutSnapshotSlice.actions;
export default aboutSnapshotSlice.reducer;
