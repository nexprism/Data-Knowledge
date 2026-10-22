import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { gsap } from 'gsap'
import sanitizeDisplay, { extractEditorBlocks, sanitizeParagraph, getDisplayPrice } from '../utils/textSanitize'
import { useLanguage } from '../context/LanguageContext'
import authorizedFetch from '../utils/apiClient'
import { getApiBaseUrl, getMediaUrl } from '../utils/apiConfig.js'

const CourseHeroDetail = ({ course = {}, section = {} }) => {
  const heroRef = useRef(null)
  const { user } = useSelector((state) => state.auth || {})
  const [formData, setFormData] = useState({
    name: user?.name || user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || user?.phoneNumber || '',
    query: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const { t } = useLanguage()

  const rawTitle = section?.title || course.title || 'Course Program'
  const displayTitle = sanitizeDisplay(rawTitle)
  const displaySubtitle = sanitizeParagraph(section?.subtitle || course.subtitle || '')

  // Pre-fill user details if logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || user.fullName || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || user.phoneNumber || ''
      }))
    }
  }, [user])

  // Extract description paragraphs
  const descriptionParagraphs = extractEditorBlocks(section?.description || course.overviewSection?.description || course.shortDescription || course.description)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.reveal-hero-item',
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' }
      )
      gsap.fromTo(
        '.reveal-card',
        { scale: 0.96, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.9, delay: 0.2, ease: 'power3.out' }
      )
    }, heroRef)

    return () => ctx.revert()
  }, [displayTitle])

  const highlights = Array.isArray(course.highlights)
    ? course.highlights.map(sanitizeParagraph).filter(Boolean)
    : []

  const handleScrollToPricing = () => {
    const el = document.getElementById('pricing-section')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleScrollToCurriculum = () => {
    const el = document.getElementById('curriculum-section')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setErrorMessage('Please fill in your name, email, and phone number.')
      return
    }

    try {
      setSubmitting(true)
      setErrorMessage('')

      const queryMessage = formData.query.trim() || `Callback requested for course: ${course.title || rawTitle}`

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        message: queryMessage,
        category: 'course',
        courseTitle: course.title || rawTitle,
        course: course._id || undefined,
        source: 'Course Details Hero Card'
      }

      const res = await authorizedFetch('/queries', {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit callback request')
      }

      setSubmitted(true)
      setFormData({
        name: user?.name || user?.fullName || '',
        email: user?.email || '',
        phone: user?.phone || user?.phoneNumber || '',
        query: ''
      })

      setTimeout(() => {
        setSubmitted(false)
      }, 7000)
    } catch (err) {
      console.error('Callback request error:', err)
      setErrorMessage(err.message || 'Unable to submit your inquiry. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Cover image helper
  const rawImage = course.coverImage || course.thumbnail
  const imageSrc = getMediaUrl(rawImage, 'courses', '/banner.png')

  return (
    <section ref={heroRef} className="relative w-full mb-16 md:mb-24 pt-4">
      {/* Ambient background glow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[45vw] h-[45vw] bg-[#3498db]/10 rounded-full blur-[110px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-blue-100/50 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        
        {/* LEFT COLUMN: Course Intro & Typography (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Pill Badge */}
          <div className="reveal-hero-item inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/70 text-[#3498db] text-xs font-semibold tracking-wide uppercase">
            <span className="w-2 h-2 rounded-full bg-[#3498db] animate-pulse" />
            <span>
              {course.category?.name || 'TRAINING PROGRAM'} • {Array.isArray(course.level) ? String(course.level[0] || 'ALL LEVELS') : (typeof course.level === 'string' ? course.level : 'ALL LEVELS')}
            </span>
          </div>

          {/* Headline */}
          <h1 className="reveal-hero-item font-inter text-3xl sm:text-4xl lg:text-[2.85rem] font-extrabold text-slate-900 tracking-tight leading-[1.16]">
            {String(displayTitle || 'Course Overview').split(' ').map((word, i, arr) => (
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
          </h1>

          {/* Subtitle */}
          {displaySubtitle && (
            <p className="reveal-hero-item font-inter text-lg sm:text-xl text-slate-700 font-medium leading-snug">
              {displaySubtitle}
            </p>
          )}

          {/* Description Paragraphs */}
          {descriptionParagraphs.length > 0 ? (
            <div className="reveal-hero-item space-y-3.5 pt-1 text-slate-600 text-sm sm:text-base leading-relaxed font-normal">
              {descriptionParagraphs.map((para, i) => (
                <p key={i} className="break-words">
                  {para}
                </p>
              ))}
            </div>
          ) : (
            <p className="reveal-hero-item text-slate-600 text-sm sm:text-base leading-relaxed">
              Empowering learners with practical skills, real-world experience, and comprehensive training designed for modern industry requirements.
            </p>
          )}

          {/* Highlights / Checkpoints */}
          {highlights.length > 0 && (
            <div className="reveal-hero-item grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {highlights.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200/80 text-[#3498db] flex items-center justify-center shrink-0">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-slate-700">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* CTA Buttons */}
          <div className="reveal-hero-item flex flex-wrap gap-4 pt-3">
            <button
              type="button"
              onClick={handleScrollToPricing}
              className="bg-[#3498db] hover:bg-[#2980b9] text-white font-bold px-7 py-3.5 rounded-full font-inter text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#3498db]/30 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-98 cursor-pointer"
            >
              <span>{t('seePricing') || 'SEE PRICING & ENROLL'}</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <button
              type="button"
              onClick={handleScrollToCurriculum}
              className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#3498db] text-slate-800 hover:text-[#3498db] font-bold px-7 py-3.5 rounded-full font-inter text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-98 cursor-pointer"
            >
              <span>VIEW CURRICULUM</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Elevated Program Card / Quick Inquire (5 cols) */}
        <div className="lg:col-span-5 relative w-full">
          <div className="reveal-card bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 relative overflow-hidden">
            
            {/* Top Accent Gradient Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3498db] via-blue-500 to-[#1a5276]" />

            {/* Course Preview Thumbnail if available */}
            {imageSrc && (
              <div className="relative mb-6 rounded-2xl overflow-hidden border border-slate-100 aspect-video bg-slate-50 shadow-sm">
                <img
                  src={imageSrc}
                  alt={displayTitle}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/banner.png';
                  }}
                />
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Verified Program
                </div>
              </div>
            )}

            {/* Quick Program Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Learners Enrolled</span>
                <span className="text-base sm:text-lg font-extrabold text-slate-900">
                  {course.enrolledStudentsCount || (course.enrolledStudents ? course.enrolledStudents.length : 0)}+
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Program Fee</span>
                <span className="text-base sm:text-lg font-extrabold text-[#1a5276]">
                  {course.salePrice != null || course.price != null
                    ? `₹${getDisplayPrice(course.salePrice || course.price)}`
                    : 'Flexible Plans'}
                </span>
              </div>
            </div>

            {/* Interactive Callback / Inquiry Card */}
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-inter text-xl font-bold text-slate-900">
                  Have Questions? <span className="text-[#3498db]">Talk to an Advisor</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Get personalized guidance on syllabus, batches, and career scope.
                </p>
              </div>

              {submitted ? (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-emerald-900">Inquiry Received!</p>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Our academic mentor has received your query regarding <span className="font-semibold text-emerald-900">{course.title || rawTitle}</span> and will call you back shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-3 pt-1">
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#3498db] focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="email"
                      required
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#3498db] focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                    />
                    <input
                      type="tel"
                      required
                      placeholder="Phone Number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#3498db] focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                    />
                  </div>

                  {/* Query Textarea */}
                  <div>
                    <textarea
                      rows={3}
                      placeholder="Write your query or questions here (e.g., syllabus details, batch schedule, prerequisites, career guidance)..."
                      value={formData.query}
                      onChange={(e) => setFormData({ ...formData, query: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#3498db] focus:ring-2 focus:ring-blue-100 transition-all bg-white resize-none"
                    />
                  </div>

                  {errorMessage && (
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 text-white font-bold font-inter text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-98 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Submitting Request...</span>
                      </>
                    ) : (
                      <>
                        <span>Request Callback</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>

      </div>
    </section>
  )
}

export default CourseHeroDetail
