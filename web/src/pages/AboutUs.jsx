import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAboutSnapshot, DEFAULT_ABOUT_US } from '../redux/slices/aboutSnapshotSlice';

import { getApiBaseUrl } from '../utils/apiConfig.js';
gsap.registerPlugin(ScrollTrigger);

const BASE_URL = getApiBaseUrl();

const resolveImage = (src, fallback) => {
  const value = src || fallback;
  if (!value) return fallback;
  if (value.startsWith('http') || value.startsWith('/')) return value;
  return `${BASE_URL}/${value}`;
};

const Icon = ({ name, size = 22 }) => {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  switch (name) {
    case 'users':
      return (
        <svg {...common}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'monitor':
      return (
        <svg {...common}>
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      );
    case 'globe':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
    case 'star':
      return (
        <svg {...common}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case 'bars':
      return (
        <svg {...common}>
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    case 'dashboard':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      );
    case 'python':
      return (
        <svg {...common}>
          <path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M15 10v11M12 2l10 8H2l10-8z" />
        </svg>
      );
    case 'excel':
      return (
        <svg {...common}>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
    case 'ai':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <path d="m4.93 4.93 4.24 4.24M14.83 9.17l4.24-4.24M14.83 14.83l4.24 4.24M4.93 19.07l4.24-4.24" />
        </svg>
      );
    case 'trending':
      return (
        <svg {...common}>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
    case 'activity':
    default:
      return (
        <svg {...common}>
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      );
  }
};

const VALUE_BADGE_COLORS = [
  { bg: 'bg-blue-100', text: 'text-blue-700' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  { bg: 'bg-cyan-100', text: 'text-cyan-800' },
];

const AboutUs = () => {
  const dispatch = useDispatch();
  const containerRef = useRef(null);
  const { data: aboutSnapshot } = useSelector((state) => state.aboutSnapshot);

  useEffect(() => {
    dispatch(fetchAboutSnapshot());
  }, [dispatch]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero entrance
      gsap.fromTo('.hero-animate',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' }
      );

      // Section scroll animations
      gsap.utils.toArray('.scroll-section').forEach(section => {
        gsap.fromTo(section,
          { opacity: 0, y: 35 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 85%',
            }
          }
        );
      });
    }, containerRef);
    return () => ctx.revert();
  }, [aboutSnapshot]);

  const aboutUs = { ...DEFAULT_ABOUT_US, ...(aboutSnapshot?.aboutUs || {}) };
  const hero = { ...DEFAULT_ABOUT_US.hero, ...(aboutUs.hero || {}) };
  const philosophy = { ...DEFAULT_ABOUT_US.philosophy, ...(aboutUs.philosophy || {}) };
  const vision = { ...DEFAULT_ABOUT_US.vision, ...(aboutUs.vision || {}) };
  const pillars = { ...DEFAULT_ABOUT_US.pillars, ...(aboutUs.pillars || {}) };
  const tools = { ...DEFAULT_ABOUT_US.tools, ...(aboutUs.tools || {}) };
  const cta = { ...DEFAULT_ABOUT_US.cta, ...(aboutUs.cta || {}) };

  const heroStats = hero.stats?.length ? hero.stats : DEFAULT_ABOUT_US.hero.stats;
  const philosophyParagraphs = philosophy.paragraphs?.length
    ? philosophy.paragraphs
    : DEFAULT_ABOUT_US.philosophy.paragraphs;
  const valueBadges = philosophy.valueBadges?.length
    ? philosophy.valueBadges
    : DEFAULT_ABOUT_US.philosophy.valueBadges;
  const pillarItems = pillars.items?.length ? pillars.items : DEFAULT_ABOUT_US.pillars.items;
  const toolItems = tools.items?.length ? tools.items : DEFAULT_ABOUT_US.tools.items;

  const cardImage = resolveImage(philosophy.cardImage, DEFAULT_ABOUT_US.philosophy.cardImage);

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-50 text-slate-800 overflow-x-hidden pt-36 md:pt-44 pb-20">

      {/* Background Subtle Gradient Accents */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-blue-100/60 blur-[130px] rounded-full" />
        <div className="absolute top-[40%] right-[-100px] w-[500px] h-[500px] bg-amber-50/70 blur-[140px] rounded-full" />
        <div className="absolute bottom-[20%] left-[-100px] w-[500px] h-[500px] bg-slate-200/50 blur-[140px] rounded-full" />
      </div>

      {/* 1. HERO SECTION */}
      <section className="relative px-6 py-8 md:py-16 max-w-7xl mx-auto flex flex-col items-center text-center">

        {/* Eyebrow Badge */}
        <div className="hero-animate inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200/80 text-blue-900 text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span>{hero.badgeText}</span>
        </div>

        <h1 className="hero-animate text-[clamp(2.2rem,5vw,4.5rem)] font-black text-slate-900 leading-[1.12] tracking-tight mb-6 max-w-5xl">
          {hero.titleLine1} <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900">
            {hero.titleLine2}
          </span>
        </h1>

        <p className="hero-animate text-base md:text-xl text-slate-600 max-w-4xl leading-relaxed font-normal mb-12">
          {hero.description}
        </p>

        {/* Stat / Highlight Cards */}
        <div className="hero-animate grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full max-w-5xl">
          {heroStats.map((stat, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md hover:border-blue-400 transition-all duration-300 min-w-0"
            >
              <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1a5276] mb-1 font-inter truncate w-full">
                {stat.value}
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider font-jetbrains truncate w-full">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 2. INSTITUTIONAL OVERVIEW & FOUNDATION */}
      <section className="scroll-section px-6 py-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center bg-white border border-slate-200/90 rounded-3xl p-8 md:p-12 shadow-md relative overflow-hidden">

          {/* Left Column: Comprehensive Story */}
          <div className="lg:col-span-7 flex flex-col min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold uppercase tracking-widest mb-5 w-fit font-jetbrains">
              {philosophy.badgeText}
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-6">
              {philosophy.headingPrefix} <span className="text-blue-700">{philosophy.headingHighlightOne}</span> {philosophy.headingConnector} <span className="text-indigo-600">{philosophy.headingHighlightTwo}</span>.
            </h2>

            <div className="space-y-4 text-sm md:text-base text-slate-600 leading-relaxed font-normal">
              {philosophyParagraphs.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>

          {/* Right Column: Key Value Badges Card */}
          <div className="lg:col-span-5 flex flex-col gap-4 min-w-0">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 md:p-8 flex flex-col justify-between">

              <div className="flex items-center gap-3.5 mb-6 pb-6 border-b border-slate-200">
                <img
                  src={cardImage}
                  alt={philosophy.cardImageAlt}
                  className="h-14 w-auto object-contain rounded-xl bg-white p-1.5 border border-slate-200 shadow-sm flex-shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="text-base md:text-lg font-bold text-slate-900 font-inter truncate">{philosophy.cardTitle}</h3>
                  <p className="text-[11px] font-semibold text-blue-700 tracking-wider uppercase truncate">{philosophy.cardSubtitle}</p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs sm:text-sm text-slate-700">
                {valueBadges.map((badge, i) => {
                  const color = VALUE_BADGE_COLORS[i % VALUE_BADGE_COLORS.length];
                  return (
                    <div key={i} className="p-3.5 rounded-xl bg-white border border-slate-200/80 flex items-start gap-3 shadow-xs">
                      <div className={`w-7 h-7 rounded-lg ${color.bg} ${color.text} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{badge.title}</h4>
                        <p className="text-slate-500 text-[11px] sm:text-xs mt-0.5">{badge.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 3. OUR VISION SECTION */}
      <section className="scroll-section px-6 py-8 max-w-7xl mx-auto">
        <div className="relative rounded-3xl bg-white border-2 border-blue-100 p-8 md:p-12 shadow-md overflow-hidden">

          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shadow-xs flex-shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="2" />
                <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
              </svg>
            </div>
            <div>
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-[0.2em] font-jetbrains">{vision.badgeText}</span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">{vision.heading}</h2>
            </div>
          </div>

          <div className="bg-blue-50/80 border-l-4 border-blue-700 p-6 md:p-8 rounded-r-2xl">
            <blockquote className="text-base sm:text-lg md:text-xl text-slate-800 font-medium leading-relaxed">
              "{vision.quote}"
            </blockquote>
          </div>

        </div>
      </section>

      {/* 4. OUR MISSION & STRATEGIC PILLARS */}
      <section className="scroll-section px-6 py-12 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold uppercase tracking-widest mb-3 font-jetbrains">
            {pillars.badgeText}
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">{pillars.heading}</h2>
          <p className="text-sm md:text-base text-slate-600 leading-relaxed font-normal">
            {pillars.description}
          </p>
        </div>

        {/* Mission Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillarItems.map((pillar, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200/90 rounded-2xl p-6 md:p-7 flex flex-col justify-between hover:border-blue-400 hover:shadow-md transition-all duration-300 shadow-xs min-w-0"
            >
              <div className="min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center flex-shrink-0">
                    <Icon name={pillar.icon} size={22} />
                  </div>
                  <span className="font-jetbrains text-xs font-bold text-slate-400">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>

                <div className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-3">
                  {pillar.badge}
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2.5 leading-snug">
                  {pillar.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed break-words">
                  {pillar.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. TOOLS & TECHNOLOGIES */}
      <section className="scroll-section px-6 py-12 max-w-7xl mx-auto">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 md:p-12 shadow-md">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">{tools.heading}</h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              {tools.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {toolItems.map((sec, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-4 hover:border-blue-300 transition-colors min-w-0">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-blue-700 flex-shrink-0 shadow-xs">
                  <Icon name={sec.icon} size={20} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base truncate">{sec.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed break-words">{sec.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION / GET IN TOUCH */}
      <section className="scroll-section px-6 py-8 max-w-7xl mx-auto text-center">
        <div className="rounded-3xl bg-gradient-to-br from-[#1a5276] via-[#1f6696] to-[#154360] border border-[#3498db]/30 text-white p-8 md:p-14 flex flex-col items-center justify-center relative overflow-hidden shadow-xl">

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-4 max-w-2xl leading-tight">
            {cta.heading}
          </h2>

          <p className="text-sky-100 text-sm sm:text-base max-w-2xl mb-8 leading-relaxed font-normal">
            {cta.description}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5">
            {cta.primaryButtonText && (
              <Link
                to={cta.primaryButtonLink}
                className="px-6 py-3.5 rounded-full bg-white text-[#1a5276] font-bold uppercase tracking-wider text-xs hover:bg-slate-100 transition-all shadow-md hover:scale-105 active:scale-95"
              >
                {cta.primaryButtonText}
              </Link>
            )}
            {cta.secondaryButtonText && (
              <Link
                to={cta.secondaryButtonLink}
                className="px-6 py-3.5 rounded-full bg-[#3498db] text-white font-bold uppercase tracking-wider text-xs hover:bg-[#2980b9] transition-all shadow-md shadow-[#3498db]/30 hover:scale-105 active:scale-95 flex items-center gap-1.5"
              >
                <span>{cta.secondaryButtonText}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>

        </div>
      </section>

    </div>
  );
};

export default AboutUs;
