import React, { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProvenResults } from '../redux/slices/provenResultSlice'
import { getApiBaseUrl } from '../utils/apiConfig.js'

const ProvenResultsSection = () => {
  const dispatch = useDispatch()
  const { results } = useSelector((state) => state.provenResults)
  const marqueeRef = useRef(null)

  useEffect(() => {
    dispatch(fetchProvenResults())
  }, [dispatch])

  // Fallback items in case API is loading or empty (matches exact Admin schema)
  const fallbackResults = [
    {
      _id: 'fb-1',
      studentName: 'Puja Kumari',
      company: 'ITC INFOTECH',
      salary: 'Salary: 12 LPA',
      transitionTag: 'PLACED IN 83 DAYS',
      badge: 'Success Story',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=688&auto=format&fit=crop',
    },
    {
      _id: 'fb-2',
      studentName: 'Rushikesh Tawre',
      company: 'IPG MEDIABRANDS',
      salary: 'Salary: 10 LPA',
      transitionTag: 'NON-TECH TO TECH TRANSITION',
      badge: 'Success Story',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=688&auto=format&fit=crop',
    },
    {
      _id: 'fb-3',
      studentName: 'Abhishek Bhole',
      company: 'L&T',
      salary: 'Placed in 90 Days',
      transitionTag: 'MECHANICAL TO DATA ANALYST',
      badge: 'Success Story',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=688&auto=format&fit=crop',
    },
    {
      _id: 'fb-4',
      studentName: 'Deepshi Soami',
      company: 'TCS & CGI',
      salary: 'Salary: 15 LPA',
      transitionTag: 'NON-TECH TO TECH TRANSITION',
      badge: 'Success Story',
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=688&auto=format&fit=crop',
    },
    {
      _id: 'fb-5',
      studentName: 'Neha Mane',
      company: 'JP MORGAN',
      salary: 'Salary: 4 LPA',
      transitionTag: 'CS TO DATA ANALYST',
      badge: 'Success Story',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=688&auto=format&fit=crop',
    },
    {
      _id: 'fb-6',
      studentName: 'Suraj Deshmukh',
      company: 'ACCENTURE',
      salary: 'Salary: 13.5 LPA',
      transitionTag: 'NON-IT TO DATA ENGINEER',
      badge: 'Success Story',
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=688&auto=format&fit=crop',
    },
    {
      _id: 'fb-7',
      studentName: 'Ananya Gupta',
      company: 'GOOGLE PARTNER',
      salary: 'Salary: 18 LPA',
      transitionTag: 'PLACED IN 60 DAYS',
      badge: 'Success Story',
      image: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?q=80&w=688&auto=format&fit=crop',
    },
    {
      _id: 'fb-8',
      studentName: 'Kunal Verma',
      company: 'PWC',
      salary: 'Salary: 11 LPA',
      transitionTag: 'BCOM TO DATA ANALYST',
      badge: 'Success Story',
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=688&auto=format&fit=crop',
    },
  ]

  const activeResults = results && results.length > 0 ? results : fallbackResults
  // Duplicate list 3 times for a seamless infinite marquee
  const displayResults = [...activeResults, ...activeResults, ...activeResults]

  const getImageSrc = (img) => {
    if (!img) return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=688&auto=format&fit=crop'
    if (img.startsWith('http')) return img
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/uploads/${img}`
  }

  const cleanBadgeText = (badge) => {
    if (!badge) return ''
    return badge.replace(/★\s*/g, '').trim()
  }

  return (
    <section className="relative w-full bg-white text-slate-900 py-16 sm:py-20 overflow-hidden border-y border-slate-100">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-blue-50/50 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Header Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10 mb-10 sm:mb-12 space-y-2.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3498db]/10 border border-[#3498db]/20 text-[#1b6294] text-[11px] font-bold font-jetbrains tracking-wider uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3498db]" />
          Student Placements
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight font-inter">
          Our Proven Results
        </h2>

        <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto font-normal leading-relaxed font-inter">
          Join 300+ students who have successfully transitioned into high-paying data roles at top companies like Accenture, Google, and PwC.
        </p>
      </div>

      {/* Marquee Track Container */}
      <div className="relative w-full overflow-hidden group">
        {/* Left & Right Gradient Shadows for Seamless Fade */}
        <div className="absolute left-0 inset-y-0 w-12 sm:w-28 bg-gradient-to-r from-white via-white/90 to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 inset-y-0 w-12 sm:w-28 bg-gradient-to-l from-white via-white/90 to-transparent z-20 pointer-events-none" />

        {/* Marquee Animated Strip */}
        <div
          ref={marqueeRef}
          className="flex gap-6 w-max py-3 group-hover:[animation-play-state:paused]"
          style={{
            animation: 'marquee-left 45s linear infinite',
          }}
        >
          {displayResults.map((item, index) => {
            const badgeText = cleanBadgeText(item.badge)

            return (
              <div
                key={`${item._id}-${index}`}
                className="w-[260px] sm:w-[280px] shrink-0 rounded-2xl bg-white border border-slate-200 p-2.5 shadow-sm hover:shadow-md hover:border-[#3498db] hover:-translate-y-1 transition-all duration-300 group/card flex flex-col justify-between"
              >
                {/* Photo Area */}
                <div className="relative h-56 sm:h-60 rounded-xl overflow-hidden bg-slate-100">
                  <img
                    src={getImageSrc(item.image)}
                    alt={item.studentName}
                    className="w-full h-full object-cover object-top group-hover/card:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Clean Badge without Emoji */}
                  {badgeText && (
                    <span className="absolute top-2.5 left-2.5 bg-emerald-600 text-white font-bold text-[10px] tracking-wider px-2.5 py-0.5 rounded-full uppercase shadow-xs">
                      {badgeText}
                    </span>
                  )}
                </div>

                {/* Bottom Box: Exactly Matches Admin Panel Data */}
                <div className="bg-slate-50/90 rounded-xl p-3.5 mt-2.5 text-center flex flex-col items-center justify-between border border-slate-100">
                  <h4 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight font-inter line-clamp-1">
                    {item.studentName}
                  </h4>
                  <p className="text-xs font-bold text-[#1b6294] font-inter tracking-wider uppercase mt-0.5 line-clamp-1">
                    {item.company}
                  </p>

                  {item.salary && (
                    <div className="mt-2.5 w-full py-1.5 px-3 rounded-lg border border-blue-200 bg-blue-50/90 text-[#1b6294] font-extrabold text-xs tracking-wide">
                      {item.salary}
                    </div>
                  )}

                  {item.transitionTag && (
                    <div className="mt-1.5 w-full py-1 px-2 rounded-md bg-white border border-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-wider line-clamp-1">
                      {item.transitionTag}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default ProvenResultsSection

