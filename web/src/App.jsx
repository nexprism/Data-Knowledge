import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Courses from './pages/Courses'
import Forum from './pages/Forum'
import Gigs from './pages/Gigs'
import News from './pages/News'
import NewsDetail from './pages/NewsDetail'
import PersonalityTest from './pages/PersonalityTest'
import CourseDetail from './pages/CourseDetail'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ResetPassword from './pages/ResetPassword'
import Checkout from './pages/Checkout'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Purchases from './pages/Purchases'
import MyCourses from './pages/MyCourses'
import DashboardCourses from './pages/DashboardCourses'
import DashboardPersonality from './pages/DashboardPersonality'
import DashboardForum from './pages/DashboardForum'
import DashboardNews from './pages/DashboardNews'
import DashboardSupport from './pages/DashboardSupport'
import DashboardMessages from './pages/DashboardMessages'
import DashboardCoursePlayer from './pages/DashboardCoursePlayer'
import DashboardJobPosts from './pages/DashboardJobPosts'
import JobDetail from './pages/JobDetail'
import MyForum from './pages/MyForum'
import MySubmissions from './pages/MySubmissions'
import Notifications from './pages/dashboard/Notifications'
import DashboardQuiz from './pages/DashboardQuiz'
import DashboardAssignment from './pages/DashboardAssignment'
import DashboardReading from './pages/DashboardReading'
import SessionExpiredPopup from './components/SessionExpiredPopup'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLiveClasses from './pages/DashboardLiveClasses'
import Contact from './pages/Contact'
import AboutUs from './pages/AboutUs'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Terms from './pages/Terms'
import RefundPolicy from './pages/RefundPolicy'
import Testimonials from './pages/Testimonials'
import { TrackerProvider } from './components/ActivityTracker'

import GlobalChatButton from './components/dashboard/GlobalChatButton'
// import Preloader from './components/Preloader'
import Lenis from '@studio-freight/lenis'
import { getApiBaseUrl } from './utils/apiConfig'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Global Fetch Interceptor with Automatic Token Refresh & Retry
const originalFetch = window.fetch;
let isRefreshingToken = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(newToken) {
  refreshSubscribers.forEach((cb) => {
    try { cb(newToken); } catch (_) {}
  });
  refreshSubscribers = [];
}

window.fetch = async function (...args) {
  let [resource, config = {}] = args;
  config = { ...config };

  const token = localStorage.getItem('edrilla_token');
  const refreshToken = localStorage.getItem('edrilla_refresh');
  const baseUrl = getApiBaseUrl();

  const urlStr = typeof resource === 'string' ? resource : resource?.url || '';
  const isApiRequest =
    urlStr.startsWith('/') ||
    urlStr.includes(baseUrl) ||
    urlStr.includes('dataknowledge') ||
    urlStr.includes('localhost') ||
    urlStr.includes('127.0.0.1');

  if (isApiRequest) {
    if (!config.credentials) {
      config.credentials = 'include';
    }

    let headersObj = {};
    if (config.headers instanceof Headers) {
      config.headers.forEach((val, key) => { headersObj[key] = val; });
    } else if (config.headers) {
      headersObj = { ...config.headers };
    }

    if (token && !headersObj['Authorization'] && !headersObj['authorization']) {
      headersObj['Authorization'] = `Bearer ${token}`;
    }
    if (token && !headersObj['x-access-token']) {
      headersObj['x-access-token'] = token;
    }
    if (refreshToken && !headersObj['x-refresh-token']) {
      headersObj['x-refresh-token'] = refreshToken;
    }
    config.headers = headersObj;
  }

  const response = await originalFetch(resource, config);

  // Capture refreshed tokens from response headers if returned by server
  try {
    const newAccess = response.headers.get('x-access-token');
    const newRefresh = response.headers.get('x-refresh-token');
    if (newAccess) localStorage.setItem('edrilla_token', newAccess);
    if (newRefresh) localStorage.setItem('edrilla_refresh', newRefresh);
  } catch (e) { }

  // Handle 401 Unauthorized seamlessly: attempt token refresh and retry before showing popup
  if (response.status === 401) {
    const isAuthRoute =
      urlStr.includes('/login') ||
      urlStr.includes('/signup') ||
      urlStr.includes('/refresh-token') ||
      urlStr.includes('/verifyotp') ||
      urlStr.includes('/sendotp');

    const currentRefreshToken = localStorage.getItem('edrilla_refresh');
    const hasAnyToken = !!(currentRefreshToken || localStorage.getItem('edrilla_token'));

    // If we have any token and this isn't an auth route, attempt background refresh & retry
    if (hasAnyToken && !isAuthRoute) {
      if (!isRefreshingToken) {
        isRefreshingToken = true;

        try {
          const refreshHeaders = {
            'Content-Type': 'application/json',
          };
          if (currentRefreshToken) {
            refreshHeaders['x-refresh-token'] = currentRefreshToken;
          }

          const refreshRes = await originalFetch(`${baseUrl}/refresh-token`, {
            method: 'POST',
            headers: refreshHeaders,
            credentials: 'include',
            body: JSON.stringify(currentRefreshToken ? { refreshToken: currentRefreshToken } : {}),
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            const newAccessToken =
              refreshData?.data?.accessToken || refreshRes.headers.get('x-access-token');
            const newRefreshToken =
              refreshData?.data?.refreshToken || refreshRes.headers.get('x-refresh-token');

            if (newAccessToken) localStorage.setItem('edrilla_token', newAccessToken);
            if (newRefreshToken) localStorage.setItem('edrilla_refresh', newRefreshToken);

            isRefreshingToken = false;
            onTokenRefreshed(newAccessToken);

            // Retry the original request with the fresh access token
            let retryHeaders = { ...(config.headers || {}) };
            if (newAccessToken) {
              retryHeaders['Authorization'] = `Bearer ${newAccessToken}`;
              retryHeaders['x-access-token'] = newAccessToken;
            }
            config.headers = retryHeaders;
            return originalFetch(resource, config);
          } else {
            // Refresh token has genuinely expired or been revoked
            isRefreshingToken = false;
            refreshSubscribers = [];

            const isDashboardRoute =
              window.location.pathname.startsWith('/dashboard') ||
              window.location.pathname.startsWith('/my-courses');

            localStorage.removeItem('edrilla_token');
            localStorage.removeItem('edrilla_refresh');
            localStorage.removeItem('edrilla_user');

            if (isDashboardRoute) {
              window.dispatchEvent(
                new CustomEvent("sessionExpired", {
                  detail: {
                    message: "Your session has expired. Please log in again.",
                  },
                })
              );
            }
          }
        } catch (refreshErr) {
          isRefreshingToken = false;
          refreshSubscribers = [];
        }
      } else {
        // Another refresh is in-flight: queue this request and retry once fresh token is ready
        return new Promise((resolve) => {
          subscribeTokenRefresh((freshToken) => {
            let retryHeaders = { ...(config.headers || {}) };
            if (freshToken) {
              retryHeaders['Authorization'] = `Bearer ${freshToken}`;
              retryHeaders['x-access-token'] = freshToken;
            }
            config.headers = retryHeaders;
            resolve(originalFetch(resource, config));
          });
        });
      }
    }
  }

  return response;
};

const AppContent = () => {
  const location = useLocation()
  const [isLoaded, setIsLoaded] = React.useState(true) // Initialized to true to bypass preloader

  // Tactical Path Matching
  const isDashboard = location.pathname.startsWith('/dashboard')
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/checkout' || location.pathname === '/reset-password'
  const isCleanPage = isDashboard || isAuthPage

  const lenisRef = React.useRef(null)

  useEffect(() => {
    // 1. Initialize Lenis Smooth Scroll ONCE
    const lenis = new Lenis({
      duration: 0.36,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    })
    lenisRef.current = lenis

    // 2. Synchronize Lenis with GSAP ScrollTrigger
    lenis.on('scroll', () => {
      ScrollTrigger.update()
    })

    const updateLenis = (time) => {
      lenis.raf(time * 1000)
    }

    gsap.ticker.add(updateLenis)

    return () => {
      lenis.destroy()
      gsap.ticker.remove(updateLenis)
    }
  }, [])

  // 6. Global refresh helpers: run ScrollTrigger.refresh on load, fonts ready, and a few delayed ticks
  useEffect(() => {
    const doRefresh = () => {
      try { ScrollTrigger.refresh(); console.debug('[App] ScrollTrigger.refresh() called') } catch (e) { /* ignore */ }
      try { if (lenisRef.current) lenisRef.current.raf(performance.now()) } catch (e) { /* ignore */ }
      try { window.dispatchEvent(new Event('resize')); console.debug('[App] dispatched resize') } catch (e) { }
    }

    const onLoad = () => doRefresh()
    window.addEventListener('load', onLoad)

    // rAF + delayed attempts to catch late-loading images/fonts
    requestAnimationFrame(doRefresh)
    const t1 = setTimeout(doRefresh, 150)
    const t2 = setTimeout(doRefresh, 600)

    if (document?.fonts?.ready) {
      document.fonts.ready.then(doRefresh).catch(() => { })
    }

    return () => {
      window.removeEventListener('load', onLoad)
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  // 7. Auto-refresh when DOM changes, images load, or viewport resizes (debounced)
  useEffect(() => {
    let refreshTimer = null
    const doRefresh = () => {
      try {
        ScrollTrigger.refresh()
      } catch (e) { /* ignore */ }
    }

    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer)
      refreshTimer = setTimeout(() => {
        doRefresh()
      }, 150) // Stable debounce prevents continuous layout thrashing
    }

    // Observe DOM mutations ONLY for child additions/removals (never observe attributes)
    let observer
    try {
      observer = new MutationObserver(scheduleRefresh)
      observer.observe(document.body, { childList: true, subtree: true })
    } catch (e) {
      observer = null
    }

    // Listen for image loads that may change layout
    const imgs = Array.from(document.images || [])
    const imgListeners = []
    imgs.forEach((img) => {
      if (!img.complete) {
        const cb = () => scheduleRefresh()
        img.addEventListener('load', cb, { once: true })
        imgListeners.push({ img, cb })
      }
    })

    // Resize -> refresh
    window.addEventListener('resize', scheduleRefresh)

    // Fallback: a couple of delayed attempts
    const d1 = setTimeout(scheduleRefresh, 300)
    const d2 = setTimeout(scheduleRefresh, 1200)

    return () => {
      if (observer) observer.disconnect()
      imgListeners.forEach(({ img, cb }) => img.removeEventListener('load', cb))
      window.removeEventListener('resize', scheduleRefresh)
      clearTimeout(d1)
      clearTimeout(d2)
      if (refreshTimer) clearTimeout(refreshTimer)
    }
  }, [])

  // 3. Handle Route Changes (Reset Scroll and Refresh)
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true })
    }

    // Refresh ScrollTrigger after a short delay to allow components to mount
    const timer = setTimeout(() => {
      ScrollTrigger.refresh()
    }, 100)

    return () => clearTimeout(timer)
  }, [location.pathname])



  // 5. Global Site Reveal Logic (Prevents Refresh Flicker)
  useEffect(() => {
    if (isLoaded) {
      gsap.to('#content-wrapper', {
        opacity: 1,
        pointerEvents: 'auto',
        duration: 0.8,
        ease: 'power2.out'
      })
    }
  }, [isLoaded])

  // 6. Force content wrapper visible and trigger reflow as a last-resort fix
  useEffect(() => {
    const el = document.getElementById('content-wrapper')
    if (!el) return

    try {
      el.style.opacity = '1'
      el.style.pointerEvents = 'auto'
      // tiny transition to ensure the browser applies styles
      el.style.transition = 'opacity 0.06s linear'
      // Force a reflow
      // eslint-disable-next-line no-unused-expressions
      void el.offsetHeight
      console.debug('[App] content-wrapper forced visible')
    } catch (e) {
      /* ignore */
    }

    const t = setTimeout(() => {
      try { ScrollTrigger.refresh(); console.debug('[App] forced refresh after forcing visibility') } catch (e) { }
    }, 80)

    return () => clearTimeout(t)
  }, [])

  return (
    <>
      {/* <Preloader onComplete={() => setIsLoaded(true)} /> */}

      {/* 1. Navbar stays fixed above the perspective wrap */}
      {!isCleanPage && <Navbar isLoaded={isLoaded} />}

      {/* 2. Main Site Content Wrapper (Perspective Ready) */}
      <div
        id="content-wrapper"
        className={`relative min-h-screen origin-right ${isCleanPage ? 'bg-dark' : ''} opacity-0 pointer-events-none`}
      >
        <main>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home isLoaded={isLoaded} />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/gig" element={<Gigs />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/:id" element={<NewsDetail />} />
            <Route path="/blogs" element={<News />} />
            <Route path="/blogs/:id" element={<NewsDetail />} />
            <Route path="/course-detail/:id" element={<CourseDetail />} />
            <Route path="/personality-test" element={<PersonalityTest />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-conditions" element={<Terms />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/terms-of-service" element={<Terms />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/testimonials" element={<Testimonials />} />

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/checkout" element={<Checkout />} />

            {/* Nested Tactical Dashboard (v2.1 Routing) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard">
                <Route index element={<Dashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="purchases" element={<Purchases />} />
                <Route path="my-courses" element={<MyCourses />} />
                <Route path="live-classes" element={<DashboardLiveClasses />} />
                <Route path="courses" element={<DashboardCourses />} />
                <Route path="personality-test" element={<DashboardPersonality />} />
                <Route path="forum" element={<DashboardForum />} />
                <Route path="news" element={<DashboardNews />} />
                <Route path="blogs" element={<DashboardNews />} />
                <Route path="support" element={<DashboardSupport />} />
                <Route path="messages" element={<DashboardMessages />} />
                <Route path="course/:id" element={<DashboardCoursePlayer />} />
                <Route path="quiz/:courseId/:id" element={<DashboardQuiz />} />
                <Route path="quiz/:id" element={<DashboardQuiz />} />
                <Route path="assignment/:courseId/:id" element={<DashboardAssignment />} />
                <Route path="reading/:courseId/:id" element={<DashboardReading />} />
                <Route path="job-posts" element={<DashboardJobPosts />} />
                <Route path="job/:id" element={<JobDetail />} />
                <Route path="my-forum" element={<MyForum />} />
                <Route path="my-submissions" element={<MySubmissions />} />
                <Route path="notifications" element={<Notifications />} />
              </Route>
            </Route>

            {/* Tactical Redirects for Legacy Paths */}
            <Route path="/profile" element={<Navigate to="/dashboard/profile" replace />} />
            <Route path="/purchases" element={<Navigate to="/dashboard/purchases" replace />} />
            <Route path="/my-courses" element={<Navigate to="/dashboard/my-courses" replace />} />
            <Route path="/dashboard-home" element={<Navigate to="/dashboard" replace />} />

          </Routes>
        </main>
        {!isCleanPage && <Footer />}
      </div>

      {/* Support Protocol - Persistent on Dashboards (Excluded on Messages page) */}
      {isDashboard && location.pathname !== '/dashboard/messages' && <GlobalChatButton />}
    </>
  )
}

const App = () => {
  const [sessionExpired, setSessionExpired] = React.useState(false);
  const [sessionExpiredMsg, setSessionExpiredMsg] = React.useState("");

  useEffect(() => {
    const handleSessionExpired = (e) => {
      setSessionExpired(true);
      setSessionExpiredMsg(e.detail?.message || "Session expired");
    };

    window.addEventListener("sessionExpired", handleSessionExpired);
    return () => window.removeEventListener("sessionExpired", handleSessionExpired);
  }, []);

  const handlePopupClose = () => {
    setSessionExpired(false);

    // Clear user data
    localStorage.removeItem("edrilla_token");
    localStorage.removeItem("edrilla_user");
    localStorage.removeItem("edrilla_refresh");

    // Redirect the user to the login page
    window.location.href = "/login";
  };

  return (
    <BrowserRouter>
      <TrackerProvider>
        <AppContent />
        <SessionExpiredPopup
          isOpen={sessionExpired}
          message={sessionExpiredMsg}
          onClose={handlePopupClose}
        />
      </TrackerProvider>
    </BrowserRouter>
  )
}

export default App
