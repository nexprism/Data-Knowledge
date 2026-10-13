import React, { useEffect, useRef, useState, useLayoutEffect } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCourses } from '../redux/slices/courseSlice'
import RollingText from '../components/RollingText'
import CourseCard from '../components/CourseCard'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import { useLanguage } from '../context/LanguageContext'

const DashboardCourses = () => {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const { courses, loading, error } = useSelector((state) => state.courses)
  const containerRef = useRef(null)
  const [activeFilter, setActiveFilter] = useState('ALL COURSES')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedDifficulty, setSelectedDifficulty] = useState('All')
  const [selectedDuration, setSelectedDuration] = useState('All hours')
  const categoryFilters = ['ALL COURSES', ...new Set(
    (courses || [])
      .map((course) => course.category?.name || course.category)
      .filter(Boolean)
      .map((category) => String(category).toUpperCase())
  )]
  const filteredCourses = (courses || []).filter((course) => {
    const category = String(course.category?.name || course.category || '').toUpperCase()
    const level = Array.isArray(course.level) ? course.level : [course.level]
    const duration = Number(course.durationHours ?? course.duration ?? 0)
    const durationMatches = selectedDuration === 'All hours'
      || (selectedDuration === '0-2 hours' && duration <= 2)
      || (selectedDuration === '2-5 hours' && duration > 2 && duration <= 5)
      || (selectedDuration === '5-10 hours' && duration > 5 && duration <= 10)
      || (selectedDuration === '10-20 hours' && duration > 10 && duration <= 20)
      || (selectedDuration === '20+ hours' && duration > 20)
    return (activeFilter === 'ALL COURSES' || category === activeFilter)
      && (selectedDifficulty === 'All' || level.some((value) => String(value).toLowerCase() === selectedDifficulty.toLowerCase()))
      && durationMatches
  })
  const today = new Date().toDateString()
  const newTodayCount = (courses || []).filter((course) => course.createdAt && new Date(course.createdAt).toDateString() === today).length

  useLayoutEffect(() => {
    dispatch(fetchCourses())
    window.scrollTo(0, 0)
    
    const ctx = gsap.context(() => {
      // 1. Hero Entrance
      gsap.fromTo('.courses-hero > *', 
        { y: 60, autoAlpha: 0, filter: 'blur(15px)' },
        { y: 0, autoAlpha: 1, filter: 'blur(0px)', stagger: 0.15, duration: 1.5, ease: 'expo.out' }
      )

      // 2. Filter Row Entrance
      gsap.fromTo('.course-filter-reveal', 
        { y: 30, autoAlpha: 0, filter: 'blur(10px)' },
        { y: 0, autoAlpha: 1, filter: 'blur(0px)', duration: 1, ease: 'power3.out', stagger: 0.08, delay: 0.2 }
      )
      
      // 3. Grid Entrance
      gsap.fromTo('.course-grid > *', 
        { y: 40, autoAlpha: 0, filter: 'blur(10px)' },
        { 
          scrollTrigger: { trigger: '.course-grid', start: 'top 85%' },
          y: 0, autoAlpha: 1, filter: 'blur(0px)', stagger: 0.1, duration: 1.2, ease: 'power3.out' 
        }
      )
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-50 selection:bg-accent/40 selection:text-white pb-16">
      <DashboardHeader />

      <main className="pt-12 pb-12 px-6 md:px-12">
        {/* 1. Page Header */}
        <div className="courses-hero max-w-[1600px] mx-auto mb-12 flex flex-col md:flex-row md:items-end justify-between items-start gap-8">
          <div className="space-y-2">
             <p className="font-jetbrains text-xs text-amber-800 uppercase tracking-[0.4em] font-black">{t('curatedCatalog')}</p>
             <h1 className="font-inter text-4xl md:text-6xl text-slate-900 font-bold tracking-tight leading-none uppercase">
                {t('ourCoursesTitle')}
             </h1>
          </div>
          
          <div className="flex gap-12 items-center self-end md:self-auto pb-2">
             <div className="text-right group relative">
                <p className="font-jetbrains text-xs text-slate-500 uppercase tracking-[0.3em] mb-1 font-bold">{t('availableStat')}</p>
                <p className="font-inter text-4xl text-slate-900 leading-none font-medium tracking-tighter">{courses?.length || 0}</p>
             </div>
             <div className="text-right group relative">
                <p className="font-jetbrains text-xs text-slate-500 uppercase tracking-[0.3em] mb-1 font-bold">{t('newTodayStat')}</p>
                <p className="font-inter text-4xl text-slate-900 leading-none font-medium tracking-tighter">{newTodayCount}</p>
             </div>
          </div>
        </div>

        {/* 2. Tactical Filter Bar */}
        <div className="course-filter-reveal max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center py-4 border-y border-slate-200/80 gap-6 mb-12 opacity-0 invisible">
           <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 overflow-x-auto scrollbar-hide">
              {categoryFilters.map((id) => (
                 <button 
                   key={id}
                   onClick={() => setActiveFilter(id)}
                   className={`font-jetbrains text-xs font-black uppercase tracking-[0.2em] transition-all relative px-5 py-2.5 rounded-xl whitespace-nowrap
                     ${activeFilter === id ? 'text-slate-950 bg-accent shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'}`}
                 >
                    {id === 'ALL COURSES' ? t('allCoursesTab') : id}
                 </button>
              ))}
           </div>
           
           <div className="flex items-center gap-8">
              <span className="font-jetbrains text-xs text-slate-500 uppercase tracking-[0.2em] font-medium">
                 {t('showingCoursesLabel')} {courses?.length || 0}
              </span>
              <button 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`flex items-center gap-3 font-montserrat text-xs text-slate-700 font-bold tracking-[0.15em] transition-colors group/filters ${showAdvanced ? 'text-amber-800' : 'hover:text-amber-800'}`}
              >
                <svg width="18" height="12" viewBox="0 0 24 16" fill="none" className={`transition-transform duration-500 ${showAdvanced ? 'rotate-180 scale-110' : 'group-hover/filters:scale-110'}`}>
                  <path d="M4 4H20M7 8H17M10 12H14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                <RollingText text={showAdvanced ? "HIDE OPTIONS" : t('advancedFiltersBtn')} />
              </button>
           </div>
        </div>

        {/* 2.1 Collapsible Advanced Filters Drawer */}
        <div 
          className={`overflow-hidden transition-all duration-700 ease-memo ${showAdvanced ? 'max-h-[600px] opacity-100 mb-12' : 'max-h-0 opacity-0'}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 py-8 border-b border-slate-200/80 mx-auto max-w-[1600px] bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
             {/* Difficulty Section */}
             <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-amber-600">
                      <path d="M13 18L13 6M13 6L11 9M13 6L15 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M5 18L5 12M5 12L3 15M5 12L7 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 18L21 2M21 2L19 5M21 2L23 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                   </svg>
                   <h3 className="font-inter text-2xl text-slate-900 font-bold tracking-tight">Difficulty</h3>
                </div>
                
                <div className="flex flex-wrap gap-3">
                   {['All', 'Beginner', 'Intermediate', 'Advanced'].map((level) => (
                     <button
                       key={level}
                       onClick={() => setSelectedDifficulty(level)}
                       className={`px-6 py-3 font-montserrat text-xs font-bold tracking-wider border transition-all duration-300 uppercase rounded-xl ${
                         selectedDifficulty === level 
                         ? 'bg-accent text-slate-950 border-amber-400 font-black shadow-sm' 
                         : 'text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900 bg-slate-50'
                       }`}
                     >
                       {level}
                     </button>
                   ))}
                </div>
             </div>

             {/* Duration Section */}
             <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-amber-600">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5"/>
                      <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                   </svg>
                   <h3 className="font-inter text-2xl text-slate-900 font-bold tracking-tight">Duration</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                   {['All hours', '0-2 hours', '2-5 hours', '5-10 hours', '10-20 hours', '20+ hours'].map((range) => (
                     <div 
                       key={range}
                       onClick={() => setSelectedDuration(range)}
                       className="flex items-center gap-3 cursor-pointer group/dur"
                     >
                        <div className={`w-4 h-4 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                          selectedDuration === range ? 'border-amber-500 bg-amber-100' : 'border-slate-300 group-hover/dur:border-slate-400'
                        }`}>
                           <div className={`w-1.5 h-1.5 rounded-full bg-amber-600 transition-transform duration-300 ${
                             selectedDuration === range ? 'scale-100' : 'scale-0'
                           }`} />
                        </div>
                        <span className={`font-montserrat text-xs tracking-wider transition-colors ${
                          selectedDuration === range ? 'text-slate-900 font-bold' : 'text-slate-600 group-hover/dur:text-slate-900'
                        }`}>
                          {range}
                        </span>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>

        {/* 3. Masonry Grid */}
        <div className="course-grid max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            <div className="col-span-full text-center py-20 text-amber-800 font-montserrat font-bold">LOADING COURSES...</div>
          ) : error ? (
            <div className="col-span-full text-center py-20 text-red-600 font-montserrat font-bold">{t('failedToLoad')}</div>
          ) : filteredCourses.length > 0 ? (
            filteredCourses.map((item) => (
              <CourseCard 
                key={item._id || item.id} 
                item={{
                  id: item._id || item.id,
                  title: item.title,
                  category: item.category?.name || item.category || 'COURSE',
                  description: item.shortDescription || item.description,
                  price: item.salePrice ? `₹${item.salePrice}` : item.price ? `₹${item.price}` : 'FREE',
                  image: (() => {
                      const thumb = item.thumbnail;
                      if (!thumb) return '/herocard.png';
                      if (thumb.startsWith('http')) return thumb;
                      const rawBase = import.meta.env.VITE_BASE_URL || import.meta.env.VITE_API_BASE || 'https://api.dataknowledge.in';
                      const baseUrl = rawBase.replace(/\/api\/v1\/?$/, '');
                      return `${baseUrl}${thumb.startsWith('/') ? '' : '/'}${thumb}`;
                  })(),
                  isNew: true,
                }} 
              />
            ))
          ) : (
            <div className="col-span-full text-center py-20 text-slate-500 font-montserrat font-medium">{t('noCoursesAvailable')}</div>
          )}
        </div>
      </main>
    </div>
  )
}

export default DashboardCourses
