import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCourseDetail } from '../redux/slices/courseSlice'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/all'
import RollingText from '../components/RollingText'
import LogoMarquee from '../components/LogoMarquee'
import CourseHeroDetail from '../components/CourseHeroDetail'
import ComparisonSection from '../components/ComparisonSection'
import CertificatePricingSection from '../components/CertificatePricingSection'
import BenefitsSection from '../components/BenefitsSection'
import FrameworkSection from '../components/FrameworkSection'
import SolutionSection from '../components/SolutionSection'
import sanitizeDisplay from '../utils/textSanitize'
import phase1Img from '../assets/images/blueprint/phase_01.png'
import phase2Img from '../assets/images/blueprint/phase_02.png'
import phase3Img from '../assets/images/blueprint/phase_03.png'
import phase4Img from '../assets/images/blueprint/phase_04.png'

gsap.registerPlugin(ScrollTrigger)

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

      // 1. Section Title reveals
      gsap.utils.toArray('.stack-card').forEach((card, index) => {
        if (index === 0) return
        gsap.fromTo(card,
          { opacity: 0, scale: 0.95 },
          {
            opacity: 1, scale: 1,
            scrollTrigger: {
              trigger: card,
              start: "top 95%",
              end: "top 70%",
              scrub: true,
            }
          }
        )
      })
    }, containerRef)

    return () => ctx.revert()
  }, [course]) // Re-run animations when course data is loaded

  // Temporary debug: log course data when loaded
  useEffect(() => {
    if (course) {
      // eslint-disable-next-line no-console
      console.log('CourseDetail loaded:', { id, title: course.title, course })
    }
  }, [course, id])

  if (loading && !course) {
    return <div className="min-h-screen bg-dark" />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-red-500 font-jetbrains tracking-widest uppercase text-[10px]">Transmission Error: {error}</div>
      </div>
    )
  }

  if (!course && !loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-normal font-jetbrains tracking-widest uppercase text-[10px]">Archive Not Found</div>
      </div>
    )
  }

  // Map API modules to curriculum structure
  const dynamicCurriculum = course.modules?.map((module, index) => {
    let apiImage = null;
    if (module.image) {
        let rawUrl = module.image;
        if (rawUrl.includes('\\uploads\\') || rawUrl.includes('/uploads/')) {
            const parts = rawUrl.split(/[\\/]uploads[\\/]/);
            rawUrl = '/uploads/' + parts[parts.length - 1];
        }
        if (rawUrl.startsWith('http') || rawUrl.startsWith('blob:')) {
            apiImage = rawUrl;
        } else {
            const rawBase = import.meta.env.VITE_IMAGE_URL || import.meta.env.VITE_BASE_URL || import.meta.env.VITE_API_BASE || 'https://api.dataknowledge.in';
            const baseUrl = rawBase.replace(/\/api\/v1\/?$/, '');
            apiImage = `${baseUrl}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
        }
    }

    return {
        id: module._id,
        title: sanitizeDisplay(module.title),
        apiImage,
        description: sanitizeDisplay(module.description),
        lessons: module.lessons?.map(l => {
          let lessonImage = null;
          if (l.image) {
              let rawUrl = l.image;
              if (rawUrl.includes('\\uploads\\') || rawUrl.includes('/uploads/')) {
                  const parts = rawUrl.split(/[\\/]uploads[\\/]/);
                  rawUrl = '/uploads/' + parts[parts.length - 1];
              }
              if (rawUrl.startsWith('http') || rawUrl.startsWith('blob:')) {
                  lessonImage = rawUrl;
              } else {
                  const rawBase = import.meta.env.VITE_IMAGE_URL || import.meta.env.VITE_BASE_URL || import.meta.env.VITE_API_BASE || 'https://api.dataknowledge.in';
                  const baseUrl = rawBase.replace(/\/api\/v1\/?$/, '');
                  lessonImage = `${baseUrl}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
              }
          }

          return {
            id: l._id,
            title: sanitizeDisplay(l.title),
            description: sanitizeDisplay(l.description || ''),
            type: l.type,
            apiImage: lessonImage
          };
        }) || []
    };
  }) || []

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-50 pt-32 sm:pt-40 xl:pb-24 px-4 sm:px-6 md:px-12 lg:px-20 overflow-x-clip cursor-default">

      {/* Dynamic Sections from API */}
      {(() => {
        let activeSections = [];

        if (Array.isArray(course.landingPageSections) && course.landingPageSections.length > 0) {
          // Sort sections by order
          const sorted = [...course.landingPageSections].sort(
            (a, b) => (a.order ?? a.sortOrder ?? 0) - (b.order ?? b.sortOrder ?? 0)
          );
          activeSections = sorted.filter(s => s.data?.show !== false);
        }

        // If no active landingPageSections found, check legacy top-level sections
        if (activeSections.length === 0) {
          if (course.overviewSection?.show) {
            activeSections.push({ type: 'overview', data: course.overviewSection, _id: 'overview-legacy' });
          }
          if (course.comparisonSection?.show) {
            activeSections.push({ type: 'comparison', data: course.comparisonSection, _id: 'comparison-legacy' });
          }
          if (course.benefitsSection?.show) {
            activeSections.push({ type: 'benefits', data: course.benefitsSection, _id: 'benefits-legacy' });
          }
          if (course.frameworkSection?.show) {
            activeSections.push({ type: 'framework', data: course.frameworkSection, _id: 'framework-legacy' });
          }
          if (course.solutionSection?.show) {
            activeSections.push({ type: 'solution', data: course.solutionSection, _id: 'solution-legacy' });
          }
        }

        // Always ensure an overview section is rendered as Hero
        const hasOverview = activeSections.some(s => s.type === 'overview');
        if (!hasOverview) {
          activeSections.unshift({
            type: 'overview',
            data: course.overviewSection || { show: true, title: course.title, subtitle: course.subtitle, description: course.description },
            _id: 'default-overview'
          });
        }

        return activeSections.map((section, idx) => {
          switch (section.type) {
            case 'overview': {
              const mergedData = {
                ...course.overviewSection,
                ...section.data,
                description: (section.data?.description?.blocks?.length ? section.data.description : (course.overviewSection?.description || section.data?.description))
              };
              return <CourseHeroDetail key={section._id || idx} course={course} section={mergedData} />
            }
            case 'comparison': {
              const mergedData = {
                ...course.comparisonSection,
                ...section.data
              };
              return <ComparisonSection key={section._id || idx} course={course} section={mergedData} />
            }
            case 'benefits': {
              const mergedData = {
                ...course.benefitsSection,
                ...section.data
              };
              return <BenefitsSection key={section._id || idx} course={course} section={mergedData} />
            }
            case 'framework': {
              const mergedData = {
                ...course.frameworkSection,
                ...section.data
              };
              return <FrameworkSection key={section._id || idx} course={course} section={mergedData} />
            }
            case 'solution': {
              const mergedData = {
                ...course.solutionSection,
                ...section.data
              };
              return <SolutionSection key={section._id || idx} course={course} section={mergedData} />
            }
            default:
              return null
          }
        });
      })()}

      {/* Show curriculum only when the course has modules in the database. */}
      {dynamicCurriculum.length > 0 && (
        <section id="curriculum-section" className="section-reveal max-w-7xl mx-auto py-16 scroll-mt-32">
          <div className="flex flex-col gap-6">
            <div className="mb-4 text-center md:text-left space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/70 text-[#3498db] text-xs font-semibold tracking-wide uppercase">
                <span className="w-2 h-2 rounded-full bg-[#3498db] animate-pulse" />
                <span>Complete Curriculum</span>
              </div>
              <h2 className="font-inter text-3xl sm:text-4xl lg:text-5xl text-slate-900 font-extrabold tracking-tight">
                Course <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3498db] via-blue-600 to-[#1a5276]">Modules & Lessons</span>
              </h2>
              <div className="h-[2px] bg-[#3498db]/30 w-24 md:w-36 mx-auto md:mx-0" />
            </div>

            <div className="space-y-4">
              {dynamicCurriculum.map((module, mIndex) => {
                const isExpanded = expandedModules.has(mIndex);
                return (
                  <div key={module.id} className="relative">
                    {/* MODULE HEADER (CHAPTER) */}
                    <div 
                      className={`mb-4 md:mb-6 p-5 sm:p-6 rounded-3xl cursor-pointer group/header transition-all duration-300 ${
                        !isExpanded 
                          ? 'bg-white border border-slate-200/90 shadow-sm hover:border-[#3498db]/40 hover:shadow-md' 
                          : 'bg-white border-2 border-blue-200 shadow-md'
                      }`}
                      onClick={() => toggleModule(mIndex)}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-4">
                          <span className="font-inter text-[#3498db] font-bold text-xs uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60">
                            Chapter {String(mIndex + 1).padStart(2, '0')}
                          </span>
                          <div className="h-[1px] flex-1 bg-slate-200" />
                          <button 
                            type="button"
                            className="w-8 h-8 rounded-full border border-blue-200 flex items-center justify-center bg-blue-50 text-[#3498db] group-hover/header:bg-[#3498db] group-hover/header:text-white transition-all"
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

                    {/* LESSONS STACK */}
                    {isExpanded && (
                      <div className="flex flex-col gap-6 pl-0 sm:pl-4 mb-8">
                        {module.lessons.map((lesson, lIndex) => {
                          const displayImage = lesson.apiImage || module.apiImage;
                          return (
                            <div
                              key={lesson.id}
                              className={`group relative grid grid-cols-1 ${displayImage ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-6 md:gap-8 items-center border border-slate-200/90 bg-white p-6 sm:p-8 rounded-3xl shadow-sm hover:shadow-md hover:border-[#3498db]/30 transition-all`}
                            >
                              <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                  <span className="font-inter text-lg sm:text-xl font-extrabold text-[#3498db]">
                                    {String(lIndex + 1).padStart(2, '0')}.
                                  </span>
                                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100 border border-slate-200 px-3 py-0.5 rounded-full">
                                    {lesson.type}
                                  </span>
                                </div>
                                <h4 className="font-inter text-xl sm:text-2xl font-bold text-slate-900 leading-snug tracking-tight">
                                  {lesson.title}
                                </h4>
                                {lesson.description && (
                                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed break-words">
                                    {lesson.description}
                                  </p>
                                )}
                              </div>
                              
                              {displayImage && (
                                <div className="relative overflow-hidden border border-slate-200 rounded-2xl aspect-video bg-slate-50 shadow-sm">
                                  <img 
                                    src={displayImage} 
                                    alt={lesson.title} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" 
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {course.price != null || course.salePrice != null ? (
        <div id="pricing-section" className="scroll-mt-32">
          <CertificatePricingSection course={course} />
        </div>
      ) : null}

    </div>
  )
}

export default CourseDetail
