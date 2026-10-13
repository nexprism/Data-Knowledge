import React, { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import RollingText from './RollingText'
import authorizedFetch from '../utils/apiClient'
import { useLanguage } from '../context/LanguageContext'

const StackingBanners = () => {
  const scrollContainerRef = useRef(null)
  const [featured, setFeatured] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const navigate = useNavigate()
  const { t } = useLanguage()

  const getImageUrl = (thumb) => {
    if (!thumb) return null
    try {
      if (/^https?:\/\//i.test(thumb)) return thumb
      let path = thumb
      if (!path.startsWith('/') && !path.startsWith('uploads/')) {
        path = `uploads/${path}`
      }
      const rawBase = import.meta.env.VITE_BASE_URL || 'https://api.dataknowledge.in'
      const baseUrl = rawBase.replace(/\/api\/v1\/?$/, '')
      return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`
    } catch {
      return null
    }
  }

  const stripHTML = (str) =>
    typeof str === 'string' ? str.replace(/<[^>]*>?/gm, '') : ''

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await authorizedFetch('/banners?isActive=true')
        if (!res.ok) return
        const data = await res.json()
        const raw = data?.data?.banners || data?.data || data?.results || data || []
        if (mounted) setFeatured(raw)
      } catch (e) {
        console.error('Failed to load featured banners', e)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const items = featured.slice(0, 6).map((c) => ({
    id: c._id || c.id,
    title: c.title,
    description: stripHTML(c.description || ''),
    image: getImageUrl(c.image),
    type: c.type,
    referenceId: c.referenceId,
  }))

  // Handle Horizontal Scroll Events & Progress
  const checkScrollState = () => {
    if (!scrollContainerRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    setCanScrollLeft(scrollLeft > 20)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 20)

    // Calculate active slide index
    const cardWidth = clientWidth * 0.7
    const index = Math.round(scrollLeft / cardWidth)
    setActiveIndex(Math.min(Math.max(index, 0), items.length - 1))
  }

  const scrollToSlide = (direction) => {
    if (!scrollContainerRef.current) return
    const container = scrollContainerRef.current
    const scrollAmount = container.clientWidth * 0.65
    container.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    })
  }

  const scrollToIndex = (idx) => {
    if (!scrollContainerRef.current) return
    const container = scrollContainerRef.current
    const cards = container.children
    if (cards[idx]) {
      cards[idx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
    }
  }

  const handleCardClick = (item) => {
    if (item.type === 'course' && item.referenceId) {
      navigate(`/course-detail/${item.referenceId}`)
    } else if (item.type === 'job' && item.referenceId) {
      navigate(`/dashboard/job/${item.referenceId}`)
    } else if (item.type === 'all_courses') {
      navigate('/courses')
    } else if (item.type === 'all_jobs') {
      navigate('/dashboard/job-posts')
    } else {
      navigate('/')
    }
  }

  return (
    <section className="relative w-full py-16 md:py-24 bg-slate-50 overflow-hidden">
      
      {/* ── Top Header Bar (Full-Width Container) ── */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 mb-12 md:mb-16">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-slate-200/80 pb-10">
          
          {/* Left Column: Heading & Subtitle */}
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-[2px] bg-amber-400" />
              <span className="font-jetbrains text-xs font-bold text-amber-700 tracking-[0.4em] uppercase">
                {t('selectedForYou')}
              </span>
            </div>

            <h2 className="font-inter text-4xl md:text-6xl text-slate-900 leading-tight tracking-tight">
              {t('selectionTitle')}
            </h2>

            <p className="font-jetbrains text-xs text-slate-600 font-medium tracking-[0.12em] leading-relaxed uppercase pt-1">
              {t('selectionSub')}
            </p>
          </div>

          {/* Right Column: Interactive Navigation Controls & CTA */}
          <div className="flex items-center gap-6 shrink-0 self-start lg:self-end">
            
            {/* Slide Index Badge & Arrows */}
            <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-full px-5 py-2.5 shadow-sm">
              <span className="font-jetbrains text-xs font-bold text-slate-700 tracking-wider">
                0{activeIndex + 1} <span className="text-slate-300">/</span> 0{items.length || 1}
              </span>
              <div className="h-4 w-[1px] bg-slate-200" />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => scrollToSlide('left')}
                  disabled={!canScrollLeft}
                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-accent hover:border-amber-400 hover:text-slate-950 disabled:opacity-30 disabled:pointer-events-none transition-all"
                  aria-label="Previous Slide"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <button
                  onClick={() => scrollToSlide('right')}
                  disabled={!canScrollRight}
                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-accent hover:border-amber-400 hover:text-slate-950 disabled:opacity-30 disabled:pointer-events-none transition-all"
                  aria-label="Next Slide"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </div>
            </div>

            {/* Explore All Button */}
            <button
              onClick={() => navigate('/courses')}
              className="px-8 py-4 rounded-full font-montserrat text-xs font-black tracking-[0.25em] bg-accent text-slate-950 hover:scale-105 active:scale-95 transition-all shadow-accent-soft shrink-0"
            >
              <RollingText text={t('exploreAll')} className="relative z-10" />
            </button>
          </div>

        </div>
      </div>

      {/* ── Below Full-Width Banner Cards Slider ── */}
      <div className="max-w-[100vw] overflow-hidden pl-6 md:pl-12 lg:pl-24 pr-6">
        <div
          ref={scrollContainerRef}
          onScroll={checkScrollState}
          className="flex gap-6 md:gap-8 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-8 pt-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((banner, i) => (
            <motion.div
              key={banner.id}
              onClick={() => handleCardClick(banner)}
              whileHover={{ y: -6 }}
              className={`snap-start shrink-0 w-[88vw] sm:w-[500px] md:w-[650px] lg:w-[740px] h-[50vh] md:h-[58vh] relative rounded-[2.5rem] overflow-hidden border transition-all duration-500 cursor-pointer group bg-white shadow-xl ${
                activeIndex === i ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-2xl' : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              {/* Top Category Badge */}
              <div className="absolute top-6 left-6 z-20 px-4 py-2 bg-white/90 backdrop-blur-md rounded-full border border-slate-200/80 shadow-md flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="font-jetbrains text-[10px] font-bold tracking-widest text-slate-900 uppercase">
                  {banner.type === 'job' || banner.type === 'all_jobs' ? t('careerSpotlight') : t('curatedModule')}
                </span>
              </div>

              {/* Top Slide Number Badge */}
              <div className="absolute top-6 right-6 z-20 px-4 py-1.5 bg-slate-950/80 backdrop-blur-md rounded-full border border-amber-400/40 text-amber-400 font-jetbrains text-xs font-bold tracking-widest shadow-md">
                0{i + 1}
              </div>

              {/* Background Image with Zoom Effect */}
              <div className="relative w-full h-full overflow-hidden">
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />

                {/* Dark Gradient Overlay for optimal contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent pointer-events-none" />
              </div>

              {/* Bottom Details & CTA Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6 z-20">
                <div className="space-y-2 max-w-lg">
                  {banner.title && (
                    <h3 className="font-inter text-2xl md:text-4xl text-white font-extralight tracking-tight leading-tight group-hover:text-amber-300 transition-colors">
                      {banner.title}
                    </h3>
                  )}
                  {banner.description && (
                    <p className="font-jetbrains text-xs text-slate-300 font-medium line-clamp-2 leading-relaxed">
                      {banner.description}
                    </p>
                  )}
                </div>

                <button
                  className="px-8 py-4 rounded-full font-montserrat text-xs font-black tracking-[0.25em] transition-all hover:scale-105 active:scale-95 bg-accent text-slate-950 w-fit shadow-accent-soft shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCardClick(banner)
                  }}
                >
                  <RollingText
                    text={
                      banner.type === 'course' || banner.type === 'all_courses'
                        ? t('startModule')
                        : banner.type === 'job' || banner.type === 'all_jobs'
                        ? t('viewJob')
                        : t('learnMore')
                    }
                    className="relative z-10"
                  />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Bottom Interactive Progress Bar ── */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 mt-6 flex items-center justify-center gap-3">
        {items.map((_, idx) => (
          <button
            key={idx}
            onClick={() => scrollToIndex(idx)}
            className={`h-2 rounded-full transition-all duration-500 ${
              activeIndex === idx
                ? 'w-10 bg-accent shadow-sm'
                : 'w-2 bg-slate-300 hover:bg-slate-400'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

    </section>
  )
}

export default StackingBanners