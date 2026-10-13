import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/all'
import comparisonImg from '../assets/images/comparision_img.webp'
import sanitizeDisplay from '../utils/textSanitize'
import LogoMarquee from './LogoMarquee'
import { useLanguage } from '../context/LanguageContext'

gsap.registerPlugin(ScrollTrigger)

const comparison = [
  {
    traditional: "Beginner focus, theory-heavy content",
    our: "100% practical, Real-world campaigns."
  },
  {
    traditional: "Taught by someone who has never run an agency",
    our: "Taught by a 14+ year agency owner with real experience."
  },
  {
    traditional: "Prepares you for jobs and makes you dependent",
    our: "Focus on entrepreneurship and business building."
  },
  {
    traditional: "They focus on specific topic like SEO, FB Ads, Google Ads.",
    our: "Complete agency setup guide covering all aspects with skills."
  },
  {
    traditional: "2 hours 3 day week class",
    our: "Self-paced learning"
  },
  {
    traditional: "No mentorship provided",
    our: "Mentorship Provided"
  }
]

const features = [
  "Train your custom GPT's",
  "Learn client On-boarding and handover.",
  "Learn Project Management and delegation",
  "Hands-on Sales Training",
  "Understand employee profitability and KRA's.",
  "One on One Mentorship"
]

const ComparisonSection = ({ course, section }) => {
  const containerRef = useRef(null)

  // Use section data if provided, otherwise fallback to course data
  const targetSection = section || course?.comparisonSection;
  // Local sanitizer to correct display labels
  const sanitize = (t) => sanitizeDisplay(t);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 0. Solopreneur intro reveal - Snappy & micro-motion (90% lighter)
      gsap.fromTo('.solo-heading',
        { opacity: 0, y: 4 },
        {
          opacity: 1, y: 0, duration: 0.3, ease: 'power3.out', stagger: 0.02,
          scrollTrigger: { trigger: '.solo-heading', start: 'top 96%' }
        }
      )
      gsap.fromTo('.solo-image-wrap',
        { opacity: 0, scale: 0.99, y: 4 },
        {
          opacity: 1, scale: 1, y: 0, duration: 0.3, ease: 'power3.out',
          scrollTrigger: { trigger: '.solo-image-wrap', start: 'top 98%' }
        }
      )

      // 1. Comparison Rows reveal (90% lighter: x: 5px, duration 0.25s)
      gsap.utils.toArray('.comparison-row').forEach((row, i) => {
        gsap.fromTo(row,
          { opacity: 0, x: i % 2 === 0 ? -5 : 5 },
          {
            opacity: 1, x: 0, duration: 0.25, ease: 'power3.out',
            scrollTrigger: {
              trigger: row,
              start: 'top 96%',
            }
          }
        )
      })

      // 2. Feature Cards reveal (90% lighter: y: 4px, duration 0.25s, stagger 0.02s)
      gsap.fromTo('.feature-card',
        { opacity: 0, y: 4, scale: 0.99 },
        {
          opacity: 1, y: 0, scale: 1, duration: 0.25, ease: 'power3.out', stagger: 0.02,
          scrollTrigger: {
            trigger: '.feature-grid',
            start: 'top 96%',
          }
        }
      )

      // 3. CTA reveal (90% lighter: y: 4px, duration 0.3s)
      gsap.fromTo('.cta-reveal',
        { opacity: 0, y: 4 },
        {
          opacity: 1, y: 0, duration: 0.3, ease: 'power3.out',
          scrollTrigger: {
            trigger: '.cta-reveal',
            start: 'top 98%',
          }
        }
      )
    }, containerRef)

    return () => ctx.revert()
  }, [])

  // Use API comparison points or fallback to default
  const apiComparison = (targetSection?.leftPoints?.map((trad, i) => ({
    traditional: trad,
    our: targetSection.rightPoints[i] || ""
  })) || [
      { traditional: "Beginner focus, theory-heavy content", our: "100% practical, Real-world campaigns." },
      { traditional: "Taught by someone who has never run an agency", our: "Taught by a 14+ year agency owner with real experience." },
      { traditional: "Prepares you for jobs and makes you dependent", our: "Focus on entrepreneurship and business building." },
      { traditional: "They focus on specific topic like SEO, FB Ads, Google Ads.", our: "Complete agency setup guide covering all aspects with skills." },
      { traditional: "2 hours 3 day week class", our: "Self-paced learning" },
      { traditional: "No mentorship provided", our: "Mentorship Provided" }
    ]).slice(0, 5);

  const manifestoPointers = targetSection?.content?.blocks?.map(block => 
    sanitizeDisplay(block.data?.text || '').replace(/&nbsp;/g, ' ')
  ).filter(t => t && t.trim() !== '') || [];

  const apiFeatures = (manifestoPointers.length > 0 ? manifestoPointers : (course?.benefitsSection?.points || [
    "Train your custom GPT's",
    "Learn client On-boarding and handover.",
    "Learn Project Management and delegation",
    "Hands-on Sales Training",
    "Understand employee profitability and KRA's.",
    "One on One Mentorship"
  ])).slice(0, 6);



  return (
    <section ref={containerRef} className="max-w-7xl mx-auto mb-24 px-4 md:px-0">

      {/* SOLOPRENEUR INTRO */}
      <div className="mb-32 text-center space-y-10">
        <div className="space-y-6">
          <h2 className="solo-heading font-inter mb-2 text-[clamp(2rem,6vw,5.5rem)] text-normal font-extralight leading-tight">
            What is a <span className="text-accent underline-lime">{sanitize(course?.title) || 'Solopreneur'}?</span>
          </h2>
          <p className="solo-heading font-montserrat pb-6 text-accent text-[14px] md:text-xs text-white/80 max-w-md mx-auto leading-[2.2] tracking-widest uppercase">
            {sanitizeDisplay(targetSection?.subtitle || course.subtitle || '')}
          </p>

          {targetSection?.description?.blocks ? (
            <div className="solo-heading font-jetbrains text-xs md:text-sm text-normal/70 max-w-4xl mx-auto leading-[2] tracking-wide space-y-4">
              {targetSection.description.blocks.map((block, bi) => (
                <p key={bi}>{sanitizeDisplay(block.data?.text || '').replace(/&nbsp;/g, ' ')}</p>
              ))}
            </div>
          ) : (
            <div className="solo-heading font-jetbrains text-xs md:text-sm text-normal/70 max-w-4xl mx-auto leading-[2] tracking-wide">
              {sanitizeDisplay(course.comparisonText || "Use AI, Freelancers and tools to automate high margin agency business without pressure of hiring. This offers flexible hours and allows you to work from anywhere.")}
            </div>
          )}
        </div>

        {/* Image */}
        <div className="solo-image-wrap relative group overflow-hidden max-w-2xl mx-auto shadow-2xl">
          {/* Decorative glows */}
          <div className="absolute -inset-6 bg-accent/5 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-dark/20 z-10 pointer-events-none" />

          {/* Decorative corner markers */}
          <div className="absolute top-4 left-4 z-20 w-8 h-8 border-t-2 border-l-2 border-accent/40 opacity-0 group-hover:opacity-100 transition-all duration-500" />
          <div className="absolute top-4 right-4 z-20 w-8 h-8 border-t-2 border-r-2 border-accent/40 opacity-0 group-hover:opacity-100 transition-all duration-500" />
          <div className="absolute bottom-4 left-4 z-20 w-8 h-8 border-b-2 border-l-2 border-accent/40 opacity-0 group-hover:opacity-100 transition-all duration-500" />
          <div className="absolute bottom-4 right-4 z-20 w-8 h-8 border-b-2 border-r-2 border-accent/40 opacity-0 group-hover:opacity-100 transition-all duration-500" />

          {/* LIVE badge */}
          <div className="absolute top-6 left-6 z-20 flex items-center gap-2 bg-dark/80 backdrop-blur-sm px-4 py-2 border border-white/10">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <span className="font-jetbrains text-[9px] text-normal tracking-[0.4em] uppercase">LIVE</span>
          </div>

            <img
              src={(() => {
                  const img = course.coverImage;
                  if (!img) return comparisonImg;
                  if (img.startsWith('http')) return img;
                  const rawBase = import.meta.env.VITE_IMAGE_URL || import.meta.env.VITE_BASE_URL || import.meta.env.VITE_API_BASE || 'https://api.dataknowledge.in';
                  const baseUrl = rawBase.replace(/\/api\/v1\/?$/, '');
                  return `${baseUrl}${img.startsWith('/') ? '' : '/'}${img}`;
              })()} 
              alt={sanitize(course.title)}
            className="w-full object-cover border border-white/5 group-hover:border-accent/20 transition-all duration-700 group-hover:scale-[1.01]"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-8 mb-20 opacity-80">
        <div className="flex-1 h-[1px] bg-white" />
        <span className="font-jetbrains text-[8px] tracking-[0.6em] uppercase shrink-0">Program Comparison / Matrix</span>
        <div className="flex-1 h-[1px] bg-white" />
      </div>

      {/* COMPARISON HEADER */}
      <div className="grid grid-cols-2 gap-12 lg:gap-16 md:mb-16 text-center border-b border-white/5 pb-10">
        <div className="space-y-1">
          <span className="font-jetbrains text-[9px] text-white/80 tracking-[0.4em] uppercase">Status / Outdated</span>
          <h3 className="font-inter text-2xl md:text-3xl lg:text-5xl text-normal/80 font-extralight tracking-tight">
            {sanitizeDisplay(course.comparisonSection?.leftTitle || "Traditional Program")}
          </h3>
        </div>
        <div className="space-y-1">
          <span className="font-jetbrains text-[9px] text-accent tracking-[0.4em] uppercase font-bold">Status / Optimal</span>
          <h3 className="font-inter text-2xl md:text-3xl lg:text-5xl text-accent font-extralight tracking-tight">
            {sanitizeDisplay(course.comparisonSection?.rightTitle || "Our Program")}
          </h3>
        </div>
      </div>

      {/* COMPARISON ROWS */}
      <div className="space-y-4 md:space-y-0">
        {apiComparison.map((item, i) => (
          <div key={i} className="comparison-row grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-3 py-2 border-b border-white/[0.02] items-center group">
            {/* Traditional Column (Red Accent - Glowing) */}
            <div className="flex items-center gap-4 px-4 md:px-5 lg:px-8 py-4 bg-red-500/[0.3] border-l-2 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.05)] transition-all duration-700">
              <div className="w-9 h-9 rounded-full border border-red-500/60 flex items-center justify-center shrink-0 bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="4"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </div>
              <p className="font-montserrat text-[12px] md:text-[9px] lg:text-xs text-red-400 font-normal tracking-[0.15em] uppercase">{sanitizeDisplay(item.traditional)}</p>
            </div>

            {/* Our Program Column (Vibrant Green - Glowing) */}
            <div className="flex items-center gap-4 px-4 md:px-6 lg:px-12 py-4 bg-accent/[0.2] border-l-2 border-accent shadow-[0_0_30px_rgba(139, 92, 246,0.08)] transition-all duration-700">
              <div className="w-9 h-9 rounded-full border border-accent/60 flex items-center justify-center shrink-0 bg-accent/20 shadow-[0_0_15px_rgba(139, 92, 246,0.5)]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="4"><path d="M20 6L9 17l-5-5" /></svg>
              </div>
              <p className="font-montserrat text-[12px] md:text-[9px] lg:text-xs text-accent font-normal tracking-[0.05em] uppercase">{sanitizeDisplay(item.our)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* LOGO MARQUEE */}
      {/* <div className="mb-24"> */}
        <LogoMarquee />
      {/* </div> */}

      {/* FEATURE GRID */}
      <div className="feature-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
        {apiFeatures.map((feat, i) => (
          <div key={i} className="feature-card border border-white/5 bg-white/[0.01] p-6 md:p-10 backdrop-blur-xl relative group hover:border-accent/40 transition-all duration-700 h-full flex flex-col justify-start min-h-[160px]">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-40 transition-opacity">
              <span className="font-jetbrains text-[40px] font-black text-accent">{String(i + 1).padStart(2, '0')}</span>
            </div>
            <div className="flex items-start gap-5">
              <div className="w-1.5 h-1.5 bg-accent rounded-full mt-2 shrink-0 shadow-[0_0_8px_#8B5CF6]" />
              <span className="font-montserrat text-sm md:text-sm text-white/90 font-medium tracking-wide leading-relaxed">
                {feat}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* BOTTOM CTA */}
      <div className="cta-reveal text-center space-y-8">
        <h4 className="font-inter text-3xl md:text-3xl text-normal font-extralight tracking-tight opacity-60">
          { "Beat the competition with innovative solutions."}
        </h4>

        <div className="flex items-center justify-center gap-8 md:gap-12">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.5" className="opacity-60 hidden md:block"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
          <button 
            onClick={() => document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="group relative bg-accent px-12 md:px-20 py-8 md:py-10 transition-all duration-700 hover:scale-[1.03] active:scale-95 flex flex-col items-center gap-3"
          >
            <span className="relative z-10 font-jetbrains text-dark text-[11px] md:text-[13px] font-black tracking-[0.4em] uppercase">YES, I WANT TO BE CEO OF MY LIFE</span>
          </button>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.5" className="opacity-60 hidden md:block rotate-180"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
        </div>
      </div>

    </section>
  )
}

export default ComparisonSection
