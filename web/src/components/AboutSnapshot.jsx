import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAboutSnapshot } from '../redux/slices/aboutSnapshotSlice';
import { getApiBaseUrl } from '../utils/apiConfig.js';

gsap.registerPlugin(ScrollTrigger);

const AboutSnapshot = () => {
   const dispatch = useDispatch();
   const { data: aboutSnapshot } = useSelector((state) => state.aboutSnapshot);
   const containerRef = useRef(null);
   const imageRef = useRef(null);
   const textRef = useRef(null);

   const VITE_BASE_URL = getApiBaseUrl();

   useEffect(() => {
      dispatch(fetchAboutSnapshot());
   }, [dispatch]);

   useEffect(() => {
      const ctx = gsap.context(() => {
         // Text stagger on left
         gsap.from('.snapshot-text', {
            scrollTrigger: {
               trigger: containerRef.current,
               start: 'top 80%',
            },
            y: 25,
            opacity: 0,
            duration: 0.8,
            stagger: 0.08,
            ease: 'power3.out'
         });

         // Image entrance on right
         gsap.from(imageRef.current, {
            scrollTrigger: {
               trigger: containerRef.current,
               start: 'top 80%',
            },
            x: 35,
            opacity: 0,
            duration: 1,
            ease: 'power3.out'
         });
      }, containerRef);

      return () => ctx.revert();
   }, [aboutSnapshot]);

   if (aboutSnapshot?.isActive === false) {
      return null;
   }

   const badgeText = aboutSnapshot?.badgeText || 'About Data Knowledge';
   const headlinePrefix = aboutSnapshot?.headlinePrefix || 'Empowering Learners with';
   const headlineHighlight = aboutSnapshot?.headlineHighlight || 'Real-World Skills.';
   const paragraph1 = aboutSnapshot?.paragraph1 || 'At Data Knowledge, our mission is to provide practical and industry-focused training in tools like SQL, Excel, Power BI, Tableau, Python, and Business Analysis. Our courses are designed to help learners gain real-world skills that companies actually look for in data analyst and data science roles.';
   const paragraph2 = aboutSnapshot?.paragraph2 || 'The training programs focus on hands-on learning, real-time projects, and step-by-step guidance so that students can confidently work on real business problems. Whether you are a beginner starting your data analytics journey or a working professional looking to upgrade your skills, our courses are structured to support your career growth.';

   const bulletPoints = Array.isArray(aboutSnapshot?.bulletPoints) && aboutSnapshot.bulletPoints.length > 0
      ? aboutSnapshot.bulletPoints
      : [
         "Hands-on training in SQL, Excel, Power BI, Tableau, Python & Business Analysis",
         "Learn from real industry experts with experience in Data Analytics, ML & AI",
         "Job-ready preparation with resume building, mock interviews & real-time projects",
         "Continuous project support, code reviews & personalized career mentorship"
      ];

   const showPrimary = aboutSnapshot?.showPrimaryButton !== false;
   const primaryText = aboutSnapshot?.primaryButtonText || 'Discover More About Us';
   const primaryLink = aboutSnapshot?.primaryButtonLink || '/about-us';

   const showSecondary = aboutSnapshot?.showSecondaryButton !== false;
   const secondaryText = aboutSnapshot?.secondaryButtonText || 'Explore Courses';
   const secondaryLink = aboutSnapshot?.secondaryButtonLink || '/courses';

   const rawImage = aboutSnapshot?.image || '/hero_section.png';
   const imageSrc = rawImage.startsWith('http') || rawImage.startsWith('/')
      ? rawImage
      : `${VITE_BASE_URL}/${rawImage}`;
   const imageAlt = aboutSnapshot?.imageAlt || 'Data Knowledge Practical Learning';

   return (
      <section ref={containerRef} className="py-20 md:py-24 bg-white text-slate-900 relative overflow-hidden border-t border-slate-200">
         {/* Decorative background accents */}
         <div className="absolute top-0 left-0 w-[35rem] h-[35rem] bg-blue-50/70 rounded-full blur-[100px] -z-10 -translate-x-1/3 -translate-y-1/3" />
         <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-slate-100 rounded-full blur-[100px] -z-10 translate-x-1/3 translate-y-1/3" />
         
         <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            
            {/* Left: Text Content */}
            <div ref={textRef} className="w-full lg:w-1/2 min-w-0 order-2 lg:order-1 space-y-4">
               <div className="snapshot-text inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#3498db]/10 border border-[#3498db]/25 text-[#1f6696] text-[11px] font-bold uppercase tracking-wider font-jetbrains">
                  <span className="w-2 h-2 rounded-full bg-[#3498db] animate-pulse" />
                  {badgeText}
               </div>
               
               <h2 className="snapshot-text text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 leading-[1.2] tracking-tight">
                  {headlinePrefix} <br className="hidden sm:inline" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3498db] via-blue-600 to-[#1a5276]">
                     {headlineHighlight}
                  </span>
               </h2>
               
               {paragraph1 && (
                  <p className="snapshot-text text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed font-normal">
                     {paragraph1}
                  </p>
               )}

               {paragraph2 && (
                  <p className="snapshot-text text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed font-normal">
                     {paragraph2}
                  </p>
               )}

               {bulletPoints.length > 0 && (
                  <ul className="snapshot-text space-y-2.5 pt-1">
                     {bulletPoints.map((item, index) => (
                        <li key={index} className="flex items-start gap-2.5 text-slate-700 text-xs sm:text-sm font-normal">
                           <div className="shrink-0 w-5 h-5 rounded-full bg-[#3498db]/15 text-[#2980b9] flex items-center justify-center mt-0.5">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                 <polyline points="20 6 9 17 4 12" />
                              </svg>
                           </div>
                           <span className="break-words">{item}</span>
                        </li>
                     ))}
                  </ul>
               )}

               <div className="snapshot-text flex flex-wrap gap-3.5 pt-3">
                  {showPrimary && (
                     <Link 
                        to={primaryLink} 
                        className="inline-flex items-center justify-center gap-2 bg-[#3498db] text-white px-7 py-3.5 rounded-full font-bold uppercase tracking-wider text-xs hover:bg-[#2980b9] transition-all duration-300 shadow-md shadow-[#3498db]/25 hover:scale-105 active:scale-95 group"
                     >
                        <span>{primaryText}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
                           <line x1="5" y1="12" x2="19" y2="12" />
                           <polyline points="12 5 19 12 12 19" />
                        </svg>
                     </Link>
                  )}
                  {showSecondary && (
                     <Link 
                        to={secondaryLink} 
                        className="inline-flex items-center justify-center gap-2 bg-[#3498db]/10 border border-[#3498db]/30 text-[#1a5276] px-6 py-3.5 rounded-full font-bold uppercase tracking-wider text-xs hover:bg-[#3498db]/20 transition-all duration-300"
                     >
                        <span>{secondaryText}</span>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                           <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                     </Link>
                  )}
               </div>
            </div>

            {/* Right: Visual Representation */}
            <div ref={imageRef} className="w-full lg:w-1/2 relative min-w-0 order-1 lg:order-2">
               <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 bg-slate-100 aspect-[4/3]">
                  <img 
                     src={imageSrc} 
                     alt={imageAlt} 
                     className="w-full h-full object-cover"
                     onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80";
                     }}
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/20 via-transparent to-transparent" />
               </div>
            </div>

         </div>
      </section>
   );
};

export default AboutSnapshot;
