import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../redux/slices/authSlice'
import { fetchNotifications, markNotificationsRead } from '../../redux/slices/notificationSlice'
import { createPortal } from 'react-dom'
import { gsap } from 'gsap'
import RollingText from '../RollingText'
import ConfirmModal from '../profile/ConfirmModal'
import { useTheme } from '../../context/ThemeContext'
import { useLanguage } from '../../context/LanguageContext'


const DashboardHeader = () => {
  const location = useLocation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector(state => state.auth)
  const { theme, toggleTheme } = useTheme()
  const { t } = useLanguage()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const { items: notifications } = useSelector(state => state.notifications)

  useEffect(() => {
    document.documentElement.classList.add('dashboard-normal-font')
    return () => document.documentElement.classList.remove('dashboard-normal-font')
  }, [])

  useEffect(() => {
    if (user) {
      dispatch(fetchNotifications({ page: 1, limit: 5 }))
    }
  }, [dispatch, user])

  const handleMarkAllRead = () => {
    dispatch(markNotificationsRead()).then(() => {
      dispatch(fetchNotifications({ page: 1, limit: 5 }))
    })
  }

  const navItems = [
    { key: 'dashboard', name: (t('dashboard') || 'DASHBOARD').toUpperCase(), path: '/dashboard' },
    { key: 'liveClasses', name: (t('liveClasses') || 'LIVE CLASSES').toUpperCase(), path: '/dashboard/live-classes' },
    { key: 'profile', name: (t('profile') || 'PROFILE').toUpperCase(), path: '/dashboard/profile' },
    {
      key: 'myActivity',
      name: (t('myActivity') || 'MY ACTIVITY').toUpperCase(),
      path: '#',
      subItems: [
        { key: 'myForum', name: (t('myForum') || 'MY FORUM').toUpperCase(), path: '/dashboard/my-forum' },
        { key: 'mySubmissions', name: (t('mySubmissions') || 'MY SUBMISSIONS').toUpperCase(), path: '/dashboard/my-submissions' },
      ]
    },
    { key: 'mySubmissions', name: (t('mySubmissions') || 'MY SUBMISSIONS').toUpperCase(), path: '/dashboard/my-submissions' },
    { key: 'myPurchases', name: (t('myPurchases') || 'MY PURCHASES').toUpperCase(), path: '/dashboard/purchases' },
    { key: 'myCourses', name: (t('myCourses') || 'MY COURSES').toUpperCase(), path: '/dashboard/my-courses' },
    { key: 'allCourses', name: (t('allCourses') || 'ALL COURSES').toUpperCase(), path: '/dashboard/courses' },
    // { key: 'forum', name: (t('forum') || 'FORUM').toUpperCase(), path: '/dashboard/forum' },
    { key: 'blogs', name: (t('blogs') || 'BLOGS').toUpperCase(), path: '/dashboard/blogs' },
    // { key: 'jobPostings', name: (t('jobPostings') || 'JOB POSTINGS').toUpperCase(), path: '/dashboard/job-posts' },
  ]

  const menuRef = useRef(null)
  const overlayRef = useRef(null)
  const shutter1Ref = useRef(null)
  const shutter2Ref = useRef(null)
  const shutter3Ref = useRef(null)
  const itemsRef = useRef([])
  const tl = useRef(null)

  // Helper for initials
  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  useEffect(() => {
    const contentWrap = document.getElementById('content-wrapper')
    const ctx = gsap.context(() => {
      tl.current = gsap.timeline({ paused: true, defaults: { duration: 1.1, ease: 'expo.inOut' } })

      // 1. Perspective Shift for Content
      if (contentWrap) {
        tl.current.to(contentWrap, {
          scale: 0.85,
          rotateY: -10,
          x: '-15%',
          borderRadius: '2rem',
          pointerEvents: 'none',
        }, 0)
      }

      // 2. Cascading Shutters
      tl.current.to(overlayRef.current, { autoAlpha: 1, duration: 0, pointerEvents: 'auto' }, 0)
      tl.current.fromTo([shutter1Ref.current, shutter2Ref.current, shutter3Ref.current],
        { x: '100%', opacity: 1, visibility: 'visible' },
        { x: '0%', stagger: 0.1, duration: 1.1, ease: 'expo.inOut' },
        0
      )

      // 3. Staggered Menu Content
      tl.current.fromTo('.dash-menu-item',
        { y: 40, opacity: 0, rotateX: -20, scale: 0.95, filter: 'blur(15px)' },
        { y: 0, opacity: 1, rotateX: 0, scale: 1, filter: 'blur(0px)', stagger: 0.08, duration: 1.2, ease: 'power3.out' },
        0.5
      )
    })

    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
      tl.current.play()
    } else {
      document.body.style.overflow = 'unset'
      tl.current.reverse()
    }
  }, [isMobileMenuOpen])

  const toggleMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleLogout = () => {
    try {
      localStorage.removeItem('edrilla_token')
      localStorage.removeItem('edrilla_user')
      localStorage.removeItem('user')
      localStorage.removeItem('userInfo')
      dispatch(logout())
      setShowLogoutConfirm(false)
      navigate('/')
    } catch (e) {
      window.location.href = '/'
    }
  }

  const mobileOverlay = createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[10000] [@media(min-width:1300px)]:hidden invisible pointer-events-none"
    >
      <div ref={shutter1Ref} className="absolute inset-0 bg-slate-50 translate-x-full" />
      <div ref={shutter2Ref} className="absolute inset-0 bg-amber-100/60 translate-x-full border-r border-amber-300/40" />
      <div ref={shutter3Ref} className="absolute inset-0 bg-white translate-x-full overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] [background-size:200px_200px]" />

        <div className="dash-menu-item absolute top-0 left-0 w-full p-6 flex items-center justify-between z-20">
          <div className="flex items-center gap-2.5">
            <img src="/data_knowlege/logo/logo.png" alt="Data Knowledge Logo" className="h-8 w-auto object-contain rounded-lg" />
          </div>
          <button
            onClick={toggleMenu}
            className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 hover:bg-accent hover:text-slate-950 transition-all active:scale-95"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="relative z-10 h-full overflow-y-auto no-scrollbar pointer-events-auto px-6 py-28 flex flex-col items-center">
          <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
            {navItems.map((item, i) => {
              const isActive = item.path === '/dashboard'
                ? location.pathname === '/dashboard'
                : location.pathname.startsWith(item.path)

              return (
                <div key={i} className="dash-menu-item group flex flex-col">
                  <Link
                    to={item.path === '#' ? undefined : item.path}
                    onClick={item.path === '#' ? undefined : toggleMenu}
                    className="flex items-center gap-6 group/link py-4 border-b border-slate-100 hover:border-accent/40 transition-all duration-500"
                  >
                    <span className="font-jetbrains text-[10px] text-accent group-hover/link:text-amber-600 tracking-widest transition-colors">0{i + 1}</span>
                    <span className={`font-inter text-2xl md:text-3xl lg:text-4xl font-extralight tracking-tighter leading-none transition-all duration-500 ${isActive ? 'text-accent italic font-normal' : 'text-slate-800 group-hover/link:text-amber-600 group-hover/link:translate-x-2'}`}>
                      {item.name}
                    </span>
                  </Link>

                  {item.subItems && (
                    <div className="flex gap-6 pl-10 mt-4">
                      {item.subItems.map((sub, si) => (
                        <Link
                          key={si}
                          to={sub.path}
                          onClick={toggleMenu}
                          className="font-jetbrains text-[8px] text-slate-600 hover:text-accent tracking-[0.4em] uppercase transition-all flex items-center gap-2"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m9 18 6-6-6-6" /></svg>
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="dash-menu-item w-full max-w-4xl mt-20 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left pb-20">
            <div className="space-y-1">
              <p className="font-jetbrains text-[9px] tracking-[0.6em] text-slate-600 uppercase">Where Ambition Meets Execution</p>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="px-8 py-4 border border-red-500/20 bg-red-50 text-red-600 font-jetbrains text-[9px] tracking-[0.4em] uppercase hover:bg-red-600 hover:text-white transition-all rounded-xl flex items-center gap-3 group/logout"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform group-hover/logout:translate-x-1"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
              LOG OUT
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )

  return (
    <header className="fixed top-0 left-0 w-full z-[8000] bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-4 py-3.5 flex items-center justify-between shadow-sm">
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title={t('confirmLogoutTitle')}
        message={t('confirmLogoutMessage')}
        confirmText={t('logOutNowBtn')}
        cancelText={t('cancelBtn')}
      />

      <div className="flex items-center gap-6">
        {/* DASHBOARD LOGO */}
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity text-slate-900">
          <img src="/data_knowlege/logo/logo.png" alt="Data Knowledge Logo" className="h-8 w-auto object-contain rounded-lg" />
        </Link>

        <nav className="hidden [@media(min-width:1300px)]:flex items-center gap-6">
          {navItems.map((item) => {
            const isActive = item.path === '/dashboard'
              ? location.pathname === '/dashboard'
              : location.pathname.startsWith(item.path)

            if (item.subItems) {
              return (
                <div key={item.name} className="relative group/nav py-2">
                  <button
                    className={`font-jetbrains text-[9px] tracking-[0.2em] font-black transition-all duration-300 flex items-center gap-1
                         ${isActive ? 'text-amber-600' : 'text-slate-700 hover:text-slate-900'}`}
                  >
                    {item.name}
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover/nav:rotate-180 transition-transform"><path d="m6 9 6 6 6-6" /></svg>
                  </button>

                  {/* Dropdown Menu */}
                  <div className="absolute top-full left-0 pt-3 opacity-0 invisible group-hover/nav:opacity-100 group-hover/nav:visible transition-all duration-300 translate-y-2 group-hover/nav:translate-y-0 z-[9000]">
                    <div className="bg-white border border-slate-200 rounded-xl p-5 min-w-[220px] shadow-xl flex flex-col gap-3">
                      {item.subItems.map((sub) => (
                        <Link
                          key={sub.name}
                          to={sub.path}
                          className="font-jetbrains text-[9px] text-slate-700 hover:text-accent font-bold tracking-[0.15em] uppercase transition-all flex items-center gap-3 group/sub"
                        >
                          <div className="w-1.5 h-[1.5px] bg-accent group-hover/sub:w-4 transition-all" />
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`font-jetbrains text-[9px] tracking-[0.2em] font-black transition-all duration-300 relative py-2
                     ${isActive ? 'text-amber-600' : 'text-slate-700 hover:text-slate-900'}`}
              >
                {item.name}
                {isActive && (
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-accent shadow-sm" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2 md:gap-3 relative">

        {/* SUPPORT */}
        <Link
          to="/dashboard/support"
          className={`relative p-2 rounded-full transition-all ${location.pathname === '/dashboard/support' ? 'bg-amber-100 text-amber-700' : 'hover:bg-slate-100 text-slate-700'}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={location.pathname === '/dashboard/support' ? 'text-amber-700' : 'text-slate-600 hover:text-amber-600'}>
            <path d="M3 11V9a9 9 0 0 1 18 0v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 11h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2zM3 11h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 16v2a2 2 0 0 1-2 2h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full border-2 border-white shadow-sm transition-all" />
        </Link>

        {/* NOTIFICATIONS */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
            className={`relative group p-2 rounded-full transition-all ${showNotifications ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-100 text-slate-700'}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={showNotifications ? 'text-amber-600' : 'text-slate-600 group-hover:text-amber-600'}>
              <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6981 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-white" />
          </button>

          <div className={`absolute top-14 right-0 w-80 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xl transition-all duration-300 origin-top
              ${showNotifications ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-2 invisible pointer-events-none'}`}>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <span className="font-jetbrains text-[8px] text-amber-600 tracking-[0.2em] font-black uppercase">{t('recentDispatches') || 'RECENT DISPATCHES'}</span>
              <button onClick={handleMarkAllRead} className="font-jetbrains text-[8px] text-slate-500 uppercase tracking-widest cursor-pointer hover:text-slate-800 bg-transparent border-none p-0">{t('markAllRead') || 'MARK ALL READ'}</button>
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {notifications?.length > 0 ? notifications.slice(0, 5).map((item, i) => (
                <div key={i} className={`group cursor-pointer p-3 rounded-lg hover:bg-slate-50 transition-colors border-l-2 ${item.status === 1 ? 'border-amber-400 bg-amber-50/30' : 'border-transparent hover:border-accent'}`}>
                  <div className="flex justify-between items-start mb-1">
                    <h5 className="font-inter text-sm text-slate-900 group-hover:text-amber-600 transition-colors">{item.data?.title || 'Notification'}</h5>
                    <span className="font-jetbrains text-[6px] text-amber-700 bg-amber-50 border border-amber-200 px-1 rounded">{item.status === 1 ? 'NEW' : 'READ'}</span>
                  </div>
                  <p className="font-jetbrains text-[9px] text-slate-600 leading-tight line-clamp-2">{item.data?.description || item.data?.body || ''}</p>
                </div>
              )) : (
                <p className="text-xs text-slate-500 text-center py-4">No recent notifications</p>
              )}
            </div>
            <Link to="/dashboard/notifications" className="w-full mt-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-jetbrains text-[8px] text-slate-700 uppercase tracking-[0.3em] hover:bg-accent hover:text-slate-950 font-bold transition-all flex justify-center text-center items-center">{t('viewAllAlerts') || 'VIEW ALL ALERTS'}</Link>
          </div>
        </div>

        {/* PROFILE */}
        <div className="relative">
          <div
            onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
            className="flex items-center gap-3 pl-3 border-l border-slate-200 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-accent text-slate-950 flex items-center justify-center font-jetbrains text-xs font-black shadow-sm group-hover:scale-105 transition-all">
              {getInitials(user?.fullName || user?.name)}
            </div>
          </div>

          {/* Profile Dropdown */}
          <div className={`absolute top-14 right-0 w-56 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xl transition-all duration-300 origin-top
              ${showProfileMenu ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-2 invisible pointer-events-none'}`}>
            <div className="mb-4 pb-3 border-b border-slate-100">
              <p className="font-inter text-lg text-slate-900 leading-none mb-1">{user?.fullName || user?.name || 'Protocol User'}</p>
              <p className="font-jetbrains text-[8px] text-amber-600 tracking-[0.2em] font-black uppercase">RANK {user?.rank || '#--'} {t('rankCarrier')}</p>
            </div>
            <div className="space-y-1">
              {[
                { name: t('identityProfile'), path: '/dashboard/profile' },
                { name: t('systemSettings'), path: '/dashboard/profile' },
                { name: t('accessKeys'), path: '/dashboard/profile' }
              ].map((item, i) => (
                <Link
                  key={i} to={item.path}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-accent group-hover:scale-125 transition-transform" />
                  <span className="font-jetbrains text-[9px] text-slate-700 group-hover:text-slate-950 font-bold uppercase tracking-widest">{item.name}</span>
                </Link>
              ))}
            </div>
            <button onClick={() => setShowLogoutConfirm(true)} className="w-full mt-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl font-jetbrains text-[8px] font-black uppercase tracking-[0.4em] hover:bg-red-600 hover:text-white transition-all">{t('logOut')}</button>
          </div>
        </div>

        {/* MOBILE MENU TOGGLE */}
        <button
          onClick={toggleMenu}
          className="[@media(min-width:1300px)]:hidden w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 transition-all active:scale-90 relative z-[9000]"
        >
          <div className="relative w-5 h-5">
            <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-5 h-[2px] bg-current transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45' : '-translate-y-[6px]'}`} />
            <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-5 h-[2px] bg-current transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-5 h-[2px] bg-current transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45' : 'translate-y-[6px]'}`} />
          </div>
        </button>
      </div>

      {mobileOverlay}
    </header>
  )
}

export default DashboardHeader
