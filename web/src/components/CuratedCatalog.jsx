import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCourses } from '../redux/slices/courseSlice'
import RollingText from './RollingText'
import CourseCard from './CourseCard'
import { getImageBaseUrl } from '../utils/apiConfig'

gsap.registerPlugin(ScrollTrigger)

const CuratedCatalog = () => {
  const dispatch = useDispatch()
  const { courses, loading, error } = useSelector((state) => state.courses)
  const containerRef = useRef(null)
  const gridRef = useRef(null)
  const dropdownRef = useRef(null)
  const [activeFilter, setActiveFilter] = useState('ALL DISCIPLINES')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const disciplineOptions = ['ALL DISCIPLINES', ...new Set(
    (courses || [])
      .map((course) => course.category?.name || course.category)
      .filter(Boolean)
      .map((category) => String(category).toUpperCase())
  )]
  const visibleCourses = activeFilter === 'ALL DISCIPLINES'
    ? courses
    : (courses || []).filter((course) => (
      String(course.category?.name || course.category || '').toUpperCase() === activeFilter
    ))

  useEffect(() => {
    dispatch(fetchCourses())
    const ctx = gsap.context(() => {
      // 1. Entrance Animations
      gsap.from('.catalog-header > *', {
        scrollTrigger: { trigger: '.catalog-header', start: 'top 85%' },
        y: 40, opacity: 0, filter: 'blur(10px)', stagger: 0.2, duration: 1.2, ease: 'power3.out'
      })

      const cards = gsap.utils.toArray('.catalog-card')
      cards.forEach((card, i) => {
        gsap.from(card, {
          scrollTrigger: { trigger: card, start: 'top 90%' },
          y: 60, opacity: 0, filter: 'blur(15px)', duration: 1.5, ease: 'expo.out', delay: (i % 3) * 0.15
        })
      })

    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={containerRef} className="relative w-full py-20 px-4 md:px-12 bg-dark perspective-mesh overflow-x-hidden">
      {/* Header Section */}
      <div className="catalog-header max-w-7xl mx-auto mb-12">
        <h1 className="font-inter text-[clamp(3.5rem,8vw,6rem)] leading-[0.9] text-normal mb-8">
          The Curated Catalog.
        </h1>
        <p className="font-montserrat text-[11px] text-description uppercase tracking-[0.2em] max-w-lg leading-medium mt-6">
          Elevating education through high-fidelity visual narratives and technical mastery. 
          Explore our spectrum of advanced modules.
        </p>
      </div>

      {/* Filter Row - Desktop Layout (Visible md+) */}
      <div className="max-w-7xl mx-auto mb-24 hidden md:block">
        <div className="flex items-center gap-3">
          {disciplineOptions.map((filter) => (
            <div key={filter} className="rolling-target">
              <button 
                onClick={() => setActiveFilter(filter)}
                className={`flex px-6 py-3 font-montserrat text-[11px] font-bold tracking-[0.2em] border transition-all duration-300 ${
                  activeFilter === filter 
                  ? 'bg-accent text-dark border-accent' 
                  : 'text-description border-white/10 hover:border-white/30 hover:text-normal'
                }`}
              >
                <RollingText text={filter} />
              </button>
            </div>
          ))}
          <div className="flex-grow flex justify-end">
             <div className="rolling-target">
               <Link to="/courses" className="flex items-center gap-3 font-montserrat text-[11px] text-description hover:text-accent transition-colors group/more">
                  <RollingText text="Explore more" />
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform duration-500 group-hover/more:translate-x-1">
                    <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
               </Link>
             </div>
          </div>
        </div>
      </div>

      {/* Filter Row - Mobile Layout (Visible <md) */}
      <div className="max-w-7xl mx-auto mb-16 md:hidden relative flex gap-2">
        {/* Left Side: Category Dropdown */}
        <div className="flex-grow">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`w-full h-full flex items-center justify-between px-6 py-4 font-montserrat text-[11px] font-bold tracking-[0.2em] border transition-all duration-300 ${
              isFilterOpen ? 'bg-white/5 border-white/20' : 'bg-transparent border-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
               <span className="text-accent/50 text-[8px] hidden sm:inline">ACTIVE:</span>
               <RollingText text={activeFilter} />
            </div>
            <svg 
              width="10" height="10" viewBox="0 0 24 24" fill="none" 
              className={`transition-transform duration-500 ${isFilterOpen ? 'rotate-180' : ''}`}
              stroke="currentColor"
            >
              <path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Custom Mobile Dropdown */}
          <div 
            ref={dropdownRef}
            className={`absolute top-full left-0 w-[calc(100%-80px)] z-50 bg-[#0A0A0A] border-x border-b border-white/10 overflow-hidden transition-all duration-500 ease-memo origin-top ${
              isFilterOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
            }`}
          >
            <div className="flex flex-col">
              {disciplineOptions.map((filter) => (
                <button 
                  key={filter}
                  onClick={() => {
                    setActiveFilter(filter)
                    setIsFilterOpen(false)
                  }}
                  className={`flex w-full px-8 py-4 font-montserrat text-[11px] font-bold tracking-[0.2em] border-b border-white/5 last:border-none text-left transition-colors ${
                    activeFilter === filter ? 'text-accent bg-white/5' : 'text-description hover:text-normal'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: More Filters Button */}
        <Link 
          to="/courses" 
          className="w-[75px] flex flex-col items-center justify-center gap-2 border border-white/10 font-jetbrains text-[8px] text-description font-bold tracking-[0.1em] hover:bg-white/5 hover:border-accent/40 active:scale-95 transition-all group/mob-more"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-accent transition-transform group-hover/mob-more:translate-x-0.5 group-hover/mob-more:-translate-y-0.5">
            <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="uppercase text-[7px] tracking-widest">Explore</span>
        </Link>
      </div>

      <div ref={gridRef} className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-24">
        {loading ? (
          <div className="col-span-full h-40" />
        ) : error ? (
          <div className="col-span-full text-center py-20 text-red-500/40 font-jetbrains uppercase text-[10px] tracking-widest">Archive Offline</div>
        ) : visibleCourses && visibleCourses.length > 0 ? (
          visibleCourses.slice(0, 6).map((item) => (
            <CourseCard 
              key={item._id || item.id} 
              item={{
                id: item._id || item.id,
                title: item.title,
                category: item.category?.name || item.category || 'COURSE',
                description: item.shortDescription || item.description,
                price: item.salePrice ? `₹${item.salePrice}` : item.price ? `₹${item.price}` : 'FREE',
                image: item.thumbnail ? (item.thumbnail.startsWith('http') ? item.thumbnail : `${getImageBaseUrl()}/${item.thumbnail.replace(/^\/+/, '')}`) : '/herocard.png',
                isNew: true,
              }} 
            />
          ))
        ) : (
          <div className="col-span-full text-center py-20 text-description font-montserrat">NO COURSES AVAILABLE</div>
        )}
      </div>
    </section>
  )
}

export default CuratedCatalog
