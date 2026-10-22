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

  const VITE_IMAGE_URL = getApiBaseUrl()

  useEffect(() => {
    dispatch(fetchPlacementStories())
  }, [dispatch])

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
            const embedUrl = getInstagramEmbedUrl(story.instagramUrl)

            return (
              <div
                key={story._id || index}
                className="story-card-item flex-shrink-0 w-[300px] sm:w-[325px] md:w-[340px] h-[520px] sm:h-[560px] rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1.5 snap-start bg-slate-900 border border-gray-100"
              >
                {story.video ? (
                  <video
                    src={getStoryVideoUrl(story.video)}
                    controls
                    playsInline
                    className="w-full h-full object-cover bg-black"
                  />
                ) : embedUrl ? (
                  <iframe
                    src={embedUrl}
                    className="w-full h-full border-0 bg-black"
                    allowFullScreen
                    scrolling="no"
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    title={story.studentName || 'Instagram Story'}
                  />
                ) : (
                  <a
                    href={story.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-full flex flex-col items-center justify-center p-6 text-white text-center bg-slate-900"
                  >
                    <p className="text-sm font-semibold">{story.studentName}</p>
                    <span className="text-xs text-pink-400 mt-2">View on Instagram &rarr;</span>
                  </a>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default PlacementStoriesSection
