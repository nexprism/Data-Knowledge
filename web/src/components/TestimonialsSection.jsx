import React, { useEffect, useState, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchTestimonials,
  submitTestimonial,
  resetSubmitStatus,
} from '../redux/slices/testimonialSlice'
import { getApiBaseUrl } from '../utils/apiConfig.js'

const StarIcon = ({ filled = true, className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? '#f59e0b' : 'none'}
    stroke={filled ? '#f59e0b' : '#cbd5e1'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

const SparklesIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
  </svg>
)

const MessagePlusIcon = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <line x1="9" y1="10" x2="15" y2="10" />
    <line x1="12" y1="7" x2="12" y2="13" />
  </svg>
)

const QuoteIcon = ({ className = 'w-7 h-7' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
  </svg>
)

const CheckCircleIcon = ({ className = 'w-8 h-8' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const CloseIcon = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const PlayIcon = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
)

const UploadIcon = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

const GridIcon = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
)

const MarqueeIcon = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="13 17 18 12 13 7" />
    <polyline points="6 17 11 12 6 7" />
  </svg>
)

const ChevronDownIcon = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const ChevronUpIcon = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="18 15 12 9 6 15" />
  </svg>
)

const ChevronLeftIcon = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const ChevronRightIcon = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

// Single Testimonial Card Component
const ReviewCard = ({ item, getImageSrc, onOpenVideo, onOpenScreenshot, isGrid = false, showScreenshot = false }) => {
  const avatar = getImageSrc(item.image)
  const studentName = item.name || item.userId?.fullName || 'Verified Student'
  const studentRole = item.role || 'Data Analytics Alum'
  const ratingCount = Number(item.rating) || 5
  const hasVideo = Boolean(item.video)

  const reviewImages = useMemo(() => {
    const list = []
    if (Array.isArray(item.reviewImages) && item.reviewImages.length > 0) {
      item.reviewImages.forEach(img => {
        const src = getImageSrc(img)
        if (src && !list.includes(src)) list.push(src)
      })
    }
    if (item.screenshot) {
      const src = getImageSrc(item.screenshot)
      if (src && !list.includes(src)) list.unshift(src)
    }
    return list
  }, [item.reviewImages, item.screenshot, getImageSrc])

  const cardClasses = isGrid
    ? 'w-full h-full bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(52,152,219,0.08)] hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between select-none group text-left'
    : 'w-[320px] sm:w-[380px] md:w-[420px] shrink-0 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(52,152,219,0.08)] hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between select-none group text-left'

  return (
    <div className={cardClasses}>
      <div>
        {/* Rating Stars & Top Quote */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <StarIcon
                key={i}
                filled={i < ratingCount}
                className="w-4 h-4"
              />
            ))}
            <span className="text-[11px] font-extrabold text-amber-500 ml-1.5">
              {Number(ratingCount).toFixed(1)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {hasVideo && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenVideo(item)
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-[#3498db] text-[10px] font-bold transition-all border border-blue-200/60 cursor-pointer"
                title="Watch video review"
              >
                <PlayIcon className="w-2.5 h-2.5" />
                Video
              </button>
            )}
            <div className="text-blue-100 group-hover:text-blue-300 transition-colors">
              <QuoteIcon className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
          </div>
        </div>

        {/* Review Quote Text */}
        <p className="text-slate-700 text-sm sm:text-[14.5px] leading-relaxed line-clamp-4 font-normal">
          "{item.message}"
        </p>

        {/* Attached Review Screenshot Proof */}
        {showScreenshot && reviewImages.length > 0 && (
          <div className="mt-4 pt-3.5 border-t border-slate-100 md:flex md:items-start md:gap-4">
            {reviewImages.length === 1 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (onOpenScreenshot) {
                    onOpenScreenshot({
                      images: reviewImages,
                      currentIndex: 0,
                      url: reviewImages[0],
                      name: studentName,
                      role: studentRole,
                      message: item.message,
                    })
                  }
                }}
                className="w-full md:w-36 md:shrink-0 flex flex-col items-center gap-2 p-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#3498db]/50 transition-all duration-200 cursor-pointer text-left group/shot"
              >
                <div className="w-full h-52 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-sm relative">
                  <img
                    src={reviewImages[0]}
                    alt="Review Screenshot"
                    className="w-full h-full object-contain group-hover/shot:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1 text-center md:text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-slate-800 group-hover/shot:text-[#1b6294] transition-colors">
                      Review Screenshot
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-50 text-[#1b6294] font-extrabold tracking-wide uppercase">
                      Proof
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                    Click to view full review image
                  </p>
                </div>
              </button>
            ) : (
              <div className="p-2.5 rounded-2xl bg-gradient-to-r from-emerald-50/50 to-slate-50 border border-emerald-200/60 md:w-36 md:shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-slate-800">
                      Review Proofs
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold tracking-wide uppercase">
                      {reviewImages.length} Images
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Click to view gallery
                  </span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto">
                  {reviewImages.slice(0, 3).map((rSrc, rIdx) => (
                    <div
                      key={rIdx}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (onOpenScreenshot) {
                          onOpenScreenshot({
                            images: reviewImages,
                            currentIndex: rIdx,
                            url: rSrc,
                            name: studentName,
                            role: studentRole,
                            message: item.message,
                          })
                        }
                      }}
                      className="relative w-24 h-52 rounded-xl overflow-hidden bg-slate-950 border border-emerald-200/80 shrink-0 cursor-pointer group/thumb hover:border-emerald-400 shadow-xs"
                    >
                      <img
                        src={rSrc}
                        alt={`Proof ${rIdx + 1}`}
                        className="w-full h-full object-contain group-hover/thumb:scale-105 transition-transform duration-300"
                      />
                      {rIdx === 2 && reviewImages.length > 3 && (
                        <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center text-white text-[11px] font-extrabold">
                          +{reviewImages.length - 3}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Student Profile Info */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          {avatar ? (
            <img
              src={avatar}
              alt={studentName}
              className="w-11 h-11 rounded-full object-cover border-2 border-blue-100 shrink-0"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#3498db] to-[#2980b9] text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-blue-500/20 shrink-0">
              {studentName.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="overflow-hidden">
            <h4 className="font-black text-slate-900 text-sm tracking-tight truncate group-hover:text-[#3498db] transition-colors">
              {studentName}
            </h4>
            <p className="text-xs font-semibold text-slate-500 truncate">
              {studentRole}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const TestimonialsSection = () => {
  const dispatch = useDispatch()
  const { testimonials, loading, submitting, submitSuccess, error } = useSelector(
    (state) => state.testimonials
  )

  const [viewMode, setViewMode] = useState('marquee') // 'marquee' | 'grid'
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeVideoItem, setActiveVideoItem] = useState(null)
  const [activeScreenshotModal, setActiveScreenshotModal] = useState(null) // Screenshot Lightbox Modal
  const [showAllGrid, setShowAllGrid] = useState(false) // Show More in Grid View
  const gridSectionRef = useRef(null)

  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [message, setMessage] = useState('')
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [screenshotFile, setScreenshotFile] = useState(null)
  const [screenshotPreview, setScreenshotPreview] = useState('')

  // 2 rows in standard 3-column grid = 6 items
  const INITIAL_GRID_ITEMS = 6

  useEffect(() => {
    dispatch(fetchTestimonials())
  }, [dispatch])

  useEffect(() => {
    if (submitSuccess) {
      const timer = setTimeout(() => {
        setIsModalOpen(false)
        setName('')
        setRole('')
        setMessage('')
        setRating(5)
        setImageFile(null)
        setImagePreview('')
        setScreenshotFile(null)
        setScreenshotPreview('')
        dispatch(resetSubmitStatus())
        dispatch(fetchTestimonials())
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [submitSuccess, dispatch])

  useEffect(() => {
    if (!activeScreenshotModal) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveScreenshotModal(null)
      } else if (e.key === 'ArrowLeft') {
        const imgs = activeScreenshotModal.images || (activeScreenshotModal.url ? [activeScreenshotModal.url] : [])
        if (imgs.length > 1) {
          const cur = activeScreenshotModal.currentIndex || 0
          const prevIdx = (cur - 1 + imgs.length) % imgs.length
          setActiveScreenshotModal((prev) => ({
            ...prev,
            currentIndex: prevIdx,
            url: imgs[prevIdx],
          }))
        }
      } else if (e.key === 'ArrowRight') {
        const imgs = activeScreenshotModal.images || (activeScreenshotModal.url ? [activeScreenshotModal.url] : [])
        if (imgs.length > 1) {
          const cur = activeScreenshotModal.currentIndex || 0
          const nextIdx = (cur + 1) % imgs.length
          setActiveScreenshotModal((prev) => ({
            ...prev,
            currentIndex: nextIdx,
            url: imgs[nextIdx],
          }))
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeScreenshotModal])



  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleScreenshotChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setScreenshotFile(file)
      setScreenshotPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || !message.trim()) {
      alert('Please provide your name and review message.')
      return
    }

    const formData = new FormData()
    formData.append('name', name.trim())
    formData.append('role', role.trim() || 'Student')
    formData.append('message', message.trim())
    formData.append('rating', String(rating))
    if (imageFile) {
      formData.append('image', imageFile)
    }
    if (screenshotFile) {
      formData.append('screenshot', screenshotFile)
    }

    dispatch(submitTestimonial(formData))
  }

  const getImageSrc = (img) => {
    if (!img) return null
    if (img.startsWith('http')) return img
    const baseUrl = getApiBaseUrl()
    const cleanImg = img.replace(/\\/g, '/').replace(/^\/+/, '')
    return `${baseUrl}/${cleanImg}`
  }

  const getVideoSrc = (vid) => {
    if (!vid) return null
    if (vid.startsWith('http')) return vid
    const baseUrl = getApiBaseUrl()
    const cleanVid = vid.replace(/\\/g, '/').replace(/^\/+/, '')
    return `${baseUrl}/${cleanVid}`
  }

  const mergedList = Array.isArray(testimonials) ? testimonials : []

  // Split into 2 rows and duplicate items so the marquee flows seamlessly without jump
  const { track1, track2 } = useMemo(() => {
    if (mergedList.length === 0) {
      return { track1: [], track2: [] }
    }

    const mid = Math.ceil(mergedList.length / 2)
    let r1 = mergedList.slice(0, mid)
    let r2 = mergedList.slice(mid)
    if (r2.length === 0) r2 = [...r1]

    // Ensure at least 6 items per track before duplication for seamless endless scrolling
    while (r1.length < 6) {
      r1 = [...r1, ...r1]
    }
    while (r2.length < 6) {
      r2 = [...r2, ...r2]
    }

    return {
      track1: [...r1, ...r1],
      track2: [...r2, ...r2],
    }
  }, [mergedList])

  // Visible items for Grid View
  const visibleGridItems = useMemo(() => {
    if (showAllGrid) {
      return mergedList
    }
    return mergedList.slice(0, INITIAL_GRID_ITEMS)
  }, [mergedList, showAllGrid])

  const hasMoreGridReviews = mergedList.length > INITIAL_GRID_ITEMS

  const handleToggleGridMore = () => {
    if (showAllGrid) {
      setShowAllGrid(false)
      // Scroll smoothly to top of reviews section
      if (gridSectionRef.current) {
        gridSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else {
      setShowAllGrid(true)
    }
  }

  return (
    <section
      id="testimonials"
      ref={gridSectionRef}
      className="relative w-full bg-slate-50/70 py-20 sm:py-28 overflow-hidden border-t border-slate-200/80 scroll-mt-20"
    >
      {/* Background Soft Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-sky-200/30 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div className="max-w-2xl text-left">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#3498db]/10 border border-[#3498db]/20 text-[#1b6294] text-[11px] font-bold font-jetbrains tracking-wider uppercase mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3498db]" />
              Student Reviews & Stories
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              Loved by Thousands of <span className="text-[#3498db]">Learners</span>
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed font-normal">
              Read authentic feedback from students who transformed their careers with Data Knowledge masterclasses and mentorship.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              to="/testimonials"
              className="px-4 py-2 rounded-xl border border-[#3498db]/30 text-[#1b6294] text-xs font-bold hover:bg-[#3498db]/10 transition-colors"
            >
              See more testimonials
            </Link>
            {/* View Mode Toggle */}
            <div className="inline-flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-xs">
              <button
                onClick={() => setViewMode('marquee')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'marquee'
                    ? 'bg-[#3498db] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MarqueeIcon className="w-3.5 h-3.5" />
                Marquee Stream
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#3498db] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GridIcon className="w-3.5 h-3.5" />
                Grid View
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MARQUEE STREAM VIEW (Dynamic Endless Rows) */}
      {viewMode === 'marquee' && (
        <div className="w-full flex flex-col gap-6 overflow-hidden relative group">
          {/* Edge Blur Gradients */}
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-slate-50 to-transparent z-20 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-slate-50 to-transparent z-20 pointer-events-none" />

          {/* Row 1: Leftward infinite marquee */}
          <div className="flex overflow-hidden w-full select-none">
            <div className="flex shrink-0 gap-6 animate-marquee-left">
              {track1.map((item, idx) => (
                <ReviewCard
                  key={`r1-${item._id || idx}-${idx}`}
                  item={item}
                  getImageSrc={getImageSrc}
                  onOpenVideo={(vItem) => setActiveVideoItem(vItem)}
                  onOpenScreenshot={(sItem) => setActiveScreenshotModal(sItem)}
                />
              ))}
            </div>
          </div>

          {/* Row 2: Rightward infinite marquee */}
          <div className="flex overflow-hidden w-full select-none">
            <div className="flex shrink-0 gap-6 animate-marquee-right">
              {track2.map((item, idx) => (
                <ReviewCard
                  key={`r2-${item._id || idx}-${idx}`}
                  item={item}
                  getImageSrc={getImageSrc}
                  onOpenVideo={(vItem) => setActiveVideoItem(vItem)}
                  onOpenScreenshot={(sItem) => setActiveScreenshotModal(sItem)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* GRID VIEW WITH "SHOW MORE" OPTION */}
      {viewMode === 'grid' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleGridItems.map((item, idx) => (
              <div
                key={`grid-${item._id || idx}`}
                className="animate-in fade-in zoom-in-95 duration-300"
              >
                <ReviewCard
                  item={item}
                  getImageSrc={getImageSrc}
                  onOpenVideo={(vItem) => setActiveVideoItem(vItem)}
                  onOpenScreenshot={(sItem) => setActiveScreenshotModal(sItem)}
                  isGrid={true}
                />
              </div>
            ))}
          </div>

          {/* Show More / Show Less Button */}
          {hasMoreGridReviews && (
            <div className="mt-12 flex flex-col items-center justify-center">
              <button
                onClick={handleToggleGridMore}
                className="group relative inline-flex items-center gap-2.5 px-7 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 hover:text-[#3498db] font-extrabold text-sm border-2 border-slate-200 hover:border-[#3498db]/60 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <span>
                  {showAllGrid
                    ? 'Show Less Reviews'
                    : `Show More Reviews (+${mergedList.length - INITIAL_GRID_ITEMS} more)`}
                </span>
                <span className="p-1 rounded-lg bg-blue-50 text-[#3498db] group-hover:bg-[#3498db] group-hover:text-white transition-colors">
                  {showAllGrid ? (
                    <ChevronUpIcon className="w-4 h-4" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4" />
                  )}
                </span>
              </button>

              <p className="text-xs text-slate-500 mt-2.5 font-medium">
                Showing {visibleGridItems.length} of {mergedList.length} verified reviews
              </p>
            </div>
          )}
        </div>
      )}

      {/* VIDEO POPUP MODAL */}
      {activeVideoItem && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div>
                <h4 className="font-bold text-white text-base">
                  {activeVideoItem.name || 'Student Review'}
                </h4>
                <p className="text-xs text-slate-400">
                  {activeVideoItem.role || 'Data Analytics Alum'}
                </p>
              </div>
              <button
                onClick={() => setActiveVideoItem(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-black flex items-center justify-center">
              <video
                src={getVideoSrc(activeVideoItem.video)}
                controls
                autoPlay
                className="w-full max-h-[60vh] rounded-2xl object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* REVIEW SCREENSHOT LIGHTBOX MODAL */}
      {activeScreenshotModal && (() => {
        const modalImages = Array.isArray(activeScreenshotModal.images) && activeScreenshotModal.images.length > 0
          ? activeScreenshotModal.images
          : (activeScreenshotModal.url ? [activeScreenshotModal.url] : [])
        const currentIndex = typeof activeScreenshotModal.currentIndex === 'number'
          ? Math.max(0, Math.min(activeScreenshotModal.currentIndex, modalImages.length - 1))
          : 0
        const currentUrl = modalImages[currentIndex] || activeScreenshotModal.url

        const handlePrev = (e) => {
          e?.stopPropagation?.()
          if (modalImages.length <= 1) return
          const newIdx = (currentIndex - 1 + modalImages.length) % modalImages.length
          setActiveScreenshotModal({
            ...activeScreenshotModal,
            currentIndex: newIdx,
            url: modalImages[newIdx],
          })
        }

        const handleNext = (e) => {
          e?.stopPropagation?.()
          if (modalImages.length <= 1) return
          const newIdx = (currentIndex + 1) % modalImages.length
          setActiveScreenshotModal({
            ...activeScreenshotModal,
            currentIndex: newIdx,
            url: modalImages[newIdx],
          })
        }

        const handleSelectThumb = (idx, e) => {
          e?.stopPropagation?.()
          setActiveScreenshotModal({
            ...activeScreenshotModal,
            currentIndex: idx,
            url: modalImages[idx],
          })
        }

        return (
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setActiveScreenshotModal(null)}
          >
            <div
              className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/90">
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">
                      {activeScreenshotModal.name || 'Student Review'}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold tracking-wide uppercase">
                      Verified Proof
                    </span>
                    {modalImages.length > 1 && (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-100 text-[#2980b9] font-bold">
                        {currentIndex + 1} / {modalImages.length}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {activeScreenshotModal.role || 'Student'}
                  </p>
                </div>

                <button
                  onClick={() => setActiveScreenshotModal(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all cursor-pointer"
                  title="Close"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Image viewer with Prev / Next overlay arrows */}
              <div className="relative p-3 sm:p-4 bg-slate-950 flex items-center justify-center overflow-hidden min-h-[300px] max-h-[62vh] flex-1">
                {modalImages.length > 1 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-sm transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer border border-white/20"
                    title="Previous proof image"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                )}

                <img
                  src={currentUrl}
                  alt={`Review Proof ${currentIndex + 1}`}
                  className="max-h-[58vh] w-auto max-w-full rounded-xl object-contain shadow-md"
                />

                {modalImages.length > 1 && (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-sm transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer border border-white/20"
                    title="Next proof image"
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Thumbnail Strip (if multiple images) */}
              {modalImages.length > 1 && (
                <div className="px-6 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2 overflow-x-auto justify-center">
                  {modalImages.map((imgSrc, tIdx) => (
                    <button
                      key={tIdx}
                      type="button"
                      onClick={(e) => handleSelectThumb(tIdx, e)}
                      className={`relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        tIdx === currentIndex
                          ? 'border-[#3498db] scale-105 shadow-md shadow-blue-500/30'
                          : 'border-slate-700 opacity-60 hover:opacity-100 hover:border-slate-500'
                      }`}
                    >
                      <img
                        src={imgSrc}
                        alt={`Thumb ${tIdx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Footer with quote */}
              {activeScreenshotModal.message && (
                <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 text-left">
                  <p className="text-xs sm:text-sm text-slate-700 font-normal italic line-clamp-2">
                    "{activeScreenshotModal.message}"
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* STUDENT TESTIMONIAL SUBMISSION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
          <div className="relative w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0">
              <div className="text-left">
                <h3 className="text-lg sm:text-xl font-black text-slate-900">Share Your Experience</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your review will be submitted to the Data Knowledge team for display.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  dispatch(resetSubmitStatus())
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer shrink-0 ml-2"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="text-center p-8 sm:p-12 overflow-y-auto">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Thank You for Your Feedback!</h3>
                <p className="text-sm text-slate-600 mt-2 max-w-sm mx-auto">
                  Your review has been submitted successfully and will appear on the website.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden flex-1 text-left">
                {/* Scrollable Form Body */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  {error && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                      {error}
                    </div>
                  )}

                  {/* Rating Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Your Rating
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 transition-transform hover:scale-110 cursor-pointer"
                        >
                          <StarIcon
                            filled={star <= (hoverRating || rating)}
                            className="w-7 h-7"
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-slate-600 ml-2">
                        {rating} / 5 Stars
                      </span>
                    </div>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pooja Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Role / Company */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Role & Company / Background
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Data Analyst @ Accenture"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Review Message */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Your Review / Testimonial <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Describe how the course helped you, key projects learned, and interview experience..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Photo / Profile Picture (Optional)
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 cursor-pointer transition-all">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                          <UploadIcon className="w-4 h-4" />
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <span className="text-xs font-bold text-slate-700 block truncate">
                          {imageFile ? imageFile.name : 'Upload your photo'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          JPG, PNG up to 5MB
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Review Screenshot Upload */}
                  <div>
                    <label className="block text-xs font-bold text-emerald-700 mb-1.5">
                      Review Screenshot / Chat Proof (Optional)
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 cursor-pointer transition-all">
                      {screenshotPreview ? (
                        <img
                          src={screenshotPreview}
                          alt="Screenshot Preview"
                          className="w-10 h-10 rounded-lg object-cover shrink-0 border border-emerald-400"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                          <UploadIcon className="w-4 h-4" />
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <span className="text-xs font-bold text-slate-700 block truncate">
                          {screenshotFile ? screenshotFile.name : 'Upload review screenshot'}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-medium">
                          WhatsApp, LinkedIn, Google Review, etc.
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Fixed Modal Footer */}
                <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false)
                      dispatch(resetSubmitStatus())
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 text-xs font-bold text-white bg-[#3498db] hover:bg-[#2980b9] rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default TestimonialsSection
