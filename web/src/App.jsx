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
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Global Fetch Interceptor for Session Expiry across all Redux Thunks
const originalFetch = window.fetch;
window.fetch = async function (...args) {
  const response = await originalFetch.apply(this, args);

  if (response.status === 401) {
    try {
      const resClone = response.clone();
      const data = await resClone.json();
      if (data && data.isNewDeviceLogin) {
        window.dispatchEvent(
          new CustomEvent("sessionExpired", {
            detail: {
              message: data.message || "Your session has expired due to a login from another device. Please log in again.",
            },
          })
        );
      }
    } catch (e) {
      // ignore
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
