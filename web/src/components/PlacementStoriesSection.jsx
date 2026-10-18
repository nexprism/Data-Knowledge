import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchPlacementStories } from '../redux/slices/placementStorySlice'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { getApiBaseUrl } from '../utils/apiConfig.js'

gsap.registerPlugin(ScrollTrigger)

const PlacementStoriesSection = () => {
  const dispatch = useDispatch()
  const { stories, loading } = useSelector((state) => state.placementStories)
  const containerRef = useRef(null)
  const sliderRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  // In-page Video Player State (runs video without redirecting!)
  const [activeStory, setActiveStory] = useState(null)

  const VITE_IMAGE_URL = getApiBaseUrl()

  useEffect(() => {
    dispatch(fetchPlacementStories())
  }, [dispatch])

  // ESC key listener to close video modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveStory(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (activeStory) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [activeStory])

  // Fallback seed stories if API is still connecting
  const displayStories =
    stories && stories.length > 0
      ? stories.filter((s) => s.isActive !== false)
      : [
          {
            _id: 'default-1',
            studentName: 'Jana',
            role: 'Data Analyst',
            company: 'Johnson & Johnson',
            companyBadge: 'Product Base Company',
            badge: 'Data Analyst - In Just 40 Days',
            instagramUrl: 'https://www.instagram.com/reel/C3_sample1/',
            video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            thumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=688&auto=format&fit=crop',
            handle: 'learn.with.rushikesh',
            likesCount: '103 likes',
            caption: 'Congratulations Jana 💐',
          },
          {
            _id: 'default-2',
            studentName: 'Ms Sharada',
            role: 'Data Analyst',
            company: 'TESCO',
            companyBadge: 'Fortune 500 Retail',
            badge: 'Selected in 45 Days',
            instagramUrl: 'https://www.instagram.com/reel/C3_sample2/',
            video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
            thumbnail: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=688&auto=format&fit=crop',
            handle: 'learn.with.rushikesh',
            likesCount: '48 likes',
            caption: 'Ms Sharada Data Analyst at TESCO',
          },
          {
            _id: 'default-3',
            studentName: 'Aditya',
            role: 'Data Analyst',
            company: 'CROSS COUNTRY',
            companyBadge: 'Global Tech & Analytics',
            badge: 'Data Analyst in Just 90 Days',
            instagramUrl: 'https://www.instagram.com/reel/C3_sample3/',
            video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
            thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=688&auto=format&fit=crop',
            handle: 'learn.with.rushikesh',
            likesCount: '32 likes',
            caption: 'Congratulations Aditya Selected in 90 Days',
          },
          {
            _id: 'default-4',
            studentName: 'Rohan Sharma',
            role: 'BI Analyst',
            company: 'PwC',
            companyBadge: 'Big 4 Consulting',
            badge: 'Non-Tech to Tech Transition',
            instagramUrl: 'https://www.instagram.com/reel/C3_sample4/',
            video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
            thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=688&auto=format&fit=crop',
            handle: 'learn.with.rushikesh',
            likesCount: '185 likes',
            caption: 'Rohan transitioned from mechanical to BI at PwC',
          },
        ]

  useEffect(() => {
    if (!containerRef.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.stories-header-reveal',
        { y: 30, opacity: 0, filter: 'blur(6px)' },
        {
          y: 0,
          opacity: 1,
          filter: 'blur(0px)',
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 85%',
          },
        }
      )

      gsap.fromTo(
        '.story-card-item',
        { y: 35, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sliderRef.current,
            start: 'top 85%',
          },
        }
      )
    }, containerRef)

    return () => ctx.revert()
  }, [displayStories.length])

  const checkScrollability = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current
      setCanScrollLeft(scrollLeft > 10)
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10)
    }
  }

  const scroll = (direction) => {
    if (sliderRef.current) {
      const scrollAmount = sliderRef.current.clientWidth * 0.75
      sliderRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
      setTimeout(checkScrollability, 350)
    }
  }

  const getStoryImageUrl = (thumbnail) => {
    if (!thumbnail) return ''
    if (thumbnail.startsWith('http://') || thumbnail.startsWith('https://')) return thumbnail
    if (thumbnail.startsWith('data:')) return thumbnail
    return `${VITE_IMAGE_URL}/uploads/${thumbnail.replace(/^uploads\//, '')}`
  }

  const getStoryVideoUrl = (video) => {
    if (!video) return ''
    if (video.startsWith('http://') || video.startsWith('https://')) return video
    return `${VITE_IMAGE_URL}/uploads/${video.replace(/^uploads\//, '')}`
  }

  const getInstagramEmbedUrl = (url) => {
    if (!url) return ''
    const match = url.match(/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/)
    if (match && match[1]) {
      // Return the embed url
      return `https://www.instagram.com/reel/${match[1]}/embed`
    }
    return ''
  }

  const handleCardClick = (story) => {
    setActiveStory(story)
  }

  return (
    <section
      ref={containerRef}
      className="relative py-12 md:py-16 overflow-hidden bg-white border-t border-b border-gray-100"
    >
      {/* Subtle clean background ambient accents on white */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-pink-100/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-100/40 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Slider Navigation Buttons */}
        <div className="flex justify-end items-center mb-6">
          <div className="stories-header-reveal flex items-center gap-3">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={`w-11 h-11 rounded-full border border-gray-200 flex items-center justify-center transition-all ${
                canScrollLeft
                  ? 'bg-white text-gray-800 hover:bg-pink-50 hover:text-pink-600 hover:border-pink-300 hover:scale-105 active:scale-95 shadow-md'
                  : 'opacity-40 cursor-not-allowed bg-gray-50 text-gray-400'
              }`}
              aria-label="Previous Stories"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={`w-11 h-11 rounded-full border border-gray-200 flex items-center justify-center transition-all ${
                canScrollRight
                  ? 'bg-white text-gray-800 hover:bg-pink-50 hover:text-pink-600 hover:border-pink-300 hover:scale-105 active:scale-95 shadow-md'
                  : 'opacity-40 cursor-not-allowed bg-gray-50 text-gray-400'
              }`}
              aria-label="Next Stories"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stories Horizontal Slider */}
        <div
          ref={sliderRef}
          onScroll={checkScrollability}
          className="flex gap-6 overflow-x-auto pb-6 pt-2 scrollbar-none snap-x snap-mandatory scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayStories.map((story, index) => {
            const imageUrl = getStoryImageUrl(story.thumbnail)

            return (
              <div
                key={story._id || index}
                onClick={() => handleCardClick(story)}
                className="story-card-item group relative flex-shrink-0 w-[290px] sm:w-[320px] md:w-[340px] aspect-[9/15] rounded-3xl bg-white border border-gray-200/90 hover:border-pink-400/80 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_rgba(236,72,153,0.18)] transition-all duration-500 hover:-translate-y-2 snap-start flex flex-col cursor-pointer select-none"
              >
                {/* 1. Top Instagram Header Bar */}
                <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center justify-between z-20">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Instagram Avatar Gradient Ring */}
                    <div className="w-7 h-7 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shrink-0 shadow-sm">
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                        <svg className="w-3.5 h-3.5 text-pink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                        </svg>
                      </div>
                    </div>

                    {/* Handle & Subtitle */}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 tracking-wide truncate group-hover:text-pink-600 transition-colors">
                        @{story.handle || 'learn.with.rushikesh'}
                      </p>
                      <p className="text-[9px] text-gray-500 font-jetbrains tracking-wider">Original audio</p>
                    </div>
                  </div>

                  {/* Play / Watch Badge */}
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-white bg-gradient-to-r from-pink-600 to-purple-600 group-hover:from-pink-500 group-hover:to-purple-500 transition-colors shrink-0 shadow-sm flex items-center gap-1">
                    <svg className="w-2.5 h-2.5 fill-white" viewBox="0 0 24 24">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Play Video
                  </span>
                </div>

                {/* 2. Visual Story / Reel Viewport */}
                <div className="relative flex-1 w-full bg-slate-900 overflow-hidden">
                  {/* Thumbnail Image */}
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={story.studentName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-center">
                      <div className="w-16 h-16 rounded-full bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 mb-3">
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-bold text-white">{story.studentName}</h4>
                      <p className="text-xs text-pink-300 mt-1">{story.company}</p>
                    </div>
                  )}

                  {/* Vignette Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/50 pointer-events-none" />

                  {/* Top Overlay Badges */}
                  <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-1.5 z-10">
                    {story.companyBadge && (
                      <span className="text-[10px] font-bold font-jetbrains px-2.5 py-0.5 rounded-md bg-blue-600/90 text-white backdrop-blur-md shadow-sm">
                        {story.companyBadge}
                      </span>
                    )}
                    {story.badge && (
                      <span className="text-[10px] font-bold font-jetbrains px-2.5 py-0.5 rounded-md bg-emerald-500/95 text-white backdrop-blur-md shadow-sm">
                        {story.badge}
                      </span>
                    )}
                  </div>

                  {/* Center Play Button Overlay (With Hover Glow Ripple) */}
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-md border border-white/60 flex items-center justify-center text-white transition-all transform group-hover:scale-115 group-hover:bg-white/40 shadow-[0_0_30px_rgba(236,72,153,0.5)]">
                      <svg className="w-7 h-7 fill-white ml-0.5" viewBox="0 0 24 24">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                  </div>

                  {/* Inside Reel Student Placement Badge */}
                  <div className="absolute bottom-3 left-3 right-3 z-10">
                    <div className="p-3 rounded-2xl bg-black/65 backdrop-blur-md border border-white/15 group-hover:border-pink-500/40 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-extrabold font-jetbrains text-amber-300 uppercase tracking-wider">
                          {story.company}
                        </span>
                        <span className="text-[9px] text-gray-200 font-jetbrains">
                          {story.role}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-white leading-tight">
                        Congratulations {story.studentName}
                      </h4>
                      {story.caption && (
                        <p className="text-[11px] text-gray-200 mt-1 line-clamp-2 font-jetbrains">
                          "{story.caption}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Bottom Instagram Action Bar */}
                <div className="px-4 py-3 bg-white border-t border-gray-100 z-20">
                  <div className="flex items-center justify-between mb-2">
                    {/* Heart, Comment, Share */}
                    <div className="flex items-center gap-3 text-gray-700">
                      <svg className="w-5 h-5 text-rose-500 fill-rose-500/20 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                      </svg>
                      <svg className="w-5 h-5 text-gray-700 hover:text-gray-900 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <svg className="w-5 h-5 text-gray-700 hover:text-gray-900 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" x2="11" y1="2" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </div>

                    {/* Bookmark */}
                    <svg className="w-5 h-5 text-gray-700 hover:text-gray-900 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                    </svg>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-jetbrains">
                    <span className="font-bold text-gray-900">{story.likesCount || '103 likes'}</span>
                    <a
                      href={story.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-pink-600 hover:text-pink-700 font-semibold flex items-center gap-1 z-30"
                      title="Open in Instagram"
                    >
                      View on Instagram
                      <svg className="w-3 h-3 hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 17 17 7M7 7h10v10" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* IN-PAGE VIDEO PLAYER MODAL (Runs video WITHOUT redirecting!) */}
      {/* ========================================================= */}
      {activeStory && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActiveStory(null)}
        >
          <div
            className="relative bg-[#0c101d] rounded-3xl border border-white/20 shadow-[0_0_50px_rgba(236,72,153,0.3)] w-full max-w-[400px] sm:max-w-[440px] max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 py-3 bg-black/60 border-b border-white/10 flex items-center justify-between z-30 backdrop-blur-md">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shrink-0">
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                    <svg className="w-3.5 h-3.5 text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                    </svg>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white tracking-wide truncate">
                    @{activeStory.handle || 'learn.with.rushikesh'}
                  </p>
                  <p className="text-[10px] text-amber-300 font-jetbrains truncate">
                    {activeStory.company} • {activeStory.role}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setActiveStory(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shadow-md"
                aria-label="Close Video"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Video Viewport Area (9:16 Aspect Ratio) */}
            <div className="relative aspect-[9/16] w-full bg-black flex items-center justify-center overflow-hidden">
              {activeStory.video ? (
                /* 1. Direct HTML5 Video Player */
                <video
                  src={getStoryVideoUrl(activeStory.video)}
                  poster={getStoryImageUrl(activeStory.thumbnail)}
                  controls
                  autoPlay
                  playsInline
                  loop
                  className="w-full h-full object-cover"
                />
              ) : getInstagramEmbedUrl(activeStory.instagramUrl) ? (
                /* 2. Instagram Embed Player */
                <iframe
                  src={getInstagramEmbedUrl(activeStory.instagramUrl)}
                  className="w-full h-full border-0"
                  allowFullScreen
                  scrolling="no"
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  title={activeStory.studentName}
                />
              ) : (
                /* 3. High Definition Fallback Video / Sample Player */
                <div className="relative w-full h-full">
                  <img
                    src={getStoryImageUrl(activeStory.thumbnail)}
                    alt={activeStory.studentName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60 flex flex-col items-center justify-center p-6 text-center text-white">
                    <div className="w-16 h-16 rounded-full bg-pink-600/30 border border-pink-400/50 flex items-center justify-center text-pink-400 mb-4 shadow-[0_0_30px_rgba(236,72,153,0.5)] animate-pulse">
                      <svg className="w-8 h-8 fill-pink-400 ml-1" viewBox="0 0 24 24">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500 text-white mb-2 shadow-sm">
                      {activeStory.badge || 'Placement Success'}
                    </span>
                    <h3 className="text-xl font-black">{activeStory.studentName}</h3>
                    <p className="text-sm text-amber-300 font-bold mt-1">{activeStory.company}</p>
                    <p className="text-xs text-gray-300 mt-2 max-w-xs">{activeStory.caption}</p>

                    <a
                      href={activeStory.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-600 via-rose-600 to-amber-500 hover:from-pink-500 hover:to-amber-400 text-white text-xs font-bold tracking-wide shadow-lg shadow-pink-500/25 transition-all flex items-center gap-2 active:scale-95"
                    >
                      Watch Full Reel on Instagram
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 17 17 7M7 7h10v10" />
                      </svg>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Placement Information */}
            <div className="p-4 bg-black/90 border-t border-white/10 z-30">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-white">
                    {activeStory.studentName} • {activeStory.company}
                  </h4>
                  <p className="text-xs text-gray-300">{activeStory.role}</p>
                </div>

                <a
                  href={activeStory.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-pink-600/20 border border-pink-500/30 text-pink-400 hover:bg-pink-600/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  Instagram
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M7 17 17 7M7 7h10v10" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default PlacementStoriesSection
