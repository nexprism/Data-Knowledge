import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/all'
import sanitizeDisplay, { extractEditorBlocks, sanitizeParagraph } from '../utils/textSanitize'

gsap.registerPlugin(ScrollTrigger)

const SolutionSection = ({ course, section }) => {
  const ref = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.sol-head-reveal',
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: { trigger: ref.current, start: 'top 85%' }
        }
      )

      gsap.utils.toArray('.sol-point-card').forEach((card) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 15 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: 'power3.out',
            scrollTrigger: { trigger: card, start: 'top 92%' }
          }
        )
      })
    }, ref)

    return () => ctx.revert()
  }, [])

  const descriptionBlocks = extractEditorBlocks(section?.content)
  const outcomeDescriptionBlocks = extractEditorBlocks(section?.outcomeDescription)
  const solutionDescriptionBlocks = extractEditorBlocks(section?.solutionDescription)

  const sectionTitle = sanitizeParagraph(section?.title) || "Problems We Solve & Program Outcomes"

  const outcomePoints = (section?.outcomePoints && section.outcomePoints.length > 0)
    ? section.outcomePoints.map(sanitizeParagraph).filter(Boolean)
    : []

  const solutionPoints = (section?.points && section.points.length > 0)
    ? section.points.map(sanitizeParagraph).filter(Boolean)
    : []

  // If section has nothing configured, don't render an empty section
  if (!section?.title && outcomePoints.length === 0 && solutionPoints.length === 0 && descriptionBlocks.length === 0) {
    return null
  }

  return (
    <section ref={ref} className="max-w-7xl mx-auto py-12 md:py-20 px-4 sm:px-6 md:px-0">
      
      {/* SECTION HEADER */}
      <div className="sol-head-reveal text-center max-w-3xl mx-auto mb-14 space-y-3.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/70 text-[#3498db] text-xs font-semibold tracking-wide uppercase">
          <span className="w-2 h-2 rounded-full bg-[#3498db] animate-pulse" />
          <span>Practical Solutions</span>
        </div>

        <h2 className="font-inter text-3xl sm:text-4xl lg:text-[2.6rem] font-bold text-slate-900 tracking-tight leading-tight">
          {String(sectionTitle || "Problems We Solve & Program Outcomes").split(' ').map((word, i, arr) => (
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

        {descriptionBlocks.length > 0 && (
          <div className="space-y-2 text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto pt-1">
            {descriptionBlocks.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        )}
      </div>

      {/* PHASE 1: CHALLENGES / WHAT WE SOLVE */}
      {outcomePoints.length > 0 && (
        <div className="mb-16 space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Phase 1: Challenges</span>
            <h3 className="font-inter text-2xl sm:text-3xl font-bold text-slate-800">
              {sanitizeParagraph(section?.outcomeTitle) || "Problems We Address"}
            </h3>
            {outcomeDescriptionBlocks.length > 0 && (
              <p className="text-slate-500 text-sm max-w-xl mx-auto">
                {outcomeDescriptionBlocks[0]}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
            {outcomePoints.map((point, i) => (
              <div
                key={i}
                className="sol-point-card bg-rose-50/50 border border-rose-200/70 rounded-2xl p-5 flex items-center gap-4 shadow-sm"
              >
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-slate-700 leading-snug">
                  {sanitizeParagraph(point)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PHASE 2: SOLUTIONS / OUTCOMES */}
      {solutionPoints.length > 0 && (
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#3498db]">Phase 2: Solutions</span>
            <h3 className="font-inter text-2xl sm:text-3xl font-bold text-slate-900">
              {sanitizeParagraph(section?.solutionTitle) || "By Program's End, You'll Have"}
            </h3>
            {solutionDescriptionBlocks.length > 0 && (
              <p className="text-slate-500 text-sm max-w-xl mx-auto">
                {solutionDescriptionBlocks[0]}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
            {solutionPoints.map((point, i) => (
              <div
                key={i}
                className="sol-point-card bg-white border border-blue-200/80 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-[#3498db] transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-blue-50 text-[#3498db] flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-slate-800 leading-snug">
                  {sanitizeParagraph(point)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </section>
  )
}

export default SolutionSection
