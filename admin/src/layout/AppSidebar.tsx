import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Link, useLocation } from "react-router";
import { useSidebar } from "../context/SidebarContext";

// Assume these icons are imported from an icon library
import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PieChartIcon,
  TableIcon,
  UserCircleIcon,
  VideoIcon,
} from "../icons";
import { Tag, UserCircle2Icon, Bell, MessageCircle, Bot, Instagram, Trophy, Layers, Sparkles, Search, X, CheckSquare, ShieldCheck, Mail, Receipt, Database } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import { getAllQueries } from "../store/slices/query";
import { fetchContactRequests } from "../store/slices/contactSlice";
import { fetchAssignmentSubmissions } from "../store/slices/assignment";
import { fetchSupportTickets } from "../store/slices/support";

type NavSubItem = {
  name: string;
  path: string;
  pro?: boolean;
  new?: boolean;
  subItems?: NavSubItem[];
  keywords?: string[];
};

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: NavSubItem[];
  keywords?: string[];
  superAdminOnly?: boolean;
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/",
    keywords: ["home", "analytics", "overview", "metrics", "stats"],
  },
  {
    icon: <ListIcon />,
    name: "Courses",
    path: "/courses/all/courses",
    keywords: ["class", "classes", "lessons", "curriculum", "python", "sql", "power bi"],
  },
  {
    icon: <BoxCubeIcon />,
    name: "Categories",
    path: "/categories",
    keywords: ["tracks", "subjects"],
  },
  // {
  //   icon: <PageIcon />,
  //   name: "Banner",
  //   path: "/banner",
  //   keywords: ["announcement", "promo", "alert"],
  // },
  {
    icon: <CalenderIcon />,
    name: "Events",
    path: "/events",
    keywords: ["webinar", "webinars", "workshop", "masterclass"],
  },
  // {
  //   icon: <UserCircleIcon />,
  //   name: "Jobs",
  //   path: "/jobs",
  //   keywords: ["hiring", "careers", "vacancies", "referral"],
  // },
  {
    icon: <PageIcon />,
    name: "Blogs",
    path: "/blogs",
    keywords: ["blogs", "blog", "articles", "press", "news"],
  },
  {
    icon: <PageIcon />,
    name: "Forums",
    path: "/forum",
    keywords: ["community", "discussion", "threads"],
  },
  {
    icon: <UserCircleIcon />,
    name: "Students",
    path: "/students/all",
    keywords: ["users", "learners", "enrolled"],
  },
  // {
  //   icon: <UserCircleIcon />,
  //   name: "Add Reporter",
  //   path: "/reporters/add",
  //   keywords: ["reporter", "journalist", "author"],
  // },
  {
    icon: <TableIcon />,
    name: "Assignment Submissions",
    path: "/assignments/submissions",
    keywords: ["homework", "tasks", "projects", "grades"],
  },
  {
    icon: <UserCircle2Icon />,
    name: "Student Queries",
    path: "/queries/all",
    keywords: ["doubts", "questions", "ask", "help"],
  },
  {
    icon: <TableIcon />,
    name: "Support Requests",
    path: "/requests",
    keywords: ["helpdesk", "tickets", "issues"],
  },
  {
    icon: <Mail className="w-5 h-5" />,
    name: "Contact Page",
    path: "/contact-management",
    keywords: ["contact", "inquiries", "requests", "support", "form", "messages", "leads"],
  },
  {
    icon: <CalenderIcon />,
    name: "Consultations",
    subItems: [
      { name: "Manage Slots", path: "/consultations/slots" },
      { name: "Bookings", path: "/consultations/bookings" },
    ],
    keywords: ["mentorship", "bookings", "slots", "guidance"],
  },
  {
    icon: <MessageCircle />,
    name: "Chat",
    path: "/chat",
    keywords: ["messages", "inbox", "conversation"],
  },
  {
    icon: <Tag />,
    name: "Coupons",
    path: "/coupons/all",
    keywords: ["discount", "discounts", "promo", "voucher", "code"],
  },
  {
    icon: <TableIcon />,
    name: "Device Approvals",
    path: "/device-approvals",
    keywords: ["security", "logins", "devices"],
  },
  {
    icon: <MessageCircle />,
    name: "Testimonials",
    path: "/testimonials",
    keywords: ["reviews", "review", "proof", "screenshot", "screenshots", "rating", "feedback"],
  },
  {
    icon: <UserCircleIcon />,
    name: "Mentors",
    path: "/mentors",
    keywords: ["instructors", "teachers", "mentors", "experts"],
  },
  {
    icon: <Instagram />,
    name: "Placement Stories",
    path: "/placement-stories",
    keywords: ["reels", "reel", "stories", "story", "instagram", "video", "alumni", "hiring"],
  },
  {
    icon: <Trophy className="w-5 h-5" />,
    name: "Proven Results",
    path: "/proven-results",
    keywords: ["salary", "package", "hike", "packages", "ctc", "records"],
  },
  {
    icon: <Layers className="w-5 h-5" />,
    name: "Programs We Offer",
    path: "/programs-offer",
    keywords: ["programs", "program", "tracks", "curriculum", "syllabus"],
  },
  {
    icon: <Sparkles className="w-5 h-5" />,
    name: "Hero Section",
    path: "/hero-section",
    keywords: ["hero", "headline", "title", "banner", "landing", "home"],
  },
  {
    icon: <CheckSquare className="w-5 h-5" />,
    name: "Why Choose Us",
    path: "/why-choose-us",
    keywords: ["why", "choose", "us", "features", "benefits", "reasons"],
  },
  {
    icon: <GridIcon />,
    name: "About Us Page",
    path: "/about-snapshot",
    keywords: ["about", "us", "snapshot", "data", "knowledge", "company", "page"],
  },
  {
    icon: <PieChartIcon />,
    name: "Leaderboard Settings",
    path: "/leaderboard-setting",
  },
  {
    icon: <Receipt className="w-5 h-5" />,
    name: "GST & Payment Charges",
    path: "/settings/tax-payment",
    keywords: ["gst", "tax", "payment", "gateway", "charges", "fees", "inclusive", "exclusive"],
  },
  {
    icon: <PageIcon />,
    name: "Security",
    subItems: [
      { name: "Incidents", path: "/security/incidents" },
    ],
  },
  {
    icon: <TableIcon />,
    name: "Sales Analytics",
    subItems: [
      { name: "User", path: "/sales/user" },
      { name: "Course", path: "/sales/course" },
      { name: "Bundle", path: "/sales/bundle" },
    ],
    keywords: ["revenue", "sales", "analytics", "reports"],
  },
  {
    icon: <Bell />,
    name: "Notifications",
    subItems: [
      { name: "Send Notifications", path: "/send-notification" },
      { name: "Notification History", path: "/notification-history" },
    ],
  },
  {
    icon: <PieChartIcon />,
    name: "Certifications",
    subItems: [
      {
        name: "All Templates",
        path: "/certificates-template/all",
      },
      { name: "Add Template", path: "/certificates-template/add" },
    ],
  },
  {
    icon: <VideoIcon />,
    name: "Live Classes",
    path: "/live-classes",
    keywords: ["zoom", "live", "meetings", "class"],
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    name: "Admin Management",
    path: "/admin-users",
    keywords: ["admins", "admin", "roles", "permissions", "rbac", "super", "access", "users"],
    superAdminOnly: true,
  },
  {
    icon: <Database className="w-5 h-5" />,
    name: "Redis Management",
    path: "/settings/redis",
    keywords: ["redis", "cache", "server", "connectivity", "performance", "keys", "flush"],
    superAdminOnly: true,
  },
];

const othersItems: NavItem[] = [];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  const [userRole] = useState<string | null>(() => {
    try {
      let role = localStorage.getItem("role");
      if (!role) {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          try {
            const parsed = JSON.parse(userStr);
            role = parsed?.role;
          } catch (e) {}
        }
      }
      return role ? String(role).trim() : null;
    } catch (e) {
      return null;
    }
  });

  const [openSubmenu, setOpenSubmenu] = useState<string[]>([]);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [sidebarSearch, setSidebarSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const dispatch = useAppDispatch();
  const queries = useAppSelector((state) => state.query.queries);
  const contactRequests = useAppSelector((state) => state.contact?.requests);
  const contactSummary = useAppSelector((state) => state.contact?.summary);
  const assignmentSubmissions = useAppSelector((state) => state.assignment?.submissions);
  const supportTickets = useAppSelector((state) => state.support?.tickets);

  const [lastViewedQueriesAt, setLastViewedQueriesAt] = useState<string | null>(() => {
    return typeof window !== "undefined"
      ? localStorage.getItem("admin_queries_last_viewed_at")
      : null;
  });

  const [lastViewedContactAt, setLastViewedContactAt] = useState<string | null>(() => {
    return typeof window !== "undefined"
      ? localStorage.getItem("admin_contact_last_viewed_at")
      : null;
  });

  const [lastViewedAssignmentsAt, setLastViewedAssignmentsAt] = useState<string | null>(() => {
    return typeof window !== "undefined"
      ? localStorage.getItem("admin_assignments_last_viewed_at")
      : null;
  });

  const [lastViewedTicketsAt, setLastViewedTicketsAt] = useState<string | null>(() => {
    return typeof window !== "undefined"
      ? localStorage.getItem("admin_tickets_last_viewed_at")
      : null;
  });

  // Track visits across browser tab closures so old seen notifications do NOT reappear
  useEffect(() => {
    if (typeof window === "undefined") return;

    const sessionKey = "admin_active_tab_session";
    const lastSessionCloseKey = "admin_panel_last_visited_at";
    const isNewTabSession = !sessionStorage.getItem(sessionKey);

    const now = new Date().toISOString();
    const lastVisitedAt = localStorage.getItem(lastSessionCloseKey);

    if (isNewTabSession) {
      // User closed the browser tab and visited the admin panel again!
      sessionStorage.setItem(sessionKey, "active");

      // The baseline timestamp for seen notifications:
      // If we have a recorded previous visit time, use that; otherwise use 'now'
      // so historical notifications (before this visit) do NOT show as unread.
      const baselineTime = lastVisitedAt || now;

      // Update queries last viewed if not set or older than previous visit
      const storedQueriesViewed = localStorage.getItem("admin_queries_last_viewed_at");
      if (!storedQueriesViewed || new Date(storedQueriesViewed).getTime() < new Date(baselineTime).getTime()) {
        localStorage.setItem("admin_queries_last_viewed_at", baselineTime);
        setLastViewedQueriesAt(baselineTime);
      }

      // Update contact last viewed if not set or older than previous visit
      const storedContactViewed = localStorage.getItem("admin_contact_last_viewed_at");
      if (!storedContactViewed || new Date(storedContactViewed).getTime() < new Date(baselineTime).getTime()) {
        localStorage.setItem("admin_contact_last_viewed_at", baselineTime);
        setLastViewedContactAt(baselineTime);
      }

      // Update assignments last viewed
      const storedAssignmentsViewed = localStorage.getItem("admin_assignments_last_viewed_at");
      if (!storedAssignmentsViewed || new Date(storedAssignmentsViewed).getTime() < new Date(baselineTime).getTime()) {
        localStorage.setItem("admin_assignments_last_viewed_at", baselineTime);
        setLastViewedAssignmentsAt(baselineTime);
      }

      // Update tickets last viewed
      const storedTicketsViewed = localStorage.getItem("admin_tickets_last_viewed_at");
      if (!storedTicketsViewed || new Date(storedTicketsViewed).getTime() < new Date(baselineTime).getTime()) {
        localStorage.setItem("admin_tickets_last_viewed_at", baselineTime);
        setLastViewedTicketsAt(baselineTime);
      }
    }

    // Keep updating last visited timestamp so on tab close, we know when the admin was last active
    localStorage.setItem(lastSessionCloseKey, now);

    const heartbeat = setInterval(() => {
      localStorage.setItem(lastSessionCloseKey, new Date().toISOString());
    }, 15000);

    const handleBeforeUnload = () => {
      localStorage.setItem(lastSessionCloseKey, new Date().toISOString());
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        localStorage.setItem(lastSessionCloseKey, new Date().toISOString());
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // When admin navigates to actionable sections, mark them viewed and clear badge
  useEffect(() => {
    if (location.pathname.startsWith("/queries")) {
      const now = new Date().toISOString();
      localStorage.setItem("admin_queries_last_viewed_at", now);
      setLastViewedQueriesAt(now);
    }
    if (location.pathname.startsWith("/contact-management") || location.pathname.startsWith("/contact")) {
      const now = new Date().toISOString();
      localStorage.setItem("admin_contact_last_viewed_at", now);
      setLastViewedContactAt(now);
    }
    if (location.pathname.startsWith("/assignments")) {
      const now = new Date().toISOString();
      localStorage.setItem("admin_assignments_last_viewed_at", now);
      setLastViewedAssignmentsAt(now);
    }
    if (location.pathname.startsWith("/requests") || location.pathname.startsWith("/support-tickets")) {
      const now = new Date().toISOString();
      localStorage.setItem("admin_tickets_last_viewed_at", now);
      setLastViewedTicketsAt(now);
    }
  }, [location.pathname]);

  // Listen for custom viewed events to dynamically clear badge without refresh
  useEffect(() => {
    const handleQueriesViewed = () => {
      const now = new Date().toISOString();
      setLastViewedQueriesAt(now);
    };
    const handleContactViewed = () => {
      const now = new Date().toISOString();
      setLastViewedContactAt(now);
    };
    const handleAssignmentsViewed = () => {
      const now = new Date().toISOString();
      setLastViewedAssignmentsAt(now);
    };
    const handleTicketsViewed = () => {
      const now = new Date().toISOString();
      setLastViewedTicketsAt(now);
    };
    window.addEventListener("queries:viewed", handleQueriesViewed);
    window.addEventListener("contact:viewed", handleContactViewed);
    window.addEventListener("assignments:viewed", handleAssignmentsViewed);
    window.addEventListener("tickets:viewed", handleTicketsViewed);
    return () => {
      window.removeEventListener("queries:viewed", handleQueriesViewed);
      window.removeEventListener("contact:viewed", handleContactViewed);
      window.removeEventListener("assignments:viewed", handleAssignmentsViewed);
      window.removeEventListener("tickets:viewed", handleTicketsViewed);
    };
  }, []);

  const handleNavItemClick = (path: string) => {
    const now = new Date().toISOString();
    if (path.startsWith("/queries")) {
      localStorage.setItem("admin_queries_last_viewed_at", now);
      setLastViewedQueriesAt(now);
      window.dispatchEvent(new Event("queries:viewed"));
    } else if (path.startsWith("/contact-management") || path.startsWith("/contact")) {
      localStorage.setItem("admin_contact_last_viewed_at", now);
      setLastViewedContactAt(now);
      window.dispatchEvent(new Event("contact:viewed"));
    } else if (path.startsWith("/assignments")) {
      localStorage.setItem("admin_assignments_last_viewed_at", now);
      setLastViewedAssignmentsAt(now);
      window.dispatchEvent(new Event("assignments:viewed"));
    } else if (path.startsWith("/requests") || path.startsWith("/support-tickets")) {
      localStorage.setItem("admin_tickets_last_viewed_at", now);
      setLastViewedTicketsAt(now);
      window.dispatchEvent(new Event("tickets:viewed"));
    }
  };

  useEffect(() => {
    dispatch(getAllQueries());
    dispatch(fetchContactRequests({ page: 1, limit: 10 }));
    dispatch(fetchAssignmentSubmissions({ page: 1, limit: 20 }));
    dispatch(fetchSupportTickets({ page: 1, limit: 20 }));

    // Periodic poll every 45s for live notifications
    const interval = setInterval(() => {
      dispatch(getAllQueries());
      dispatch(fetchContactRequests({ page: 1, limit: 10 }));
      dispatch(fetchAssignmentSubmissions({ page: 1, limit: 20 }));
      dispatch(fetchSupportTickets({ page: 1, limit: 20 }));
    }, 45000);

    return () => clearInterval(interval);
  }, [dispatch]);

  const newQueriesCount = useMemo(() => {
    if (!Array.isArray(queries)) return 0;
    return queries.filter((q) => {
      const isNew = (q.status || "").toLowerCase().trim().replace(/\s+/g, "_") === "new";
      if (!isNew) return false;
      // If admin previously viewed queries, only count queries received after that view
      if (lastViewedQueriesAt && q.createdAt) {
        return new Date(q.createdAt).getTime() > new Date(lastViewedQueriesAt).getTime();
      }
      return !lastViewedQueriesAt;
    }).length;
  }, [queries, lastViewedQueriesAt]);

  const newAssignmentsCount = useMemo(() => {
    if (!Array.isArray(assignmentSubmissions)) return 0;
    return assignmentSubmissions.filter((sub) => {
      const status = (sub.status || "").toLowerCase().trim();
      const isPendingReview = status === "submitted" || status === "resubmitted" || !sub.gradedAt;
      if (!isPendingReview) return false;
      const submissionDate = sub.submittedAt || sub.createdAt;
      if (lastViewedAssignmentsAt && submissionDate) {
        return new Date(submissionDate).getTime() > new Date(lastViewedAssignmentsAt).getTime();
      }
      return !lastViewedAssignmentsAt;
    }).length;
  }, [assignmentSubmissions, lastViewedAssignmentsAt]);

  const openTicketsCount = useMemo(() => {
    if (!Array.isArray(supportTickets)) return 0;
    return supportTickets.filter((ticket) => {
      const status = (ticket.status || "").toLowerCase().trim();
      const isOpen = status === "open" || status === "pending";
      if (!isOpen) return false;
      if (lastViewedTicketsAt && ticket.createdAt) {
        return new Date(ticket.createdAt).getTime() > new Date(lastViewedTicketsAt).getTime();
      }
      return !lastViewedTicketsAt;
    }).length;
  }, [supportTickets, lastViewedTicketsAt]);

  const pendingContactCount = useMemo(() => {
    if (contactSummary && typeof contactSummary.pending === "number") {
      if (lastViewedContactAt) {
        // If viewed, check if any request arrived after last view
        if (Array.isArray(contactRequests)) {
          return contactRequests.filter(
            (r) =>
              r.status === "pending" &&
              r.createdAt &&
              new Date(r.createdAt).getTime() > new Date(lastViewedContactAt).getTime()
          ).length;
        }
        return 0;
      }
      return contactSummary.pending;
    }
    return 0;
  }, [contactSummary, contactRequests, lastViewedContactAt]);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (!isExpanded && !isHovered) {
          setIsHovered(true);
        }
        setTimeout(() => searchInputRef.current?.focus(), 120);
      } else if (e.key === "Escape" && sidebarSearch) {
        setSidebarSearch("");
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded, isHovered, sidebarSearch, setIsHovered]);

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  const hasActiveSubItem = useCallback(
    (subItems: NavSubItem[]): boolean => {
      return subItems.some((subItem) => {
        if (isActive(subItem.path)) return true;
        if (subItem.subItems) return hasActiveSubItem(subItem.subItems);
        return false;
      });
    },
    [isActive]
  );

  useEffect(() => {
    const activeMenus: string[] = [];

    const checkMenuItems = (items: NavItem[], prefix: string) => {
      items.forEach((nav, index) => {
        const menuKey = `${prefix}-${index}`;
        if (nav.subItems && hasActiveSubItem(nav.subItems)) {
          activeMenus.push(menuKey);

          nav.subItems.forEach((subItem, subIndex) => {
            const subMenuKey = `${menuKey}-${subIndex}`;
            if (subItem.subItems && hasActiveSubItem(subItem.subItems)) {
              activeMenus.push(subMenuKey);
            }
          });
        }
      });
    };

    checkMenuItems(navItems, "main");
    setOpenSubmenu(activeMenus);
  }, [location, hasActiveSubItem]);

  useEffect(() => {
    openSubmenu.forEach((key) => {
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    });
  }, [openSubmenu]);

  const handleSubmenuToggle = (menuKey: string) => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (prevOpenSubmenu.includes(menuKey)) {
        return prevOpenSubmenu.filter((key) => key !== menuKey);
      }
      return [...prevOpenSubmenu, menuKey];
    });
  };

  const renderSubItems = (
    subItems: NavSubItem[],
    parentKey: string,
    level: number = 1
  ) => {
    return subItems.map((subItem, index) => {
      const subMenuKey = `${parentKey}-${index}`;
      const marginLeft = level === 1 ? "ml-9" : `ml-${9 + (level - 1) * 4}`;

      return (
        <li key={subItem.name}>
          {subItem.subItems ? (
            <>
              <button
                onClick={() => handleSubmenuToggle(subMenuKey)}
                className={`menu-dropdown-item cursor-pointer w-full text-left ${
                  openSubmenu.includes(subMenuKey) ||
                  hasActiveSubItem(subItem.subItems || [])
                    ? "menu-dropdown-item-active"
                    : "menu-dropdown-item-inactive"
                }`}
              >
                <span className="flex items-center justify-between gap-4 w-full">
                  <span>{subItem.name}</span>
                  <span className="flex items-center gap-1">
                    {subItem.new && (
                      <span className="menu-dropdown-badge menu-dropdown-badge-active">
                        new
                      </span>
                    )}
                    {subItem.pro && (
                      <span className="menu-dropdown-badge menu-dropdown-badge-active">
                        pro
                      </span>
                    )}
                    <ChevronDownIcon
                      className={`w-4 h-4 text-white/80 transition-transform duration-200 ${
                        openSubmenu.includes(subMenuKey) ? "rotate-180" : ""
                      }`}
                    />
                  </span>
                </span>
              </button>
              <div
                ref={(el) => {
                  subMenuRefs.current[subMenuKey] = el;
                }}
                className="overflow-hidden transition-all duration-300"
                style={{
                  height: openSubmenu.includes(subMenuKey)
                    ? `${subMenuHeight[subMenuKey]}px`
                    : "0px",
                }}
              >
                <ul className={`mt-2 space-y-1 ${marginLeft}`}>
                  {renderSubItems(subItem.subItems, subMenuKey, level + 1)}
                </ul>
              </div>
            </>
          ) : (
            <Link
              to={subItem.path}
              className={`menu-dropdown-item ${
                isActive(subItem.path)
                  ? "menu-dropdown-item-active"
                  : "menu-dropdown-item-inactive"
              }`}
            >
              <span>{subItem.name}</span>
              <span className="flex items-center gap-1 ml-auto">
                {subItem.new && (
                  <span className="menu-dropdown-badge menu-dropdown-badge-active">
                    new
                  </span>
                )}
                {subItem.pro && (
                  <span className="menu-dropdown-badge menu-dropdown-badge-active">
                    pro
                  </span>
                )}
              </span>
            </Link>
          )}
        </li>
      );
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-2">
      {items.map((nav, index) => {
        const menuKey = `${menuType}-${index}`;

        return (
          <li key={nav.name}>
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(menuKey)}
                className={`menu-item group ${
                  openSubmenu.includes(menuKey) ||
                  hasActiveSubItem(nav.subItems)
                    ? "menu-item-active"
                    : "menu-item-inactive"
                } cursor-pointer ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "lg:justify-start"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    openSubmenu.includes(menuKey) ||
                    hasActiveSubItem(nav.subItems)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text text-sm font-semibold truncate text-white">
                    {nav.name}
                  </span>
                )}
                {(isExpanded || isHovered || isMobileOpen) && (
                  <ChevronDownIcon
                    className={`ml-auto w-4 h-4 text-white/80 transition-transform duration-200 ${
                      openSubmenu.includes(menuKey)
                        ? "rotate-180"
                        : ""
                    }`}
                  />
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  to={nav.path}
                  onClick={() => handleNavItemClick(nav.path!)}
                  className={`menu-item group ${
                    isActive(nav.path)
                      ? "menu-item-active"
                      : "menu-item-inactive"
                  }`}
                >
                  <span
                    className={`menu-item-icon-size relative ${
                      isActive(nav.path)
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
                    }`}
                  >
                    {nav.icon}
                    {nav.path === "/queries/all" && newQueriesCount > 0 && !(isExpanded || isHovered || isMobileOpen) && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 border border-blue-900"></span>
                      </span>
                    )}
                    {nav.path === "/assignments/submissions" && newAssignmentsCount > 0 && !(isExpanded || isHovered || isMobileOpen) && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 border border-blue-900"></span>
                      </span>
                    )}
                    {nav.path === "/requests" && openTicketsCount > 0 && !(isExpanded || isHovered || isMobileOpen) && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 border border-blue-900"></span>
                      </span>
                    )}
                    {nav.path === "/contact-management" && pendingContactCount > 0 && !(isExpanded || isHovered || isMobileOpen) && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 border border-blue-900"></span>
                      </span>
                    )}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text text-sm font-semibold truncate text-white">
                      {nav.name}
                    </span>
                  )}
                  {nav.path === "/queries/all" && newQueriesCount > 0 && (isExpanded || isHovered || isMobileOpen) && (
                    <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-black text-emerald-950 bg-emerald-400 rounded-full shadow-xs ring-1 ring-emerald-300/40 animate-pulse">
                      {newQueriesCount}
                    </span>
                  )}
                  {nav.path === "/assignments/submissions" && newAssignmentsCount > 0 && (isExpanded || isHovered || isMobileOpen) && (
                    <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-black text-emerald-950 bg-emerald-400 rounded-full shadow-xs ring-1 ring-emerald-300/40 animate-pulse">
                      {newAssignmentsCount}
                    </span>
                  )}
                  {nav.path === "/requests" && openTicketsCount > 0 && (isExpanded || isHovered || isMobileOpen) && (
                    <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-black text-emerald-950 bg-emerald-400 rounded-full shadow-xs ring-1 ring-emerald-300/40">
                      {openTicketsCount}
                    </span>
                  )}
                  {nav.path === "/contact-management" && pendingContactCount > 0 && (isExpanded || isHovered || isMobileOpen) && (
                    <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-black text-emerald-950 bg-emerald-400 rounded-full shadow-xs ring-1 ring-emerald-300/40">
                      {pendingContactCount}
                    </span>
                  )}
                </Link>
              )
            )}
            {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
              <div
                ref={(el) => {
                  subMenuRefs.current[menuKey] = el;
                }}
                className="overflow-hidden transition-all duration-300"
                style={{
                  height: openSubmenu.includes(menuKey)
                    ? `${subMenuHeight[menuKey]}px`
                    : "0px",
                }}
              >
                <ul className="mt-1.5 space-y-1 ml-6 border-l border-white/20 pl-3">
                  {renderSubItems(nav.subItems, menuKey)}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  // Memoized search filtering for navItems
  const searchedNavItems = useMemo(() => {
    const isSuperAdmin = String(userRole || "").trim() === "super_admin";

    const roleItems =
      userRole === "news_editor"
        ? navItems.filter((nav) => nav.name === "News")
        : navItems;

    // Hide super-admin-only entries from everyone else.
    const baseItems = roleItems.filter(
      (nav) => !nav.superAdminOnly || isSuperAdmin
    );

    const term = sidebarSearch.trim().toLowerCase();
    if (!term) return baseItems;

    return baseItems
      .map((item) => {
        const matchesName = item.name.toLowerCase().includes(term);
        const matchesKeywords = item.keywords?.some((k) =>
          k.toLowerCase().includes(term)
        );

        if (item.subItems && item.subItems.length > 0) {
          const matchingSubItems = item.subItems.filter(
            (sub) =>
              sub.name.toLowerCase().includes(term) ||
              sub.keywords?.some((k) => k.toLowerCase().includes(term))
          );

          if (matchingSubItems.length > 0) {
            return {
              ...item,
              subItems: matchingSubItems,
            };
          }
        }

        if (matchesName || matchesKeywords) {
          return item;
        }

        return null;
      })
      .filter((item): item is NavItem => item !== null);
  }, [userRole, sidebarSearch]);

  // Automatically expand submenus when search is active
  useEffect(() => {
    if (sidebarSearch.trim()) {
      const keysToOpen: string[] = [];
      searchedNavItems.forEach((item, index) => {
        if (item.subItems && item.subItems.length > 0) {
          keysToOpen.push(`main-${index}`);
        }
      });
      setOpenSubmenu(keysToOpen);
    }
  }, [sidebarSearch, searchedNavItems]);

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-4 left-0 bg-gradient-to-b from-[#1b6294] via-[#16517a] to-[#103a58] text-white h-screen transition-all duration-300 ease-in-out z-50 border-r border-blue-900/40 shadow-2xl
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Brand Header with Large Logo */}
      <div
        className={`py-5 border-b border-white/15 mb-3 flex items-center ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/" className="flex items-center gap-3 group">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="h-12 w-12 object-contain drop-shadow-md group-hover:scale-105 transition-transform"
                src="/images/logo/logo.png"
                alt="Data Knowledge"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-lg font-extrabold tracking-tight text-white leading-tight truncate">
                  Data Knowledge
                </span>
                <span className="text-[10px] font-bold text-cyan-200 tracking-wider uppercase font-mono">
                  Admin Console
                </span>
              </div>
            </>
          ) : (
            <img
              className="h-10 w-10 object-contain drop-shadow-md"
              src="/images/logo/logo.png"
              alt="Data Knowledge"
            />
          )}
        </Link>
      </div>

      {/* Sidebar Search Bar */}
      <div className="mb-3 px-0.5">
        {isExpanded || isHovered || isMobileOpen ? (
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/50 group-focus-within:text-cyan-300 transition-colors">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              placeholder="Search menus & pages..."
              className="w-full h-9 pl-9 pr-8 text-xs rounded-xl bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/15 focus:border-cyan-300/60 text-white placeholder:text-white/50 shadow-inner focus:outline-none focus:ring-2 focus:ring-cyan-300/20 transition-all duration-200"
            />
            {sidebarSearch ? (
              <button
                type="button"
                onClick={() => {
                  setSidebarSearch("");
                  searchInputRef.current?.focus();
                }}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-white/50 hover:text-white transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                <kbd className="text-[9px] font-mono text-white/40 bg-white/10 px-1 py-0.5 rounded border border-white/10">
                  ⌘K
                </kbd>
              </span>
            )}
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => {
                setIsHovered(true);
                setTimeout(() => searchInputRef.current?.focus(), 150);
              }}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all border border-white/10 cursor-pointer shadow-xs"
              title="Search menu (⌘K)"
            >
              <Search className="w-4 h-4 text-cyan-200" />
            </button>
          </div>
        )}
      </div>

      {/* Navigation Scrollable Area */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar pb-8">
        <nav className="mb-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2
                className={`text-[11px] font-bold uppercase tracking-wider text-white/60 font-mono flex items-center ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  sidebarSearch.trim() ? (
                    <span className="flex items-center gap-1.5 text-cyan-200">
                      <span>Search Results</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-400/20 text-cyan-200 font-sans">
                        {searchedNavItems.length}
                      </span>
                    </span>
                  ) : (
                    "Main Navigation"
                  )
                ) : (
                  <HorizontaLDots className="size-5 text-white/60" />
                )}
              </h2>
            </div>

            {searchedNavItems.length > 0 ? (
              renderMenuItems(searchedNavItems, "main")
            ) : (
              <div className="py-8 px-2 text-center rounded-2xl bg-white/5 border border-white/10">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-2 text-white/50">
                  <Search className="w-4 h-4 text-cyan-200" />
                </div>
                <p className="text-xs font-semibold text-white">No menus found</p>
                <p className="text-[10px] text-white/50 mt-1">No items match "{sidebarSearch}"</p>
                <button
                  type="button"
                  onClick={() => setSidebarSearch("")}
                  className="mt-3 px-3 py-1 text-[11px] font-semibold text-cyan-200 bg-white/10 hover:bg-white/20 rounded-lg transition-colors cursor-pointer border border-white/10"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>

          {!sidebarSearch && userRole !== "news_editor" && othersItems.length > 0 && (
            <div>
              <h2
                className={`mb-3 text-[11px] font-bold uppercase tracking-wider text-white/60 font-mono flex items-center ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Others"
                ) : (
                  <HorizontaLDots className="size-5 text-white/60" />
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
