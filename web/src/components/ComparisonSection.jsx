import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/all'
import sanitizeDisplay, { extractEditorBlocks, sanitizeParagraph } from '../utils/textSanitize'
import LogoMarquee from './LogoMarquee'

gsap.registerPlugin(ScrollTrigger)

const ComparisonSection = ({ course = {}, section }) => {
  const containerRef = useRef(null)

  // Use section data if provided, otherwise fallback to course comparisonSection
  const targetSection = section || course?.comparisonSection || {}

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.comp-header-reveal',
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
        '.comp-card-reveal',
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.comp-cards-wrapper', start: 'top 85%' }
        }
      )
    }, containerRef)

    return () => ctx.revert()
  }, [])

  // Clean comparison points
  const leftPoints = (targetSection?.leftPoints && targetSection.leftPoints.length > 0)
    ? targetSection.leftPoints.map(sanitizeParagraph).filter(Boolean)
    : [
        "Heavy focus on theoretical concepts without application",
        "Limited real-world business case studies",
        "Complex explanations that overwhelm beginners",
        "Less emphasis on practical problem-solving",
        "Difficult to connect learning with business decisions"
      ]

  const rightPoints = (targetSection?.rightPoints && targetSection.rightPoints.length > 0)
    ? targetSection.rightPoints.map(sanitizeParagraph).filter(Boolean)
    : [
        "100% practical, easy-to-understand learning methodology",
        "Real-world enterprise datasets and live case studies",
        "Step-by-step guidance tailored for every beginner",
        "Hands-on data interpretation & dashboard building",
        "Actionable insights directly applicable to modern roles"
      ]

  // Description paragraphs from targetSection
  const descriptionParagraphs = extractEditorBlocks(targetSection?.description || targetSection?.content)

  const sectionTitle = sanitizeParagraph(targetSection?.title) || "Traditional Program vs Our Data Knowledge Program"
  const leftTitle = sanitizeParagraph(targetSection?.leftTitle) || "Traditional Program"
  const rightTitle = sanitizeParagraph(targetSection?.rightTitle) || "Our Program"

  return (
    <section ref={containerRef} className="max-w-7xl mx-auto py-12 md:py-20 px-4 sm:px-6 md:px-0">
      
      {/* SECTION HEADER */}
      <div className="comp-header-reveal text-center max-w-3xl mx-auto mb-12 md:mb-16 space-y-3.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/70 text-[#3498db] text-xs font-semibold tracking-wide uppercase">
          <span className="w-2 h-2 rounded-full bg-[#3498db] animate-pulse" />
          <span>Curriculum Comparison</span>
        </div>

        <h2 className="font-inter text-3xl sm:text-4xl lg:text-[2.6rem] font-bold text-slate-900 tracking-tight leading-tight">
          {String(sectionTitle || 'Program Comparison').split(' ').map((word, i, arr) => (
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

        {targetSection?.subtitle && (
          <p className="text-sm sm:text-base text-slate-600 font-medium">
            {sanitizeParagraph(targetSection.subtitle)}
          </p>
        )}

        {(() => {
          if (!descriptionParagraphs || descriptionParagraphs.length === 0) return null
          const introParas = []
          const bulletParas = []
          const outroParas = []
          let reachedBullets = false

          descriptionParagraphs.forEach(p => {
            const isBullet = /^[•\-\*]|\d+\./.test(p.trim())
            if (isBullet) {
              reachedBullets = true
              bulletParas.push(p.replace(/^[•\-\*]\s*|\d+\.\s*/, '').trim())
            } else if (!reachedBullets) {
              introParas.push(p)
            } else {
              outroParas.push(p)
            }
          })

          return (
            <div className="pt-2 space-y-4">
              {introParas.length > 0 && (
                <div className="space-y-2 text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
                  {introParas.map((para, i) => (
                    <p key={i} className="font-medium text-slate-700">{para}</p>
                  ))}
                </div>
              )}

              {bulletParas.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-w-4xl mx-auto my-4 text-left">
                  {bulletParas.map((item, i) => {
                    const colonIdx = item.indexOf(': ')
                    const hasHeading = colonIdx > -1 && colonIdx < 40
                    const heading = hasHeading ? item.slice(0, colonIdx) : ''
                    const body = hasHeading ? item.slice(colonIdx + 2) : item

                    return (
                      <div
                        key={i}
                        className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:border-[#3498db]/40 hover:shadow-md transition-all duration-300"
                      >
                        <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-200/80 text-[#3498db] flex items-center justify-center shrink-0 mt-0.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                          {hasHeading ? (
                            <>
                              <strong className="font-bold text-slate-900 block mb-0.5">{heading}</strong>
                              <span>{body}</span>
                            </>
                          ) : (
                            <span>{item}</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {outroParas.length > 0 && (
                <div className="space-y-1.5 text-slate-600 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto pt-2">
                  {outroParas.map((para, i) => (
                    <p key={i} className="italic text-slate-500">{para}</p>
                  ))}
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {/* COMPARISON CARDS (Side-by-side Grid) */}
      <div className="comp-cards-wrapper grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch mb-16">
        
        {/* LEFT COLUMN: Traditional Program */}
        <div className="comp-card-reveal bg-slate-50/90 border border-slate-200/90 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-sm">
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Status: Outdated</span>
                <h3 className="font-inter text-xl sm:text-2xl font-bold text-slate-700">
                  {leftTitle}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* Traditional Points List */}
            <ul className="space-y-4">
              {leftPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-rose-50 border border-rose-200/80 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                    {sanitizeParagraph(point)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-200/70 text-xs text-slate-400 font-medium text-center">
            Standard theoretical approach without personalized mentorship
          </div>
        </div>

        {/* RIGHT COLUMN: Our Program (Highlight Card) */}
        <div className="comp-card-reveal bg-white border-2 border-[#3498db] rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl shadow-blue-500/10 relative overflow-hidden">
          {/* Top banner tag */}
          <div className="absolute top-0 right-0 bg-[#3498db] text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1 rounded-bl-xl shadow-sm">
            Optimal Choice
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-blue-100">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#3498db] uppercase tracking-wider block">Status: Modern & Recommended</span>
                <h3 className="font-inter text-xl sm:text-2xl font-extrabold text-slate-900">
                  {rightTitle}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#3498db]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* Our Points List */}
            <ul className="space-y-4">
              {rightPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-200 text-[#3498db] flex items-center justify-center shrink-0 mt-0.5">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-xs sm:text-sm text-slate-800 font-semibold leading-relaxed">
                    {sanitizeParagraph(point)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-6 mt-6 border-t border-blue-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1f6696]">
              Hands-on Projects & 1-on-1 Mentorship
            </span>
            <button
              type="button"
              onClick={() => document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-xs font-bold text-[#3498db] hover:text-[#2980b9] flex items-center gap-1 cursor-pointer"
            >
              Enroll Now →
            </button>
          </div>
        </div>

      </div>

      {/* TRUST MARQUEE */}
      <div className="mb-14">
        <LogoMarquee />
      </div>

      {/* BOTTOM CTA BANNER */}
      <div className="comp-card-reveal bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#3498db]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto space-y-5">
          <h3 className="font-inter text-2xl sm:text-3xl font-bold tracking-tight">
            Ready to Build Real-World Data Skills?
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Gain the confidence to solve business problems, analyze insights, and create high-impact reports with structured training.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-[#3498db] hover:bg-[#2980b9] text-white font-bold px-8 py-3.5 rounded-full font-inter text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#3498db]/30 hover:scale-[1.02] active:scale-98 cursor-pointer"
            >
              Explore Plans & Enroll Today
            </button>
          </div>
        </div>
      </div>

    </section>
  )
}

export default ComparisonSection
