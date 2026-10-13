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
    <div ref={containerRef} className="min-h-screen bg-dark pt-36 xl:pb-24 px-4 md:px-12 lg:px-20 overflow-x-clip cursor-default">

      {/* Dynamic Sections from API */}
      {course.landingPageSections?.filter(s => s.data?.show === true).map((section, idx) => {
          switch (section.type) {
            case 'overview':
              return <CourseHeroDetail key={section._id || idx} course={course} section={section.data} />
            case 'comparison':
              return <ComparisonSection key={section._id || idx} course={course} section={section.data} />
            case 'benefits':
              return <BenefitsSection key={section._id || idx} course={course} section={section.data} />
            case 'framework':
              return <FrameworkSection key={section._id || idx} course={course} section={section.data} />
            case 'solution':
              return <SolutionSection key={section._id || idx} course={course} section={section.data} />
            default:
              return null
          }
      })}

      {/* Show curriculum only when the course has modules in the database. */}
      {dynamicCurriculum.length > 0 && (
        <section id="curriculum-section" className="section-reveal max-w-7xl mx-auto py-16 scroll-mt-32">
          <div className="flex flex-col gap-6">
            <div className="mb-4 text-center md:text-left">
              <h2 className="font-inter text-4xl md:text-6xl text-normal font-extralight mb-4 tracking-tighter">
                The <span className="text-accent">Blueprint</span>
              </h2>
              <div className="h-[1px] bg-accent/20 w-32 md:w-48 mx-auto md:mx-0" />
            </div>

            <div className="space-y-4">
              {dynamicCurriculum.map((module, mIndex) => {
                const isExpanded = expandedModules.has(mIndex);
                return (
                  <div key={module.id} className="relative">
                    {/* MODULE HEADER (CHAPTER) */}
                    <div 
                      className={`mb-4 md:mb-6 p-4 md:p-5 rounded-2xl cursor-pointer group/header transition-all duration-700 ${
                        !isExpanded 
                          ? 'bg-accent/[0.09] border border-accent/70 hover:bg-accent/[0.05] hover:border-accent/20' 
                          : 'bg-transparent border border-transparent'
                      }`}
                      onClick={() => toggleModule(mIndex)}
                    >
                      <div className={`${isExpanded ? 'space-y-4' : 'space-y-2'}`}>
                        <div className="flex items-center gap-6">
                          <span className="font-jetbrains text-accent font-black tracking-[0.4em] uppercase text-[10px]">Chapter {String(mIndex + 1).padStart(2, '0')}</span>
                          <div className="h-[1px] flex-1 bg-white/10" />
                          <button className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover/header:border-accent transition-colors bg-dark/50">
                            <svg 
                              width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                              className={`transition-transform duration-700 ${isExpanded ? 'rotate-[225deg] stroke-accent' : ''}`}
                            >
                              <path d="M12 5v14M5 12h14" />
                            </svg>
                          </button>
                        </div>
                        <h3 className={`font-inter italic text-normal font-extralight leading-[1] transition-all duration-500 ${
                          isExpanded ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'
                        }`}>
                          {module.title}
                        </h3>
                        {isExpanded && (
                          <p className="font-montserrat text-white/60 text-sm md:text-sm max-w-2xl leading-relaxed animate-in fade-in slide-in-from-top-2 duration-700">
                            {module.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* LESSONS STACK */}
                    {isExpanded && (
                      <div className="flex flex-col gap-10 md:gap-20">
                        {module.lessons.map((lesson, lIndex) => {
                          const displayImage = lesson.apiImage || module.apiImage;
                          return (
                            <div
                              key={lesson.id}
                              className={`stack-card group relative sticky grid grid-cols-1 ${displayImage ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-8 md:gap-12 items-center border border-white/10 bg-dark p-8 md:p-12 backdrop-blur-3xl overflow-hidden rounded-2xl shadow-2xl`}
                              style={{ top: `${140 + lIndex * 40}px`, zIndex: lIndex + 1 }}
                            >
                              {/* Full-Width Soft Glow - No Line */}
                              <div className="absolute -top-24 left-0 right-0 h-16 bg-accent/[0.6] blur-[40px] pointer-events-none" />
                              
                              <div className="relative z-10 space-y-8 md:space-y-12">
                                <div className="flex items-center gap-4">
                                  <span className="font-jetbrains text-xl md:text-2xl font-black text-accent">
                                    {String(lIndex + 1).padStart(2, '0')}.
                                  </span>
                                  <span className="font-jetbrains text-[9px] text-white/40 tracking-[0.3em] uppercase border border-white/10 px-3 py-1">
                                    {lesson.type}
                                  </span>
                                </div>
                                <h4 className="font-inter text-3xl md:text-4xl text-normal font-extralight leading-none tracking-tight">
                                  {lesson.title}
                                </h4>
                                <p className="font-montserrat text-description/70 text-sm md:text-base lg:text-lg leading-relaxed max-w-3xl break-words">
                                  {lesson.description}
                                </p>
                              </div>
                              
                              {displayImage && (
                                <div className="relative z-10 overflow-hidden border border-white/10 rounded-lg aspect-video bg-white/5">
                                  <img 
                                    src={displayImage} 
                                    alt={lesson.title} 
                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
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
