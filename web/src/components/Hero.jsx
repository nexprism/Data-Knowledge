import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import gsap from 'gsap'
import { fetchHeroSection } from '../redux/slices/heroSlice'
import { useLanguage } from '../context/LanguageContext'
import ConsultationModal from './consultation/ConsultationModal'
import { getApiBaseUrl } from '../utils/apiConfig.js'

const Hero = ({ isLoaded }) => {
   const dispatch = useDispatch()
   const { hero } = useSelector((state) => state.hero)
   const [isConsultationOpen, setIsConsultationOpen] = useState(false)
   const containerRef = useRef(null)
   const contentRef = useRef(null)
   const imageRef = useRef(null)
   const { t } = useLanguage()

   const VITE_BASE_URL = getApiBaseUrl()

   useEffect(() => {
      dispatch(fetchHeroSection())
   }, [dispatch])

   useEffect(() => {
      const ctx = gsap.context(() => {
         gsap.fromTo(
            '.hero-reveal',
            { y: 25, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' }
         )
         if (imageRef.current) {
            gsap.fromTo(
               imageRef.current,
               { scale: 1.05, opacity: 0 },
               { scale: 1, opacity: 1, duration: 1.0, ease: 'power3.out' }
            )
         }
      }, containerRef)

      return () => ctx.revert()
   }, [hero])

   // Calculate mentor image source
   const rawImage = hero?.mentorImage || '/data_knowlege/mentor/mentore_2.png'
   const imageSrc =
      rawImage.startsWith('http') || rawImage.startsWith('/')
         ? rawImage
         : `${VITE_BASE_URL}/${rawImage}`

   const headlinePrefix = hero?.headlinePrefix ?? 'Master Practical Data Analytics,'
   const headlineHighlight = hero?.headlineHighlight ?? 'Data Science, ML & AI'
   const description =
      hero?.description ??
      'At Data Knowledge, our mission is to provide practical and industry-focused training in tools like SQL, Excel, Power BI, Tableau, Python, and Business Analysis. Gain real-world skills that companies actually look for in data analyst and data science roles.'

   const showPrimary = hero?.showPrimaryButton !== false
   const primaryText = hero?.primaryButtonText || 'Explore Programs'
   const primaryLink = hero?.primaryButtonLink || '/courses'

   const showSecondary = hero?.showSecondaryButton !== false
   const secondaryText = hero?.secondaryButtonText || 'Book Consultation'
   const isCustomLink =
      hero?.secondaryButtonAction === 'custom_link' && Boolean(hero?.secondaryButtonLink)

   return (
      <section
         ref={containerRef}
         className="relative min-h-[90vh] md:min-h-[95vh] bg-slate-50 flex items-center justify-center overflow-hidden opacity-100 pt-36 md:pt-44 pb-16"
      >
         {/* Subtle Light Mesh Background */}
         <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#3498db]/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-100/60 rounded-full blur-[130px]" />
            <div className="absolute top-[20%] right-[20%] w-[30vw] h-[30vw] bg-[#3498db]/5 rounded-full blur-[90px]" />
         </div>

         {/* Main Container */}
         <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Side: Typography & Core Messaging (7 cols) */}
            <div ref={contentRef} className="lg:col-span-7 flex flex-col items-start space-y-5 pt-2 min-w-0">
               {hero?.badgeText && (
                  <div className="hero-reveal inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/60 text-[#3498db] text-xs font-semibold tracking-wide uppercase">
                     <span className="w-2 h-2 rounded-full bg-[#3498db] animate-pulse" />
                     <span>{hero.badgeText}</span>
                  </div>
               )}

               <div className="flex flex-col w-full min-w-0">
                  <h1 className="hero-reveal font-inter text-3xl sm:text-4xl lg:text-[2.75rem] text-slate-900 font-extrabold leading-[1.18] tracking-tight">
                     {headlinePrefix} <br className="hidden sm:block" />
                     <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3498db] via-blue-600 to-[#1a5276]">
                        {headlineHighlight}
                     </span>
                  </h1>
               </div>

               <p className="hero-reveal font-inter text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed font-normal">
                  {description}
               </p>

               <div className="hero-reveal pt-3 flex gap-3.5 w-full flex-col sm:flex-row flex-wrap">
                  {showPrimary && (
                     primaryLink.startsWith('http') ? (
                        <a
                           href={primaryLink}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="bg-[#3498db] text-white font-bold px-7 py-3.5 rounded-full font-inter text-xs uppercase tracking-wider hover:bg-[#2980b9] transition-all shadow-lg shadow-[#3498db]/30 flex items-center justify-center gap-2 group hover:scale-[1.02] active:scale-98"
                        >
                           <span>{primaryText}</span>
                           <svg
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              className="group-hover:translate-x-1 transition-transform stroke-white"
                           >
                              <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2.5" />
                           </svg>
                        </a>
                     ) : (
                        <Link
                           to={primaryLink}
                           className="bg-[#3498db] text-white font-bold px-7 py-3.5 rounded-full font-inter text-xs uppercase tracking-wider hover:bg-[#2980b9] transition-all shadow-lg shadow-[#3498db]/30 flex items-center justify-center gap-2 group hover:scale-[1.02] active:scale-98"
                        >
                           <span>{primaryText}</span>
                           <svg
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              className="group-hover:translate-x-1 transition-transform stroke-white"
                           >
                              <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2.5" />
                           </svg>
                        </Link>
                     )
                  )}

                  {showSecondary && (
                     isCustomLink ? (
                        hero.secondaryButtonLink.startsWith('http') ? (
                           <a
                              href={hero.secondaryButtonLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-7 py-3.5 rounded-full font-inter text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-98"
                           >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                 <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                 <line x1="16" y1="2" x2="16" y2="6" />
                                 <line x1="8" y1="2" x2="8" y2="6" />
                                 <line x1="3" y1="10" x2="21" y2="10" />
                              </svg>
                              <span>{secondaryText}</span>
                           </a>
                        ) : (
                           <Link
                              to={hero.secondaryButtonLink}
                              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-7 py-3.5 rounded-full font-inter text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-98"
                           >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                 <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                 <line x1="16" y1="2" x2="16" y2="6" />
                                 <line x1="8" y1="2" x2="8" y2="6" />
                                 <line x1="3" y1="10" x2="21" y2="10" />
                              </svg>
                              <span>{secondaryText}</span>
                           </Link>
                        )
                     ) : (
                        <button
                           type="button"
                           onClick={() => setIsConsultationOpen(true)}
                           className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-7 py-3.5 rounded-full font-inter text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-98"
                        >
                           <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                           </svg>
                           <span>{secondaryText}</span>
                        </button>
                     )
                  )}
               </div>
            </div>

            {/* Right Side: Mentor Image (5 cols) */}
            <div className="lg:col-span-5 relative w-full flex items-center justify-center min-w-0">
               {/* Ambient Backdrop Glow for Mentors */}
               <div className="absolute w-[260px] sm:w-[340px] h-[260px] sm:h-[340px] bg-gradient-to-tr from-[#3498db]/25 via-sky-300/20 to-transparent rounded-full blur-3xl pointer-events-none" />

               {/* Mentors Subject Image */}
               <img
                  ref={imageRef}
                  src={imageSrc}
                  alt={hero?.mentorImageAlt || 'Data Knowledge Mentors'}
                  className="relative z-10 w-full max-w-[380px] sm:max-w-[420px] lg:max-w-[460px] h-auto object-contain drop-shadow-2xl"
                  onError={(e) => {
                     // Fallback to local image if uploaded image fails to load
                     e.currentTarget.onerror = null
                     e.currentTarget.src = '/data_knowlege/mentor/mentore_2.png'
                  }}
               />
            </div>
         </div>

         {/* Consultation Booking Modal */}
         {isConsultationOpen && (
            <ConsultationModal
               isOpen={isConsultationOpen}
               onClose={() => setIsConsultationOpen(false)}
            />
         )}
      </section>
   )
}

export default Hero
