import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  MessageCircle,
  Instagram,
  Trophy,
  Layers,
  Sparkles,
  BookOpen,
  Users,
  Tag,
  Calendar,
  Briefcase,
  HelpCircle,
  FileCheck,
  TrendingUp,
  Image as ImageIcon,
  MessageSquare,
  FileText,
  ShieldCheck,
  Award,
  PlusCircle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export interface SearchItem {
  id: string;
  title: string;
  category: "Pages" | "Quick Actions" | "Content & Media" | "Learning & Support";
  path: string;
  description: string;
  keywords: string[];
  icon: React.ReactNode;
  badge?: string;
}

const SEARCH_ITEMS: SearchItem[] = [
  // Content & Media
  {
    id: "testimonials",
    title: "Testimonials",
    category: "Content & Media",
    path: "/testimonials",
    description: "Manage student testimonials, ratings and review proof screenshots",
    keywords: ["testimonial", "testimonials", "review", "reviews", "proof", "screenshot", "screenshots", "rating", "feedback"],
    icon: <MessageCircle className="w-4 h-4 text-emerald-500" />,
    badge: "Reviews",
  },
  {
    id: "placement-stories",
    title: "Placement Stories",
    category: "Content & Media",
    path: "/placement-stories",
    description: "Instagram reels, alumni placement stories and selection badges",
    keywords: ["placement", "story", "stories", "reel", "reels", "instagram", "video", "alumni", "hiring"],
    icon: <Instagram className="w-4 h-4 text-pink-500" />,
    badge: "Instagram",
  },
  {
    id: "proven-results",
    title: "Proven Results",
    category: "Content & Media",
    path: "/proven-results",
    description: "Salary hike stats, top company packages and hiring metrics",
    keywords: ["proven", "results", "package", "salary", "hike", "ctc", "placement", "stats"],
    icon: <Trophy className="w-4 h-4 text-amber-500" />,
    badge: "Stats",
  },
  {
    id: "programs-offer",
    title: "Programs We Offer",
    category: "Content & Media",
    path: "/programs-offer",
    description: "Landing page flagship tracks, duration, and program highlights",
    keywords: ["program", "programs", "offer", "curriculum", "syllabus", "tracks"],
    icon: <Layers className="w-4 h-4 text-blue-500" />,
    badge: "Programs",
  },
  {
    id: "hero-section",
    title: "Hero Section",
    category: "Content & Media",
    path: "/hero-section",
    description: "Landing page hero headline, subtext, badges and key statistics",
    keywords: ["hero", "banner", "headline", "landing", "stats", "header", "home"],
    icon: <Sparkles className="w-4 h-4 text-purple-500" />,
    badge: "Landing",
  },
  {
    id: "banners",
    title: "Promotional Banners",
    category: "Content & Media",
    path: "/banner",
    description: "Marketing announcement banners and alert strips",
    keywords: ["banner", "banners", "announcement", "promo", "alert"],
    icon: <ImageIcon className="w-4 h-4 text-sky-500" />,
  },
  {
    id: "news",
    title: "Blogs",
    category: "Content & Media",
    path: "/blogs",
    description: "Industry updates, company announcements and blog articles",
    keywords: ["blogs", "blog", "articles", "news", "press", "announcements"],
    icon: <FileText className="w-4 h-4 text-indigo-500" />,
  },

  // Pages & Core Management
  {
    id: "dashboard",
    title: "Dashboard Overview",
    category: "Pages",
    path: "/",
    description: "Platform summary, key performance indicators and analytics",
    keywords: ["dashboard", "home", "analytics", "overview", "metrics", "kpi", "stats"],
    icon: <TrendingUp className="w-4 h-4 text-blue-600" />,
    badge: "Main",
  },
  {
    id: "courses",
    title: "All Courses",
    category: "Pages",
    path: "/courses/all/courses",
    description: "Explore, edit and manage data analytics and BI courses",
    keywords: ["course", "courses", "class", "classes", "data", "analytics", "sql", "power bi", "python"],
    icon: <BookOpen className="w-4 h-4 text-emerald-600" />,
  },
  {
    id: "categories",
    title: "Course Categories",
    category: "Pages",
    path: "/categories",
    description: "Technical learning tracks and course categories",
    keywords: ["category", "categories", "track", "tracks", "subject"],
    icon: <Layers className="w-4 h-4 text-teal-600" />,
  },
  {
    id: "students",
    title: "Students Directory",
    category: "Pages",
    path: "/students/all",
    description: "Registered learners, enrollment history and contact details",
    keywords: ["student", "students", "user", "users", "learner", "learners", "enrolled"],
    icon: <Users className="w-4 h-4 text-blue-500" />,
  },
  {
    id: "delete-requests",
    title: "Delete Account Requests",
    category: "Pages",
    path: "/student/delete-requests",
    description: "GDPR compliance and student deletion requests",
    keywords: ["delete", "requests", "gdpr", "remove", "account"],
    icon: <ShieldCheck className="w-4 h-4 text-rose-500" />,
  },
  {
    id: "coupons",
    title: "Discount Coupons",
    category: "Pages",
    path: "/coupons/all",
    description: "Manage promo discount codes, expiration dates and limits",
    keywords: ["coupon", "coupons", "discount", "promo", "voucher", "code", "offer"],
    icon: <Tag className="w-4 h-4 text-amber-600" />,
  },
  {
    id: "events",
    title: "Events & Webinars",
    category: "Pages",
    path: "/events",
    description: "Live workshops, masterclasses and schedules",
    keywords: ["event", "events", "webinar", "webinars", "workshop", "masterclass"],
    icon: <Calendar className="w-4 h-4 text-cyan-600" />,
  },
  {
    id: "jobs",
    title: "Jobs & Referrals",
    category: "Pages",
    path: "/jobs",
    description: "Partner hiring vacancies, openings and placement opportunities",
    keywords: ["job", "jobs", "hiring", "vacancy", "career", "referral", "opening"],
    icon: <Briefcase className="w-4 h-4 text-orange-500" />,
  },
  {
    id: "analytics-user",
    title: "Sales & Enrollment Analytics",
    category: "Pages",
    path: "/analytics/user",
    description: "Revenue charts, enrollment trends and acquisition sources",
    keywords: ["sales", "analytics", "revenue", "enrollments", "user", "report"],
    icon: <TrendingUp className="w-4 h-4 text-violet-500" />,
  },

  // Learning & Support
  {
    id: "assignments",
    title: "Assignment Submissions",
    category: "Learning & Support",
    path: "/assignments/submissions",
    description: "Review submitted student projects and grading status",
    keywords: ["assignment", "assignments", "submission", "homework", "task", "grade"],
    icon: <FileCheck className="w-4 h-4 text-emerald-500" />,
  },
  {
    id: "queries",
    title: "Student Queries & Doubts",
    category: "Learning & Support",
    path: "/queries/all",
    description: "Answer doubt tickets and student questions",
    keywords: ["query", "queries", "doubt", "question", "ask", "help"],
    icon: <HelpCircle className="w-4 h-4 text-amber-500" />,
  },
  {
    id: "support-requests",
    title: "Help Desk Support",
    category: "Learning & Support",
    path: "/requests",
    description: "Customer service tickets, complaints and issue resolution",
    keywords: ["support", "help", "ticket", "tickets", "desk", "service"],
    icon: <HelpCircle className="w-4 h-4 text-rose-500" />,
  },
  {
    id: "consultations",
    title: "1-on-1 Consultations",
    category: "Learning & Support",
    path: "/consultations/bookings",
    description: "Career mentorship bookings and calendar slots",
    keywords: ["consultation", "consultations", "booking", "mentor", "slot", "call"],
    icon: <Calendar className="w-4 h-4 text-blue-500" />,
  },
  {
    id: "chat",
    title: "Live Chat",
    category: "Learning & Support",
    path: "/chat",
    description: "Instant messaging channel with active learners",
    keywords: ["chat", "message", "conversation", "talk"],
    icon: <MessageSquare className="w-4 h-4 text-teal-500" />,
  },
  {
    id: "forums",
    title: "Community Forums",
    category: "Learning & Support",
    path: "/forum",
    description: "Community discussion threads and student peer learning",
    keywords: ["forum", "forums", "discussion", "community", "threads"],
    icon: <MessageCircle className="w-4 h-4 text-indigo-500" />,
  },
  {
    id: "certifications",
    title: "Certificates",
    category: "Learning & Support",
    path: "/certification/list",
    description: "Issued course completion certificates and templates",
    keywords: ["certificate", "certificates", "certification", "award", "verify"],
    icon: <Award className="w-4 h-4 text-amber-500" />,
  },

  // Quick Actions
  {
    id: "action-add-course",
    title: "Create New Course",
    category: "Quick Actions",
    path: "/courses/create-course",
    description: "Set up a new curriculum, lessons and pricing",
    keywords: ["add", "create", "new", "course"],
    icon: <PlusCircle className="w-4 h-4 text-emerald-600" />,
    badge: "Action",
  },
  {
    id: "action-add-testimonial",
    title: "Add Testimonial",
    category: "Quick Actions",
    path: "/testimonials",
    description: "Upload student review feedback, chat proofs and rating",
    keywords: ["add", "new", "testimonial", "review", "upload", "proof"],
    icon: <PlusCircle className="w-4 h-4 text-blue-600" />,
    badge: "Action",
  },
  {
    id: "action-create-coupon",
    title: "Create Promo Coupon",
    category: "Quick Actions",
    path: "/coupons/create",
    description: "Launch a new discount code campaign",
    keywords: ["create", "add", "coupon", "discount", "code"],
    icon: <PlusCircle className="w-4 h-4 text-amber-600" />,
    badge: "Action",
  },
];

export const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMac, setIsMac] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setIsMac(typeof navigator !== "undefined" && /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent));
  }, []);

  // Global shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter items based on query
  const filteredResults = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      // Suggest high-priority items when query is empty
      return SEARCH_ITEMS.slice(0, 7);
    }

    return SEARCH_ITEMS.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(trimmed);
      const matchDesc = item.description.toLowerCase().includes(trimmed);
      const matchCategory = item.category.toLowerCase().includes(trimmed);
      const matchKeywords = item.keywords.some((k) => k.toLowerCase().includes(trimmed));
      return matchTitle || matchDesc || matchCategory || matchKeywords;
    });
  }, [query]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredResults]);

  const handleSelect = (item: SearchItem) => {
    navigate(item.path);
    setIsOpen(false);
    setQuery("");
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredResults.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % Math.max(1, filteredResults.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelect(filteredResults[selectedIndex]);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl">
      {/* Search Input Box */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-200 text-gray-400 group-focus-within:text-blue-500">
          <Search className="w-4 h-4" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search pages, sections, actions..."
          className="w-full h-10 sm:h-11 pl-10 pr-20 text-xs sm:text-sm rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-gray-100/60 focus:bg-white text-gray-900 placeholder:text-gray-400 shadow-xs focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-gray-800 dark:bg-gray-800/60 dark:hover:bg-gray-800 dark:focus:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 transition-all duration-200"
        />

        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1.5">
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-2xs pointer-events-none select-none">
              <span>{isMac ? "⌘" : "Ctrl"}</span>
              <span>K</span>
            </kbd>
          )}
        </div>
      </div>

      {/* Dropdown Results Box */}
      {isOpen && (
        <div
          ref={resultsRef}
          className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/90 dark:border-gray-800 overflow-hidden z-[99999] animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl"
        >
          {/* Header indicator */}
          <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-400 font-medium bg-gray-50/50 dark:bg-gray-800/30">
            <span>
              {query.trim()
                ? `Search results (${filteredResults.length})`
                : "Suggested pages & quick tools"}
            </span>
            <span className="hidden sm:inline text-[10px]">
              Use <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[9px]">↑</kbd>{" "}
              <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[9px]">↓</kbd> to navigate,{" "}
              <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[9px]">↵</kbd> to open
            </span>
          </div>

          {/* Results List */}
          <div className="max-h-[380px] overflow-y-auto p-2 space-y-1 divide-y divide-gray-50 dark:divide-gray-800/40">
            {filteredResults.length > 0 ? (
              filteredResults.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? "bg-blue-50/90 dark:bg-blue-900/25 text-blue-900 dark:text-blue-100 shadow-xs"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-2xs ${
                          isSelected
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 group-hover:bg-blue-100 group-hover:text-blue-600 dark:group-hover:bg-blue-900/40 dark:group-hover:text-blue-400"
                        }`}
                      >
                        {item.icon}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-xs sm:text-sm font-semibold truncate ${
                              isSelected
                                ? "text-blue-700 dark:text-blue-300"
                                : "text-gray-900 dark:text-gray-100"
                            }`}
                          >
                            {item.title}
                          </h4>
                          {item.badge && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 shrink-0">
                              {item.badge}
                            </span>
                          )}
                          <span className="text-[10px] text-gray-400 font-medium shrink-0 hidden md:inline">
                            • {item.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center pl-2 shrink-0">
                      <ArrowRight
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isSelected
                            ? "translate-x-0.5 text-blue-600 dark:text-blue-400 opacity-100"
                            : "opacity-0 group-hover:opacity-60 text-gray-400"
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-5 h-5" />
                </div>
                <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  No matching results found
                </h5>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs mx-auto">
                  Try searching with different terms like "Testimonials", "Courses", "Placement", or "Students".
                </p>
              </div>
            )}
          </div>

          {/* Quick Footer */}
          <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex items-center justify-between text-[11px] text-gray-400">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Quick Command Search
            </span>
            <span className="text-[10px] text-gray-400">
              Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[9px]">Esc</kbd> to close
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
