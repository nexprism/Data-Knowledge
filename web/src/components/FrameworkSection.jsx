import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/all'
import sanitizeDisplay, { extractEditorBlocks, sanitizeParagraph } from '../utils/textSanitize'

gsap.registerPlugin(ScrollTrigger)

const FrameworkSection = ({ course, section }) => {
  const containerRef = useRef(null)

  // Extract data from EditorJS blocks
  const processContent = (content) => {
    if (!content) return { intro: [], phases: [] }
    let data = content
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
      } catch {
        return { intro: [sanitizeParagraph(data)], phases: [] }
      }
    }

    if (!data.blocks || !Array.isArray(data.blocks)) return { intro: [], phases: [] }

    const intro = []
    const phases = []
    let currentPhase = null
    let foundFirstHeader = false

    data.blocks.forEach(block => {
      if (block.type === 'header') {
        foundFirstHeader = true
        if (currentPhase) phases.push(currentPhase)
        currentPhase = { title: block.data?.text || '', description: '' }
      } else if (block.type === 'paragraph') {
        const text = sanitizeParagraph(block.data?.text || '')
        if (!foundFirstHeader) {
          if (text) intro.push(text)
        } else if (currentPhase) {
          currentPhase.description += (currentPhase.description ? ' ' : '') + text
        }
      } else if (block.type === 'list' || Array.isArray(block.data?.items)) {
        const items = Array.isArray(block.data?.items) ? block.data.items : []
        const listTexts = items.map(it => {
          const raw = typeof it === 'object' && it !== null ? (it.content ?? it.text ?? it) : it
          return sanitizeParagraph(raw)
        }).filter(Boolean)

        listTexts.forEach(itemText => {
          if (!foundFirstHeader) {
            intro.push('• ' + itemText)
          } else if (currentPhase) {
            currentPhase.description += (currentPhase.description ? ' • ' : '• ') + itemText
          }
        })
      }
    })
    if (currentPhase) phases.push(currentPhase)
    return { intro, phases }
  }

  const { intro, phases } = processContent(section?.description || section?.content)

  // Default phases if none were configured via headers
  const displayPhases = phases.length > 0 ? phases : [
    {
      title: "Foundational Concepts & Data Literacy",
      description: "Understand data structures, collection methodologies, and core statistical foundations required for analytical thinking."
    },
    {
      title: "Exploration & Pattern Discovery",
      description: "Learn how to clean, inspect, and evaluate raw datasets to uncover meaningful relationships and trends."
    },
    {
      title: "Actionable Insights & Storytelling",
      description: "Translate complex metrics into clear visualizations, executive dashboards, and strategic business recommendations."
    }
  ]

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.frame-head-reveal',
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: { trigger: containerRef.current, start: 'top 85%' }
        }
      )

      gsap.utils.toArray('.frame-phase-node').forEach((node) => {
        gsap.fromTo(
          node,
          { opacity: 0, y: 25 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power3.out',
            scrollTrigger: { trigger: node, start: 'top 88%' }
          }
        )
      })
    }, containerRef)

    return () => ctx.revert()
  }, [displayPhases])

  const sectionTitle = sanitizeParagraph(section?.title) || "Master Data Knowledge Step by Step"
  const sectionSubtitle = sanitizeParagraph(section?.subtitle) || "A Practical Framework for Understanding and Using Data"

  return (
    <section ref={containerRef} className="max-w-7xl mx-auto py-12 md:py-20 px-4 sm:px-6 md:px-0">
      
      {/* SECTION HEADER */}
      <div className="frame-head-reveal text-center max-w-3xl mx-auto mb-12 md:mb-16 space-y-3.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/70 text-[#3498db] text-xs font-semibold tracking-wide uppercase">
          <span className="w-2 h-2 rounded-full bg-[#3498db] animate-pulse" />
          <span>Learning Roadmap</span>
        </div>

        <h2 className="font-inter text-3xl sm:text-4xl lg:text-[2.6rem] font-bold text-slate-900 tracking-tight leading-tight">
          {String(sectionTitle || "Master Data Knowledge Step by Step").split(' ').map((word, i, arr) => (
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

        {sectionSubtitle && (
          <p className="text-sm sm:text-base text-slate-600 font-medium">
            {sectionSubtitle}
          </p>
        )}

        {intro.length > 0 && (
          <div className="space-y-2 text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto pt-1">
            {intro.map((text, i) => (
              <p key={i}>{sanitizeParagraph(text)}</p>
            ))}
          </div>
        )}
      </div>

      {/* ROADMAP TIMELINE */}
      <div className="relative max-w-4xl mx-auto space-y-8 md:space-y-12">
        {displayPhases.map((phase, index) => (
          <div
            key={index}
            className="frame-phase-node group bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 md:p-10 shadow-md hover:shadow-xl hover:border-[#3498db]/40 transition-all duration-300 relative overflow-hidden"
          >
            {/* Top Accent line on hover */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3498db] to-[#1a5276] opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              {/* Step Number Circle */}
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200/80 text-[#3498db] font-extrabold text-xl flex items-center justify-center shrink-0 shadow-sm group-hover:bg-[#3498db] group-hover:text-white transition-all">
                0{index + 1}
              </div>

              {/* Phase Content */}
              <div className="space-y-2.5 flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                  Phase 0{index + 1}
                </div>
                
                <h3 className="font-inter text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {sanitizeParagraph(phase.title)}
                </h3>

                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  {sanitizeParagraph(phase.description)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

    </section>
  )
}

export default FrameworkSection
