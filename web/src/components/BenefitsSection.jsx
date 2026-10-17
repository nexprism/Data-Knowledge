import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/all'
import sanitizeDisplay, { extractEditorBlocks, sanitizeParagraph } from '../utils/textSanitize'

gsap.registerPlugin(ScrollTrigger)

const BenefitsSection = ({ course, section }) => {
  const containerRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.benefit-head-reveal',
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: { trigger: containerRef.current, start: 'top 85%' }
        }
      )

      gsap.fromTo(
        '.benefit-card-reveal',
        { y: 25, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.benefit-grid', start: 'top 85%' }
        }
      )
    }, containerRef)

    return () => ctx.revert()
  }, [])

  const rawTitle = section?.title || "Key Benefits & Outcomes"
  const displayTitle = sanitizeParagraph(rawTitle)
  const descriptionParagraphs = extractEditorBlocks(section?.content)

  const points = (section?.points && section.points.length > 0)
    ? section.points.filter(p => Boolean(p && String(p).trim()))
    : [
        "Improve analytical and critical-thinking skills",
        "Understand data patterns, distributions, and trends",
        "Make informed, confident, data-driven decisions",
        "Solve complex business challenges with structured methods"
      ]

  return (
    <section ref={containerRef} className="max-w-7xl mx-auto py-12 md:py-20 px-4 sm:px-6 md:px-0">
      
      {/* SECTION HEADER */}
      <div className="benefit-head-reveal text-center max-w-3xl mx-auto mb-12 md:mb-16 space-y-3.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/70 text-[#3498db] text-xs font-semibold tracking-wide uppercase">
          <span className="w-2 h-2 rounded-full bg-[#3498db] animate-pulse" />
          <span>Program Outcomes</span>
        </div>

        <h2 className="font-inter text-3xl sm:text-4xl lg:text-[2.6rem] font-bold text-slate-900 tracking-tight leading-tight">
          {displayTitle.split(' ').map((word, i, arr) => (
            <React.Fragment key={i}>
              {i >= Math.max(1, arr.length - 2) ? (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3498db] via-blue-600 to-[#1a5276]">
                  {word}{' '}
                </span>
              ) : (
                word + ' '
              )}
            </React.Fragment>
          ))}
        </h2>

        {descriptionParagraphs.length > 0 && (
          <div className="space-y-2 text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto pt-1">
            {descriptionParagraphs.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        )}
      </div>

      {/* BENEFITS CARDS GRID */}
      <div className="benefit-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {points.map((feat, i) => (
          <div
            key={i}
            className="benefit-card-reveal group bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-sm hover:shadow-xl hover:border-[#3498db]/40 transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
          >
            {/* Ambient Corner Accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-bl-full pointer-events-none group-hover:bg-blue-100/50 transition-colors" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 text-[#3498db] flex items-center justify-center shadow-sm">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="font-inter text-2xl font-extrabold text-slate-200 group-hover:text-[#3498db]/30 transition-colors">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>

              <p className="font-inter text-slate-800 font-semibold text-sm sm:text-base leading-snug">
                {sanitizeParagraph(feat)}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-[#3498db]">
              <span>Verified Skill</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        ))}
      </div>

    </section>
  )
}

export default BenefitsSection
