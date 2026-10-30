import React, { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import RollingText from './RollingText'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const Navbar = ({ isLoaded }) => {
  const { token } = useSelector((state) => state.auth)
  const { theme } = useTheme()
  const { t } = useLanguage()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)
  const shutter1Ref = useRef(null)
  const shutter2Ref = useRef(null)
  const shutter3Ref = useRef(null)
  const line1Ref = useRef(null)
  const line2Ref = useRef(null)
  const line3Ref = useRef(null)

  const navLinks = [
    { key: 'home', name: t('home'), path: '/' },
    { key: 'ourCourses', name: t('ourCourses'), path: '/courses' },
    // { key: 'forum', name: t('forum'), path: '/forum' },
    { key: 'blogs', name: t('blogs') || 'Blogs', path: '/blogs' },
    { key: 'testimonials', name: 'Testimonials', path: '/testimonials' },
    { key: 'aboutUs', name: t('aboutUs'), path: '/about-us' },
    { key: 'contact', name: t('contact'), path: '/contact' },
  ]

  const socialLinks = [
    { name: 'YouTube', icon: 'M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z M10 15V9l6 3z', url: '#' },
    { name: 'Instagram', icon: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z M17.5 6.5h.01', url: '#', isInsta: true },
    { name: 'X', icon: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154H7.594l5.243 6.932 6.064-6.933zm-1.292 19.49h2.039L6.486 3.24H4.298L17.61 20.644z', url: '#' },
    { name: 'Facebook', icon: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z', url: '#' }
  ]

  const navContainerRef = useRef(null)
  const innerNavRef = useRef(null)
  const logoRef = useRef(null)
  const linksWrapRef = useRef(null)
  const buttonsWrapRef = useRef(null)
  const pillRef = useRef(null)

  useEffect(() => {
    if (!isLoaded) return;

    const ctx = gsap.context(() => {
      const internalTl = gsap.timeline()

      // 1. Initial Entrance
      internalTl.fromTo(navContainerRef.current,
        { y: -15, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          autoAlpha: 1,
          pointerEvents: "auto",
          duration: 0.35,
          ease: 'power3.out'
        }
      )

      internalTl.fromTo(logoRef.current, { x: -4, opacity: 0 }, { x: 0, opacity: 1, duration: 0.25 }, '-=0.15')
      internalTl.fromTo('.nav-link-item',
        { y: 3, opacity: 0, scale: 0.99 },
        { y: 0, opacity: 1, scale: 1, stagger: 0.02, duration: 0.35, ease: 'power3.out' },
        '-=0.15'
      )
      internalTl.fromTo(buttonsWrapRef.current, { x: 4, opacity: 0 }, { x: 0, opacity: 1, duration: 0.25 }, '-=0.15')
    })

    return () => ctx.revert()
  }, [isLoaded])

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Set the initial pill state for Light Glass UI
      gsap.set(navContainerRef.current, {
        top: '1.5rem',
        width: '94%',
        maxWidth: '1200px',
        left: '50%',
        xPercent: -50,
      })
      gsap.set(innerNavRef.current, {
        borderRadius: '999px',
        paddingTop: '0.85rem',
        paddingBottom: '0.85rem',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(16px)'
      })

      if (window.innerWidth >= 1024) {
        ScrollTrigger.create({
          trigger: 'body',
          start: 'top -40',
          onEnter: () => {
            gsap.to(navContainerRef.current, {
              top: '1rem',
              width: '90%',
              maxWidth: '1400px',
              duration: 0.4,
              ease: 'power3.out',
              overwrite: 'auto'
            })
            gsap.to(innerNavRef.current, {
              backgroundColor: 'rgba(255, 255, 255, 0.96)',
              backdropFilter: 'blur(24px)',
              duration: 0.4,
              ease: 'power3.out',
              overwrite: 'auto'
            })
          },
          onLeaveBack: () => {
            gsap.to(navContainerRef.current, {
              top: '1.5rem',
              width: '94%',
              maxWidth: '1200px',
              duration: 0.4,
              ease: 'power3.out',
              overwrite: 'auto'
            })
            gsap.to(innerNavRef.current, {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(16px)',
              duration: 0.4,
              ease: 'power3.out',
              overwrite: 'auto'
            })
          }
        })
      }
    })

    return () => ctx.revert()
  }, [theme])

  const updatePillToActive = () => {
    if (!linksWrapRef.current || !pillRef.current) return
    const activeEl = linksWrapRef.current.querySelector('.active')
    if (activeEl) {
      gsap.to(pillRef.current, {
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        duration: 0.35,
        ease: 'power3.out',
        autoAlpha: 1
      })
    } else {
      gsap.to(pillRef.current, { autoAlpha: 0, duration: 0.3 })
    }
  }

  useEffect(() => {
    const timer = setTimeout(updatePillToActive, 50)
    return () => clearTimeout(timer)
  }, [location.pathname, t])

  // Floating Pill Highlight Logic
  const handleHover = (e) => {
    const { offsetLeft, offsetWidth } = e.currentTarget
    gsap.to(pillRef.current, {
      left: offsetLeft,
      width: offsetWidth,
      duration: 0.35,
      ease: 'power3.out',
      autoAlpha: 1
    })
  }

  const handleLeave = () => {
    updatePillToActive()
  }

  const tl = useRef(null)

  useEffect(() => {
    const contentWrap = document.getElementById('content-wrapper')
    const ctx = gsap.context(() => {
      tl.current = gsap.timeline({ paused: true, defaults: { duration: 1.1, ease: 'expo.inOut' } })

      // 1. Perspective Shift for Content
      tl.current.to(contentWrap, {
        scale: 0.85,
        rotateY: -10,
        x: '-15%',
        borderRadius: '2rem',
        pointerEvents: 'none',
      }, 0)

      // 2. Hide Site Navbar entirely
      tl.current.to(navContainerRef.current, { autoAlpha: 0, scale: 0.9, duration: 0.8 }, 0)

      // 3. Cascading Shutters
      tl.current.to(menuRef.current, { autoAlpha: 1, duration: 0 }, 0)
      tl.current.fromTo([shutter1Ref.current, shutter2Ref.current, shutter3Ref.current],
        { x: '100%' },
        { x: '0%', stagger: 0.1 },
        0
      )

      // 4. Menu Header Reveal
      tl.current.fromTo('.menu-header', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.8 }, 0.6)

      // 5. Staggered Menu Content
      tl.current.fromTo('.menu-item',
        { y: 40, opacity: 0, rotateX: -20, scale: 0.95, filter: 'blur(15px)' },
        { y: 0, opacity: 1, rotateX: 0, scale: 1, filter: 'blur(0px)', stagger: 0.1, duration: 1.2, ease: 'power3.out' },
        0.5
      )

      // 4. Background Shapes Reveal
      tl.current.fromTo('.bg-shape',
        { scale: 0.3, opacity: 0, rotate: -45 },
        { scale: 1, opacity: 0.12, rotate: 0, stagger: 0.15, duration: 1.5 },
        0.5
      )

      // 5. Staggered Menu Content (Materializing from void)
      tl.current.fromTo('.menu-item',
        { y: 40, opacity: 0, rotateX: -20, scale: 0.95, filter: 'blur(15px)' },
        { y: 0, opacity: 1, rotateX: 0, scale: 1, filter: 'blur(0px)', stagger: 0.12, duration: 1.2, ease: 'power3.out' },
        0.6
      )

      // Perpetual Float (independent of timeline)
      gsap.to('.bg-shape-float', {
        y: '30px',
        x: '15px',
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: { each: 0.8, from: 'random' }
      })
    })

    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (isOpen) {
      tl.current.play()
    } else {
      tl.current.reverse()
    }
  }, [isOpen])

  const toggleMenu = () => setIsOpen(!isOpen)

  return (
    <>
      {/* Navbar Container */}
      <nav
        ref={navContainerRef}
        className="fixed z-[120] will-change-[transform,top,width] opacity-0 pointer-events-none"
      >
        <div
          ref={innerNavRef}
          className="flex items-center justify-between gap-2 sm:gap-3 bg-white/90 rounded-[2rem] md:rounded-full px-3 sm:px-4 md:px-6 !py-3 border border-slate-200/80 shadow-sm backdrop-blur-2xl relative z-20 min-w-0 will-change-[padding,background-color]"
        >

          <Link
            to="/"
            ref={logoRef}
            className="flex items-center hover:opacity-90 transition-opacity gap-2 sm:gap-2.5 md:gap-3 text-slate-900 group min-w-0 shrink"
            aria-label="Data Knowledge — home"
          >
            <img
              src="/data_knowlege/logo/logo.png"
              alt=""
              className="h-9 sm:h-9 md:h-11 w-auto object-contain rounded-full shadow-xs shrink-0"
            />
            {/* Wordmark hidden on very small screens so Dashboard / Sign In stays readable */}
            <div className="hidden sm:flex flex-col text-left min-w-0 overflow-hidden">
              <span className="font-outfit font-black text-sm sm:text-base md:text-lg tracking-tight text-slate-900 leading-none group-hover:text-[#3498db] transition-colors truncate">
                DATA <span className="text-[#3498db]">KNOWLEDGE</span>
              </span>
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-tight truncate">
                Classes & Training
              </span>
            </div>
          </Link>

          <div
            ref={linksWrapRef}
            onMouseLeave={handleLeave}
            className="hidden xl:flex items-center gap-2 relative px-1 py-1"
          >
            {/* Liquid Active Pill Indicator strictly scoped to nav links */}
            <div
              ref={pillRef}
              className="absolute top-1/2 -translate-y-1/2 h-9 bg-[#3498db]/15 border border-[#3498db]/30 rounded-full pointer-events-none transition-all duration-300 z-0 opacity-0 shadow-xs"
            />

            {navLinks.map((link) => (
              <NavLink
                key={link.key}
                to={link.path}
                onMouseEnter={handleHover}
                className={({ isActive }) =>
                  `nav-link-item group px-5 py-2 rounded-full font-inter text-[10px] font-bold uppercase transition-all duration-300 tracking-[0.2em] relative z-10 ${isActive ? 'text-[#1f6696] font-black' : 'text-slate-700 hover:text-[#3498db]'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </div>

          <div ref={buttonsWrapRef} className="flex items-center gap-1.5 sm:gap-3 shrink-0">

            <Link
              to={token ? '/dashboard' : '/login'}
              className="relative group bg-[#3498db] text-white font-bold h-10 px-3.5 sm:px-6 rounded-full font-inter text-xs sm:text-[10px] sm:uppercase tracking-normal sm:tracking-[0.2em] overflow-hidden transition-all duration-300 hover:bg-[#2980b9] hover:scale-[1.05] active:scale-95 shadow-md shadow-[#3498db]/30 flex items-center justify-center gap-1.5 shrink-0 max-w-[46vw] sm:max-w-none"
            >
              <svg
                className="w-4 h-4 shrink-0 relative z-10 opacity-95"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                aria-hidden="true"
              >
                {token ? (
                  <>
                    <rect x="3" y="3" width="7" height="9" rx="1" />
                    <rect x="14" y="3" width="7" height="5" rx="1" />
                    <rect x="14" y="12" width="7" height="9" rx="1" />
                    <rect x="3" y="16" width="7" height="5" rx="1" />
                  </>
                ) : (
                  <>
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="10 17 15 12 10 7" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="15" y1="12" x2="3" y2="12" strokeLinecap="round" strokeLinejoin="round" />
                  </>
                )}
              </svg>
              <span className="relative z-10 truncate">{token ? t('dashboard') : t('signIn')}</span>
              <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out skew-x-12" />
            </Link>

            <button
              onClick={toggleMenu}
              aria-label="Open menu"
              className="xl:hidden w-10 h-10 shrink-0 rounded-full bg-slate-100 border border-slate-200 flex flex-col items-center justify-center gap-[5px] relative z-[130] group hover:bg-[#3498db]/15 hover:border-[#3498db]/40 transition-colors"
            >
              <span ref={line1Ref} className="w-4 h-[2px] bg-slate-800 transition-colors group-hover:bg-[#3498db]" />
              <span ref={line2Ref} className="w-5 h-[2px] bg-slate-800 transition-colors group-hover:bg-[#3498db]" />
              <span ref={line3Ref} className="w-4 h-[2px] bg-slate-800 transition-colors group-hover:bg-[#3498db]" />
            </button>
          </div>
        </div>
      </nav>

      {/* Multilayered Cascading Menu Overlay */}
      <div
        ref={menuRef}
        className="fixed inset-0 z-[110] h-[100dvh] overflow-hidden opacity-0 invisible"
      >
        <div ref={shutter1Ref} className="absolute inset-0 bg-slate-50 translate-x-full" />
        <div ref={shutter2Ref} className="absolute inset-0 bg-[#3498db]/10 translate-x-full border-r border-[#3498db]/20 backdrop-blur-xl" />
        <div ref={shutter3Ref} className="absolute inset-0 bg-white translate-x-full overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] [background-size:200px_200px]" />

          {/* Internal Menu Header */}
          <header className="menu-header absolute top-0 left-0 w-full px-8 md:px-12 py-8 md:py-10 flex items-center justify-between z-50">
            <Link to="/" onClick={toggleMenu} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img src="/data_knowlege/logo/logo.png" alt="Data Knowledge Logo" className="h-10 md:h-12 w-auto object-contain rounded-full shadow-xs" />
              <div className="flex flex-col text-left">
                <span className="font-outfit font-black text-lg text-slate-900 leading-none">
                  DATA <span className="text-[#3498db]">KNOWLEDGE</span>
                </span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  Classes & Training
                </span>
              </div>
            </Link>

            <button
              onClick={toggleMenu}
              className="group w-12 h-12 md:w-14 md:h-14 flex items-center justify-center relative hover:scale-110 active:scale-90 transition-transform"
            >
              <div className="absolute inset-0 bg-slate-100 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 ease-expo" />
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="relative transition-transform duration-700 group-hover:rotate-180">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-normal" />
              </svg>
            </button>
          </header>

          <div className="relative z-10 flex flex-col items-center justify-center h-full gap-5 sm:gap-7 md:gap-9 px-6 sm:px-8 text-center pt-24 sm:pt-28 pb-10 overflow-y-auto">
            <div className="flex flex-col items-center gap-3 sm:gap-4 md:gap-5">
              {navLinks.map((link) => (
                <NavLink
                  key={link.key}
                  to={link.path}
                  onClick={toggleMenu}
                  className={({ isActive }) =>
                    `menu-item font-inter text-2xl sm:text-3xl md:text-4xl font-extralight transition-all duration-300 block ${isActive ? 'text-[#3498db] italic font-medium' : 'text-slate-800 opacity-60 hover:text-[#3498db] hover:opacity-100 hover:tracking-wide'
                    }`
                  }
                >
                  <RollingText text={link.name} className="h-7 sm:h-8 md:h-10" />
                </NavLink>
              ))}
            </div>

            <div className="menu-item flex flex-col items-center gap-12 pt-4">

              <div className="flex flex-col gap-8 items-center w-full px-4">
                <div className="flex gap-6 items-center justify-center">
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.url}
                      className="group relative p-2"
                      aria-label={social.name}
                      onClick={toggleMenu}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-slate-500 hover:text-accent transition-all duration-300 hover:scale-110"
                      >
                        {social.isInsta ? (
                          <>
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                            <path d={social.icon} />
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                          </>
                        ) : (
                          <path d={social.icon} />
                        )}
                      </svg>
                    </a>
                  ))}
                </div>
                <div className="flex flex-col gap-2 items-center text-center w-full">
                  <p className="font-jetbrains text-[9px] tracking-[0.3em] sm:tracking-[0.6em] text-slate-500 uppercase whitespace-normal">Practical & Industry-Focused Training</p>
                  <p className="font-jetbrains text-[8px] tracking-[0.1em] sm:tracking-[0.2em] text-slate-400 uppercase whitespace-normal">© 2026 Data Knowledge</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Navbar
