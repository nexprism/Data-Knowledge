import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getApiBaseUrl } from '../utils/apiConfig.js'

// Star Icon component
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

// Quote Icon component
const QuoteIcon = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
  </svg>
)

// Check Circle Badge Icon
const CheckBadgeIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25z" clipRule="evenodd" />
  </svg>
)

// Close Icon for Lightbox
const CloseIcon = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

// WhatsApp / Chat Proof Icon
const ChatProofIcon = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
)

// Expand / Zoom Icon
const ExpandIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
)

// Helper to get initials from a student's name
const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'S'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return (name.trim().slice(0, 2) || 'S').toUpperCase()
}

// Consistent subtle gradient generator based on name hash
const getAvatarGradient = (name = '') => {
  const gradients = [
    'from-blue-600 to-sky-600',
    'from-sky-500 to-indigo-600',
    'from-[#1b6294] to-[#3498db]',
    'from-indigo-600 to-blue-500',
    'from-teal-600 to-[#3498db]',
    'from-blue-700 to-cyan-600',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % gradients.length
  return gradients[index]
}

// Single Testimonial Card with Uniform Layout & Robust Fallbacks
const TestimonialCard = ({ testimonial, mediaUrl, onOpenScreenshot }) => {
  const [avatarError, setAvatarError] = useState(false)
  const [screenshotError, setScreenshotError] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const studentName = testimonial.name || testimonial.userId?.fullName || 'Verified Learner'
  const studentRole = testimonial.role || 'Data Analytics Alum'
  const ratingCount = Math.max(1, Math.min(5, Number(testimonial.rating) || 5))
  const isLongMessage = (testimonial.message?.length || 0) > 170

  const avatarUrl = useMemo(() => mediaUrl(testimonial.image), [testimonial.image, mediaUrl])

  const screenshots = useMemo(() => {
    const list = [
      ...(Array.isArray(testimonial.reviewImages) ? testimonial.reviewImages : []),
      testimonial.screenshot,
    ].filter((value, index, arr) => value && arr.indexOf(value) === index)
    return list.map(mediaUrl).filter(Boolean)
  }, [testimonial.reviewImages, testimonial.screenshot, mediaUrl])

  const firstScreenshot = screenshots[0] || null
  const hasValidScreenshot = Boolean(firstScreenshot && !screenshotError)

  return (
    <article className="group h-full flex flex-col justify-between bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(52,152,219,0.08)] hover:shadow-[0_16px_36px_-12px_rgba(52,152,219,0.18)] hover:border-[#3498db]/40 transition-all duration-300">
      <div>
        {/* Uniform Top Header (Always identical height & alignment across all cards) */}
        <div className="flex items-start justify-between gap-3 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Student Avatar with graceful initials fallback */}
            {!avatarError && avatarUrl ? (
              <img
                src={avatarUrl}
                alt={studentName}
                onError={() => setAvatarError(true)}
                className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-slate-200/80 shadow-xs"
              />
            ) : (
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(
                  studentName
                )} text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-blue-500/20 shrink-0 select-none`}
              >
                {getInitials(studentName)}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-extrabold text-slate-900 text-[15px] sm:text-base tracking-tight truncate group-hover:text-[#1b6294] transition-colors">
                  {studentName}
                </h3>
                <span
                  title="Verified Course Graduate"
                  className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60 shrink-0"
                >
                  <CheckBadgeIcon className="w-3 h-3 text-emerald-600" />
                  Verified
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 truncate mt-0.5">
                {studentRole}
              </p>
            </div>
          </div>

          {/* Rating Stars & Top Quote */}
          <div className="flex flex-col items-end shrink-0">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon key={i} filled={i < ratingCount} className="w-3.5 h-3.5" />
              ))}
              <span className="text-[11px] font-extrabold text-amber-500 ml-1">
                {Number(ratingCount).toFixed(1)}
              </span>
            </div>
            <div className="text-blue-100 group-hover:text-blue-300 transition-colors mt-1">
              <QuoteIcon className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Testimonial Quote Message */}
        <p className={`mt-5 text-slate-700 text-sm sm:text-[14.5px] leading-relaxed font-normal whitespace-pre-line ${!isExpanded ? 'line-clamp-4' : ''}`}>
          "{testimonial.message}"
        </p>
        {isLongMessage && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-[#1b6294] hover:text-[#3498db] transition-colors cursor-pointer"
          >
            {isExpanded ? 'Read less ↑' : 'Read more ↓'}
          </button>
        )}

        {/* Attached WhatsApp / Review Screenshot Proof (Cleanly Integrated) */}
        {hasValidScreenshot && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() =>
                onOpenScreenshot({
                  url: firstScreenshot,
                  name: studentName,
                  role: studentRole,
                  message: testimonial.message,
                })
              }
              className="w-full group/shot block rounded-2xl overflow-hidden border border-slate-200/80 hover:border-[#3498db]/60 transition-all duration-200 bg-slate-50 text-left cursor-pointer shadow-2xs hover:shadow-md"
            >
              <div className="relative h-44 w-full bg-slate-100 overflow-hidden flex items-center justify-center">
                <img
                  src={firstScreenshot}
                  alt={`${studentName} review proof screenshot`}
                  onError={() => setScreenshotError(true)}
                  className="w-full h-full object-cover object-top group-hover/shot:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex items-end justify-between p-3">
                  <div className="flex items-center gap-1.5 text-white">
                    <ChatProofIcon className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold drop-shadow-xs">WhatsApp / Review Proof</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/95 text-slate-800 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-xs shadow-xs">
                    <ExpandIcon className="w-2.5 h-2.5 text-[#3498db]" />
                    View
                  </span>
                </div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-400">
        <span className="inline-flex items-center gap-1.5 text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3498db]" />
          Data Knowledge Alum
        </span>
        {hasValidScreenshot ? (
          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider">
            Screenshot Attached
          </span>
        ) : (
          <span className="text-slate-400 text-[10px] font-medium uppercase tracking-wider">
            Verified Review
          </span>
        )}
      </div>
    </article>
  )
}

// Skeleton Card for Production-Ready Background Loading
const TestimonialSkeletonCard = () => (
  <div className="h-[280px] bg-white rounded-3xl border border-slate-200/70 p-6 sm:p-7 shadow-xs animate-pulse flex flex-col justify-between">
    <div>
      <div className="flex items-start justify-between pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-200 shrink-0" />
          <div className="space-y-2">
            <div className="w-28 h-4 rounded-md bg-slate-200" />
            <div className="w-20 h-3 rounded-md bg-slate-100" />
          </div>
        </div>
        <div className="w-16 h-4 rounded-md bg-slate-100" />
      </div>
      <div className="mt-5 space-y-2.5">
        <div className="w-full h-3 rounded-md bg-slate-200" />
        <div className="w-11/12 h-3 rounded-md bg-slate-200" />
        <div className="w-3/4 h-3 rounded-md bg-slate-100" />
      </div>
    </div>
    <div className="mt-5 pt-3 border-t border-slate-100 flex justify-between">
      <div className="w-24 h-3 rounded-md bg-slate-100" />
      <div className="w-16 h-3 rounded-md bg-slate-100" />
    </div>
  </div>
)

// Main Testimonials Page Component
const Testimonials = () => {
  const baseUrl = getApiBaseUrl()
  const PAGE_SIZE = 9

  const [testimonials, setTestimonials] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [loadMoreError, setLoadMoreError] = useState('')
  const [activeScreenshotModal, setActiveScreenshotModal] = useState(null)
  const [filterMode, setFilterMode] = useState('all') // 'all' | 'proof'

  const observerTargetRef = useRef(null)
  const isFetchingRef = useRef(false)
  const pageRef = useRef(page)
  pageRef.current = page
  const hasMoreRef = useRef(hasMore)
  hasMoreRef.current = hasMore

  const mediaUrl = useCallback(
    (value) => {
      if (!value) return ''
      if (/^https?:\/\//i.test(value)) return value
      return `${baseUrl}/${String(value).replace(/\\/g, '/').replace(/^\/+/, '')}`
    },
    [baseUrl]
  )

  // Fetch a specific page and append (or replace if targetPage === 1)
  const fetchPage = useCallback(
    async (targetPage, isInitial = false) => {
      if (isFetchingRef.current) return
      isFetchingRef.current = true

      if (isInitial) {
        setLoadingInitial(true)
        setError('')
      } else {
        setLoadingMore(true)
        setLoadMoreError('')
      }

      try {
        const response = await fetch(`${baseUrl}/testimonials?page=${targetPage}&limit=${PAGE_SIZE}`)
        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(data?.message || 'Failed to fetch testimonials')
        }

        const newItems = Array.isArray(data?.data) ? data.data : []
        const pagination = data?.pagination || { total: 0, totalPages: 1 }

        setTestimonials((prev) => {
          if (isInitial || targetPage === 1) return newItems
          // Deduplicate by _id
          const existingIds = new Set(prev.map((item) => String(item._id)))
          const uniqueNewItems = newItems.filter((item) => !existingIds.has(String(item._id)))
          return [...prev, ...uniqueNewItems]
        })

        setTotalCount(pagination.total || 0)
        setPage(targetPage)

        const totalPages = pagination.totalPages || Math.ceil((pagination.total || 0) / PAGE_SIZE) || 1
        const moreAvailable = targetPage < totalPages && newItems.length > 0
        setHasMore(moreAvailable)
      } catch (err) {
        if (isInitial) {
          setError(err.message || 'Failed to load testimonials')
        } else {
          setLoadMoreError(err.message || 'Unable to load more testimonials right now')
        }
      } finally {
        isFetchingRef.current = false
        if (isInitial) setLoadingInitial(false)
        setLoadingMore(false)
      }
    },
    [baseUrl, PAGE_SIZE]
  )

  // Initial load on mount
  useEffect(() => {
    fetchPage(1, true)
  }, [fetchPage])

  // Native IntersectionObserver for infinite background scroll
  useEffect(() => {
    const target = observerTargetRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0]
        if (
          firstEntry.isIntersecting &&
          hasMoreRef.current &&
          !isFetchingRef.current &&
          !loadingInitial
        ) {
          const nextPage = pageRef.current + 1
          fetchPage(nextPage, false)
        }
      },
      {
        root: null,
        rootMargin: '260px', // Pre-fetch 260px before user reaches bottom for seamless experience
        threshold: 0.05,
      }
    )

    observer.observe(target)
    return () => {
      observer.disconnect()
    }
  }, [fetchPage, loadingInitial])

  // Fallback scroll listener (in case Lenis or window events bypass intersection observer)
  useEffect(() => {
    let scrollTimeout = null

    const handleScroll = () => {
      if (scrollTimeout) return
      scrollTimeout = setTimeout(() => {
        scrollTimeout = null
        if (!hasMoreRef.current || isFetchingRef.current || loadingInitial) return

        const scrollPosition = window.innerHeight + window.scrollY
        const scrollThreshold = document.documentElement.scrollHeight - 400

        if (scrollPosition >= scrollThreshold) {
          const nextPage = pageRef.current + 1
          fetchPage(nextPage, false)
        }
      }, 150)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      if (scrollTimeout) clearTimeout(scrollTimeout)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [fetchPage, loadingInitial])

  // Keyboard accessibility for Lightbox Modal
  useEffect(() => {
    if (!activeScreenshotModal) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveScreenshotModal(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeScreenshotModal])

  // Filtered testimonials (All vs With Proof)
  const displayTestimonials = useMemo(() => {
    if (filterMode === 'proof') {
      return testimonials.filter((item) => {
        const hasShot = Boolean(item.screenshot)
        const hasReviewImages = Array.isArray(item.reviewImages) && item.reviewImages.length > 0
        return hasShot || hasReviewImages
      })
    }
    return testimonials
  }, [testimonials, filterMode])

  return (
    <main className="min-h-screen bg-slate-50/60 pt-32 sm:pt-36 pb-28 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#1b6294] hover:text-[#3498db] transition-colors group mb-4"
        >
          <span className="p-1 rounded-lg bg-blue-50 text-[#3498db] group-hover:-translate-x-0.5 transition-transform">
            ←
          </span>
          Back to Home
        </Link>

        {/* Hero Section */}
        <div className="mt-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3498db]/10 border border-[#3498db]/20 text-[#1b6294] text-xs font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3498db] animate-pulse" />
            100% Authentic Student Proof
          </div>
          <h1 className="mt-4 text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            Learner <span className="text-[#3498db]">Testimonials</span>
          </h1>
          <p className="mt-4 text-slate-600 text-sm sm:text-base md:text-lg leading-relaxed font-normal">
            Read real feedback and WhatsApp results from students who transitioned into Data Analytics, SQL, Excel, and Power BI roles with Data Knowledge mentorship.
          </p>

        </div>

        <div className="mt-8 border-b border-slate-200/80" />

        {/* Initial Error State */}
        {error && (
          <div className="mt-12 p-6 rounded-3xl bg-red-50 border border-red-200 text-center max-w-lg mx-auto">
            <p className="text-sm font-bold text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => fetchPage(1, true)}
              className="mt-4 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Initial Loading Skeleton */}
        {loadingInitial && (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {Array.from({ length: 6 }).map((_, idx) => (
              <TestimonialSkeletonCard key={`init-skel-${idx}`} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loadingInitial && !error && displayTestimonials.length === 0 && (
          <div className="mt-16 text-center py-16 px-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs max-w-xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#3498db] flex items-center justify-center mx-auto mb-4 font-black text-xl">
              DK
            </div>
            <h3 className="text-lg font-black text-slate-900">No testimonials found</h3>
            <p className="mt-2 text-sm text-slate-500">
              {filterMode === 'proof'
                ? 'No reviews with attached screenshots matched this filter.'
                : 'Approved learner reviews will appear here soon.'}
            </p>
            {filterMode === 'proof' && (
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className="mt-4 px-4 py-2 rounded-xl bg-[#3498db] text-white text-xs font-bold hover:bg-[#1b6294] transition-colors cursor-pointer"
              >
                View all reviews
              </button>
            )}
          </div>
        )}

        {/* Testimonials Uniform Responsive Grid */}
        {!loadingInitial && displayTestimonials.length > 0 && (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 items-stretch">
            {displayTestimonials.map((testimonial) => (
              <TestimonialCard
                key={testimonial._id}
                testimonial={testimonial}
                mediaUrl={mediaUrl}
                onOpenScreenshot={(modalData) => setActiveScreenshotModal(modalData)}
              />
            ))}

            {/* Skeletons displayed while loading subsequent pages in background */}
            {loadingMore &&
              Array.from({ length: 3 }).map((_, idx) => (
                <TestimonialSkeletonCard key={`more-skel-${idx}`} />
              ))}
          </div>
        )}

        {/* Intersection Observer Sentinel for Auto Background Loading */}
        <div ref={observerTargetRef} className="h-12 w-full mt-4 pointer-events-none" />

        {/* Loading More Spinner Indicator */}
        {loadingMore && (
          <div className="mt-8 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full border-3 border-[#3498db]/20 border-t-[#3498db] animate-spin" />
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Loading more learner stories...
            </span>
          </div>
        )}

        {/* Load More Error with Retry Button */}
        {loadMoreError && (
          <div className="mt-10 flex flex-col items-center justify-center gap-3">
            <p className="text-xs font-bold text-red-600">{loadMoreError}</p>
            <button
              type="button"
              onClick={() => fetchPage(page + 1, false)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              Retry Loading More
            </button>
          </div>
        )}

        {/* End of Stream / Call to Action */}
        {!loadingInitial && !hasMore && displayTestimonials.length > 0 && (
          <div className="mt-16 mx-auto max-w-2xl bg-gradient-to-br from-[#08192b] via-[#0d2a4a] to-[#08192b] text-white p-8 sm:p-10 rounded-3xl shadow-xl text-center border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#3498db]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Take the First Step Toward Your Dream Job!
              </h3>
              <p className="text-sm sm:text-base text-slate-300 font-normal max-w-lg mx-auto">
                Explore our courses and start building your future in Data Analytics.
              </p>
              <div className="pt-3">
                <Link
                  to="/courses"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#3498db] hover:bg-[#2980b9] text-white text-sm font-bold shadow-lg shadow-[#3498db]/30 transition-all hover:scale-105"
                >
                  Explore Courses →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal for WhatsApp / Screenshot Proof */}
      {activeScreenshotModal && (
        <div
          className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActiveScreenshotModal(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/90">
              <div className="text-left min-w-0 pr-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-extrabold text-slate-900 truncate">
                    {activeScreenshotModal.name}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold tracking-wide uppercase shrink-0">
                    Verified WhatsApp Proof
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                  {activeScreenshotModal.role}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveScreenshotModal(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all cursor-pointer shrink-0"
                title="Close modal"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Image Body */}
            <div className="p-4 sm:p-6 bg-slate-100 overflow-y-auto flex items-center justify-center min-h-[280px]">
              <img
                src={activeScreenshotModal.url}
                alt={`${activeScreenshotModal.name} review proof`}
                className="max-h-[68vh] w-auto max-w-full rounded-2xl object-contain shadow-md border border-slate-200 bg-white"
              />
            </div>

            {/* Modal Footer */}
            {activeScreenshotModal.message && (
              <div className="p-4 bg-white border-t border-slate-100">
                <p className="text-xs text-slate-600 line-clamp-3 italic">
                  "{activeScreenshotModal.message}"
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

export default Testimonials
