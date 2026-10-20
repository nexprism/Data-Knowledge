import React, { useEffect, useRef, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCourseDetail } from '../redux/slices/courseSlice'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/all'
import CourseHeroDetail from '../components/CourseHeroDetail'
import ComparisonSection from '../components/ComparisonSection'
import CertificatePricingSection from '../components/CertificatePricingSection'
import BenefitsSection from '../components/BenefitsSection'
import FrameworkSection from '../components/FrameworkSection'
import SolutionSection from '../components/SolutionSection'
import MentorSection from '../components/MentorSection'
import CourseFaqSection from '../components/CourseFaqSection'
import CourseErrorBoundary from '../components/CourseErrorBoundary'
import sanitizeDisplay, { sanitizeParagraph } from '../utils/textSanitize'
import { getImageBaseUrl } from '../utils/apiConfig'

gsap.registerPlugin(ScrollTrigger)

// Helper: Format duration into readable text (e.g., "4:31 min", "15 min", "1h 30m")
const formatLessonDuration = (duration) => {
  if (!duration) return null
  if (typeof duration === 'string') {
    if (duration.includes('min') || duration.includes('sec') || duration.includes(':') || duration.includes('h')) {
      return duration
    }
    const num = Number(duration)
    if (isNaN(num)) return duration
    duration = num
  }
  if (typeof duration === 'number') {
    if (duration <= 0) return null
    if (duration >= 60) {
      const h = Math.floor(duration / 60)
      const m = Math.round(duration % 60)
      return m > 0 ? `${h}h ${m}m` : `${h}h`
    }
    return `${Math.round(duration)} min`
  }
  return null
}

// Helper: Render modern icon for each lesson type
const renderLessonIcon = (type) => {
  const t = (type || '').toLowerCase()
  if (t.includes('video')) {
    return (
      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/80 text-[#3498db] flex items-center justify-center shrink-0 shadow-sm">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    )
  }
  if (t.includes('quiz')) {
    return (
      <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center shrink-0 shadow-sm">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
    )
  }
  if (t.includes('assign')) {
    return (
      <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          <path d="M9 14l2 2 4-4" />
        </svg>
      </div>
    )
  }
  if (t.includes('file') || t.includes('download')) {
    return (
      <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-200/80 text-cyan-600 flex items-center justify-center shrink-0 shadow-sm">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </div>
    )
  }
  return (
    <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200/80 text-purple-600 flex items-center justify-center shrink-0 shadow-sm">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    </div>
  )
}

const CourseDetail = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const { currentCourse: course, detailLoading: loading, error } = useSelector((state) => state.courses)
  const containerRef = useRef(null)
  
  // Track which modules are expanded
  const [expandedModules, setExpandedModules] = useState(new Set([0])) // First module expanded by default

  const toggleModule = (index) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedModules(newExpanded)
  }

  useEffect(() => {
    if (id) {
      dispatch(fetchCourseDetail(id))
    }
  }, [id, dispatch])

  useEffect(() => {
    window.scrollTo(0, 0)
    const ctx = gsap.context(() => {
      // 1. Hero Text reveal
      gsap.fromTo('.hero-text-reveal',
        { y: 100, opacity: 0, scale: 0.95, filter: 'blur(20px)' },
        { y: 0, opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.5, ease: 'power4.out', stagger: 0.1 }
      )

      // 2. Section Title reveals
      gsap.utils.toArray('.section-reveal').forEach((section) => {
        gsap.fromTo(section,
          { opacity: 0, y: 50 },
          {
            opacity: 1, y: 0, duration: 1, ease: 'power3.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 85%',
            }
          }
        )
      })
    }, containerRef)

    return () => ctx.revert()
  }, [course])

  // Map API modules to rich curriculum structure
  const dynamicCurriculum = useMemo(() => {
    if (!course?.modules || !Array.isArray(course.modules)) return []
    return course.modules.map((module) => {
      let apiImage = null
      if (module.image) {
        let rawUrl = module.image
        if (rawUrl.includes('\\uploads\\') || rawUrl.includes('/uploads/')) {
          const parts = rawUrl.split(/[\\/]uploads[\\/]/)
          rawUrl = '/uploads/' + parts[parts.length - 1]
        }
        if (rawUrl.startsWith('http') || rawUrl.startsWith('blob:')) {
          apiImage = rawUrl
        } else {
          const baseUrl = getImageBaseUrl()
          apiImage = `${baseUrl}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`
        }
      }

      const lessons = (module.lessons || []).map((l) => {
        let lessonImage = null
        if (l.image) {
          let rawUrl = l.image
          if (rawUrl.includes('\\uploads\\') || rawUrl.includes('/uploads/')) {
            const parts = rawUrl.split(/[\\/]uploads[\\/]/)
            rawUrl = '/uploads/' + parts[parts.length - 1]
          }
          if (rawUrl.startsWith('http') || rawUrl.startsWith('blob:')) {
            lessonImage = rawUrl
          } else {
            const baseUrl = getImageBaseUrl()
            lessonImage = `${baseUrl}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`
          }
        }

        const rawDuration = l.duration || l.videoLessons?.[0]?.duration || null
        const formattedDuration = formatLessonDuration(rawDuration)

        return {
          id: l._id || l.id,
          title: sanitizeDisplay(l.title),
          description: sanitizeParagraph(l.description || ''),
          type: l.type || 'video-lesson',
          accessibility: l.accessibility || 'paid',
          duration: formattedDuration,
          hasQuiz: Boolean(l.type === 'quiz' || l.Quiz || l.quiz),
          hasAssignment: Boolean(l.type === 'assignment' || l.Assignment || l.assignment),
          apiImage: lessonImage
        }
      })

      return {
        id: module._id || module.id,
        title: sanitizeDisplay(module.title),
        apiImage,
        description: sanitizeParagraph(module.description || ''),
        lessons
      }
    })
  }, [course?.modules])

  // Curriculum overall statistics
  const curriculumStats = useMemo(() => {
    const totalChapters = dynamicCurriculum.length
    let totalLessons = 0
    let totalQuizzes = 0
    let totalAssignments = 0
    let totalVideos = 0

    dynamicCurriculum.forEach((m) => {
      totalLessons += m.lessons.length
      m.lessons.forEach((l) => {
        const type = (l.type || '').toLowerCase()
        if (type.includes('video')) totalVideos++
        if (l.hasQuiz) totalQuizzes++
        if (l.hasAssignment) totalAssignments++
      })
    })

    return {
      totalChapters,
      totalLessons,
      totalVideos,
      totalQuizzes,
      totalAssignments
    }
  }, [dynamicCurriculum])

  const isAllExpanded = dynamicCurriculum.length > 0 && expandedModules.size === dynamicCurriculum.length

  const handleToggleExpandAll = () => {
    if (isAllExpanded) {
      setExpandedModules(new Set())
    } else {
      setExpandedModules(new Set(dynamicCurriculum.map((_, i) => i)))
    }
  }

  if (loading && !course) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#3498db]/30 border-t-[#3498db] animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="p-8 max-w-md bg-white border border-rose-200 rounded-3xl shadow-xl text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 className="font-bold text-slate-900">Failed to Load Course</h3>
          <p className="text-xs text-slate-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!course && !loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="p-8 max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl text-center space-y-3">
          <h3 className="font-bold text-slate-900">Course Not Found</h3>
          <p className="text-xs text-slate-600">The requested course could not be located in our catalog.</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-50 pt-32 sm:pt-40 xl:pb-24 px-4 sm:px-6 md:px-12 lg:px-20 overflow-x-clip cursor-default">

      {/* Dynamic Landing Page Sections from API */}
      <CourseErrorBoundary>
        {(() => {
          let activeSections = []

          if (Array.isArray(course.landingPageSections) && course.landingPageSections.length > 0) {
            const sorted = [...course.landingPageSections].sort(
              (a, b) => (a.order ?? a.sortOrder ?? 0) - (b.order ?? b.sortOrder ?? 0)
            )
            activeSections = sorted.filter(s => s.data?.show !== false)
          }

          if (activeSections.length === 0) {
            if (course.overviewSection?.show) {
              activeSections.push({ type: 'overview', data: course.overviewSection, _id: 'overview-legacy' })
            }
            if (course.comparisonSection?.show) {
              activeSections.push({ type: 'comparison', data: course.comparisonSection, _id: 'comparison-legacy' })
            }
            if (course.benefitsSection?.show) {
              activeSections.push({ type: 'benefits', data: course.benefitsSection, _id: 'benefits-legacy' })
            }
            if (course.frameworkSection?.show) {
              activeSections.push({ type: 'framework', data: course.frameworkSection, _id: 'framework-legacy' })
            }
            if (course.solutionSection?.show) {
              activeSections.push({ type: 'solution', data: course.solutionSection, _id: 'solution-legacy' })
            }
          }

          const hasOverview = activeSections.some(s => s.type === 'overview')
          if (!hasOverview) {
            activeSections.unshift({
              type: 'overview',
              data: course.overviewSection || { show: true, title: course.title, subtitle: course.subtitle, description: course.description },
              _id: 'default-overview'
            })
          }

          return activeSections.map((section, idx) => {
            switch (section.type) {
              case 'overview': {
                const mergedData = {
                  ...course.overviewSection,
                  ...section.data,
                  description: (section.data?.description?.blocks?.length ? section.data.description : (course.overviewSection?.description || section.data?.description))
                }
                return <CourseHeroDetail key={section._id || idx} course={course} section={mergedData} />
              }
              case 'comparison': {
                const mergedData = {
                  ...course.comparisonSection,
                  ...section.data
                }
                return <ComparisonSection key={section._id || idx} course={course} section={mergedData} />
              }
              case 'benefits': {
                const mergedData = {
                  ...course.benefitsSection,
                  ...section.data
                }
                return <BenefitsSection key={section._id || idx} course={course} section={mergedData} />
              }
              case 'framework': {
                const mergedData = {
                  ...course.frameworkSection,
                  ...section.data
                }
                return <FrameworkSection key={section._id || idx} course={course} section={mergedData} />
              }
              case 'solution': {
                const mergedData = {
                  ...course.solutionSection,
                  ...section.data
                }
                return <SolutionSection key={section._id || idx} course={course} section={mergedData} />
              }
              default:
                return null
            }
          })
        })()}
      </CourseErrorBoundary>

      {/* CURRICULUM SECTION (MODULES & LESSONS) */}
      {dynamicCurriculum.length > 0 && (
        <CourseErrorBoundary>
          <section id="curriculum-section" className="section-reveal max-w-7xl mx-auto py-16 scroll-mt-32">
            <div className="flex flex-col gap-6">
              
              {/* Header + Stats & Expand/Collapse Toggle */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div className="space-y-2 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/70 text-[#3498db] text-xs font-semibold tracking-wide uppercase">
                    <span className="w-2 h-2 rounded-full bg-[#3498db] animate-pulse" />
                    <span>Complete Curriculum</span>
                  </div>
                  <h2 className="font-inter text-3xl sm:text-4xl lg:text-5xl text-slate-900 font-extrabold tracking-tight">
                    Course <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3498db] via-blue-600 to-[#1a5276]">Modules & Lessons</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
                    Structured step-by-step learning path from foundational concepts to real-world applications.
                  </p>
                </div>

                {/* Expand / Collapse All Toggle Button */}
                <div className="flex items-center justify-center md:justify-end">
                  <button
                    type="button"
                    onClick={handleToggleExpandAll}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-slate-200 hover:border-[#3498db]/40 text-slate-700 hover:text-[#3498db] text-xs font-bold shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className={`transition-transform duration-300 ${isAllExpanded ? 'rotate-180' : ''}`}
                    >
                      <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>{isAllExpanded ? 'Collapse All Chapters' : 'Expand All Chapters'}</span>
                  </button>
                </div>
              </div>

              {/* Curriculum Quick Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm">
                <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#3498db] flex items-center justify-center font-bold text-sm">
                    {curriculumStats.totalChapters}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Chapters</span>
                    <span className="text-xs font-semibold text-slate-800">Modules</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
                    {curriculumStats.totalLessons}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lessons</span>
                    <span className="text-xs font-semibold text-slate-800">Lectures</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-sm">
                    {curriculumStats.totalQuizzes}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quizzes</span>
                    <span className="text-xs font-semibold text-slate-800">Assessments</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">
                    {curriculumStats.totalAssignments}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Projects</span>
                    <span className="text-xs font-semibold text-slate-800">Assignments</span>
                  </div>
                </div>
              </div>

              {/* Module Chapters Stack */}
              <div className="space-y-4 pt-2">
                {dynamicCurriculum.map((module, mIndex) => {
                  const isExpanded = expandedModules.has(mIndex)
                  return (
                    <div key={module.id} className="relative">
                      {/* MODULE CHAPTER HEADER */}
                      <div 
                        className={`p-5 sm:p-6 rounded-3xl cursor-pointer group/header transition-all duration-300 ${
                          !isExpanded 
                            ? 'bg-white border border-slate-200/90 shadow-sm hover:border-[#3498db]/40 hover:shadow-md' 
                            : 'bg-white border-2 border-blue-200 shadow-md ring-2 ring-blue-50'
                        }`}
                        onClick={() => toggleModule(mIndex)}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center gap-4">
                            <span className="font-inter text-[#3498db] font-bold text-xs uppercase tracking-wider px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200/60">
                              Chapter {String(mIndex + 1).padStart(2, '0')}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">
                              {module.lessons.length} {module.lessons.length === 1 ? 'lesson' : 'lessons'}
                            </span>
                            <div className="h-[1px] flex-1 bg-slate-200" />
                            <button 
                              type="button"
                              className="w-8 h-8 rounded-full border border-blue-200 flex items-center justify-center bg-blue-50 text-[#3498db] group-hover/header:bg-[#3498db] group-hover/header:text-white transition-all cursor-pointer"
                            >
                              <svg 
                                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                              >
                                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          </div>
                          
                          <h3 className="font-inter text-slate-900 font-bold text-xl sm:text-2xl leading-tight">
                            {module.title}
                          </h3>
                          
                          {isExpanded && module.description && (
                            <p className="text-slate-600 text-sm leading-relaxed max-w-3xl pt-1">
                              {module.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* LESSONS LIST */}
                      {isExpanded && (
                        <div className="flex flex-col gap-3.5 pl-0 sm:pl-4 mt-4 mb-6">
                          {module.lessons.map((lesson, lIndex) => {
                            const displayImage = lesson.apiImage || module.apiImage
                            return (
                              <div
                                key={lesson.id}
                                className={`group/lesson relative grid grid-cols-1 ${displayImage ? 'lg:grid-cols-12' : 'lg:grid-cols-1'} gap-5 items-center border border-slate-200/90 bg-white p-5 sm:p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-[#3498db]/40 transition-all`}
                              >
                                <div className={`${displayImage ? 'lg:col-span-8' : ''} space-y-3`}>
                                  
                                  {/* Badges Bar */}
                                  <div className="flex flex-wrap items-center gap-2">
                                    {renderLessonIcon(lesson.type)}
                                    <span className="font-inter text-xs font-extrabold text-slate-400">
                                      {String(mIndex + 1)}.{String(lIndex + 1)}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                                      {lesson.type}
                                    </span>

                                    {lesson.accessibility === 'free' && (
                                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                        Free Preview
                                      </span>
                                    )}

                                    {lesson.duration && (
                                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-200/80 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                          <circle cx="12" cy="12" r="10"/>
                                          <polyline points="12 6 12 12 16 14"/>
                                        </svg>
                                        <span>{lesson.duration}</span>
                                      </span>
                                    )}

                                    {lesson.hasQuiz && (
                                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                                        Assessment Quiz
                                      </span>
                                    )}

                                    {lesson.hasAssignment && (
                                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                        Practical Assignment
                                      </span>
                                    )}
                                  </div>

                                  {/* Lesson Title */}
                                  <h4 className="font-inter text-lg sm:text-xl font-bold text-slate-900 leading-snug tracking-tight group-hover/lesson:text-[#3498db] transition-colors">
                                    {lesson.title}
                                  </h4>

                                  {/* Lesson Description */}
                                  {lesson.description && (
                                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed break-words line-clamp-2">
                                      {lesson.description}
                                    </p>
                                  )}
                                </div>
                                
                                {/* Lesson Thumbnail if available */}
                                {displayImage && (
                                  <div className="lg:col-span-4 relative overflow-hidden border border-slate-200 rounded-xl aspect-video bg-slate-100 shadow-sm">
                                    <img 
                                      src={displayImage} 
                                      alt={lesson.title} 
                                      className="w-full h-full object-cover group-hover/lesson:scale-105 transition-transform duration-500" 
                                    />
                                    <div className="absolute inset-0 bg-slate-900/10 group-hover/lesson:bg-transparent transition-colors" />
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

            </div>
          </section>
        </CourseErrorBoundary>
      )}

      {/* MENTOR SECTION */}
      <CourseErrorBoundary>
        <MentorSection course={course} />
      </CourseErrorBoundary>

      {/* PRICING SECTION */}
      {course.price != null || course.salePrice != null || (Array.isArray(course.plans) && course.plans.length > 0) ? (
        <CourseErrorBoundary>
          <div id="pricing-section" className="scroll-mt-32">
            <CertificatePricingSection course={course} />
          </div>
        </CourseErrorBoundary>
      ) : null}

      {/* FREQUENTLY ASKED QUESTIONS SECTION */}
      <CourseErrorBoundary>
        <CourseFaqSection course={course} />
      </CourseErrorBoundary>

    </div>
  )
}

export default CourseDetail
