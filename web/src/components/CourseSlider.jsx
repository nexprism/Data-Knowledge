import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCourses } from '../redux/slices/courseSlice'
import sanitizeDisplay from '../utils/textSanitize'
import { useLanguage } from '../context/LanguageContext'
import { getImageBaseUrl } from '../utils/apiConfig'

const SwimlaneRow = ({ category, courses, navigate }) => {
  const rowRef = useRef(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)
  const { t } = useLanguage()

  const displayCategory = (category && category.toUpperCase() === 'ALL COURSES')
    ? t('allCourses')
    : category

  const handleScroll = () => {
    if (!rowRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current
    setShowLeftArrow(scrollLeft > 0)
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10)
  }

  const scrollByAmount = (direction) => {
    if (!rowRef.current) return
    const { clientWidth } = rowRef.current
    const scrollAmount = direction === 'left' ? -clientWidth + 100 : clientWidth - 100
    rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
  }

  return (
    <div className="relative max-w-7xl mx-auto w-full py-6 group/row">
      {/* Category Header Bar */}
      <div className="px-6 md:px-12 mb-6 flex items-center gap-4">
        <h2 className="font-inter text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">{displayCategory}</h2>
        <div className="h-[2px] flex-grow max-w-[200px] bg-slate-200" />
      </div>

      <div className="relative">
        {/* Left Fade & Button */}
        <div className={`absolute top-0 left-0 h-full w-24 bg-transparent z-10 flex items-center justify-start px-4 transition-opacity duration-300 pointer-events-none ${showLeftArrow ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={() => scrollByAmount('left')}
            className="w-12 h-12 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center pointer-events-auto hover:bg-accent hover:border-amber-400 transition-all group/btn -translate-x-full group-hover/row:translate-x-0"
            aria-label="Scroll left"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-slate-800 group-hover/btn:text-slate-950 group-hover/btn:-translate-x-0.5 transition-transform">
              <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Scrollable Track */}
        <div
          ref={rowRef}
          onScroll={handleScroll}
          className="flex items-stretch gap-8 overflow-x-auto snap-x snap-mandatory scrollbar-none px-6 md:px-12 pb-10 pt-4 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {courses.map((course, i) => (
            <div
              key={i}
              className="snap-start relative flex-shrink-0 w-[340px] sm:w-[400px] md:w-[480px] cursor-pointer group"
              onClick={() => navigate(`/course-detail/${course._id || course.id}`)}
            >
              {/* Subtle Ambient Hover Glow */}
              <div className="card-border absolute -inset-0.5 rounded-[1.75rem] bg-gradient-to-br from-amber-400/40 to-amber-200/20 opacity-0 blur-sm pointer-events-none transition-opacity duration-500 group-hover:opacity-100" />

              {/* Main Light Mode Card */}
              <div className="relative h-full bg-white border border-slate-200/80 p-4 rounded-[1.5rem] flex flex-col gap-4 overflow-hidden shadow-md transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-xl group-hover:border-amber-300">

                {/* Image Container (Horizontal Aspect Ratio - Increased Height & Width) */}
                <div className="relative aspect-[16/9.5] rounded-[1.25rem] overflow-hidden bg-slate-100 border border-slate-100">
                  <img
                    src={(() => {
                      const imgPath = course.thumbnail || course.horizontalCarouselImage || course.verticalCarouselImage;
                      if (!imgPath) return "/banner.png";
                      const baseUrl = getImageBaseUrl();
                      return `${baseUrl}${imgPath.startsWith('/') ? '' : '/'}${imgPath}`;
                    })()}
                    alt={sanitizeDisplay(course.title)}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Subtle, Soft Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent opacity-40 transition-opacity duration-500" />
                </div>

                {/* Text Content */}
                <div className="flex flex-col flex-grow gap-2.5 px-2 pb-2">
                  <div className="flex items-center gap-2 justify-between">
                    <span className="font-jetbrains text-[10px] tracking-widest font-bold uppercase bg-amber-100/80 text-amber-900 px-3 py-1 rounded-full border border-amber-300/60 truncate max-w-[180px]">
                      {course.category?.name || course.category || course.tag || 'COURSE'}
                    </span>
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center group-hover:bg-accent group-hover:border-amber-400 transition-colors shadow-sm">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700 group-hover:text-slate-950 transition-colors" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="font-inter text-xl md:text-2xl text-slate-900 font-bold tracking-tight leading-snug group-hover:text-amber-600 transition-colors mt-1 line-clamp-2">
                    {sanitizeDisplay(course.title)}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Fade & Button */}
        <div className={`absolute top-0 right-0 h-full w-24 bg-transparent z-10 flex items-center justify-end px-4 transition-opacity duration-300 pointer-events-none ${showRightArrow ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={() => scrollByAmount('right')}
            className="w-12 h-12 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center pointer-events-auto hover:bg-accent hover:border-amber-400 transition-all group/btn translate-x-full group-hover/row:translate-x-0"
            aria-label="Scroll right"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-slate-800 group-hover/btn:text-slate-950 group-hover/btn:translate-x-0.5 transition-transform">
              <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

const CourseSlider = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { courses: apiCourses } = useSelector((state) => state.courses)

  const baseCourses = Array.isArray(apiCourses) ? apiCourses : []

  useEffect(() => {
    dispatch(fetchCourses())
  }, [dispatch])

  // Show all courses in a single row (not category-wise)
  let allCourses = [...baseCourses]

  // Repeat backend records only to preserve the existing carousel interaction.
  if (allCourses.length > 0 && allCourses.length < 6) {
    allCourses = [...allCourses, ...allCourses, ...allCourses]
  }

  return (
    <section className="relative w-full py-12 bg-slate-50 overflow-hidden select-none">
      <div className="flex flex-col gap-6 relative z-20">
        {allCourses.length > 0 && (
          <SwimlaneRow category="ALL COURSES" courses={allCourses} navigate={navigate} />
        )}
      </div>
    </section>
  )
}

export default CourseSlider
