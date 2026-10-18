import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import RollingText from '../components/RollingText'
import CourseCard from '../components/CourseCard'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import { useDispatch, useSelector } from 'react-redux'
import { fetchPersonalityResults } from '../redux/slices/personalitySlice'
import { useLanguage } from '../context/LanguageContext'
import { getImageBaseUrl } from '../utils/apiConfig'

const resultData = {
  type: 'ENFP',
  name: 'Campaigner',
  shortIntro: 'Enthusiastic, creative, and sociable free spirits, who can always find a reason to smile.',
  tags: ['EXTROVERTED', 'INTUITIVE', 'FEELING', 'PROSPECTING'],
  traits: [
    { left: 'INTROVERTED', right: 'EXTROVERTED', score: 100, activeSide: 'right' },
    { left: 'OBSERVANT', right: 'INTUITIVE', score: 88, activeSide: 'right' },
    { left: 'THINKING', right: 'FEELING', score: 100, activeSide: 'right' },
    { left: 'JUDGING', right: 'PROSPECTING', score: 91, activeSide: 'right' },
  ],
  tabs: {
    overview: {
      title: 'Characteristics',
      content: [
        'ENFPs, also known as Campaigners, are enthusiastic, creative, and sociable free spirits.',
        'They are extroverted, intuitive, feeling and perceiving.',
        'ENFPs are known for their infectious energy and enthusiasm, their deep curiosity about the world, and their ability to inspire and motivate others.',
        'They thrive on human connections and seek to understand and explore new possibilities and ideas.'
      ]
    },
    strengths: {
      title: 'Strengths',
      content: [
        'Excellent communicators and motivators who inspire those around them.',
        'Highly creative with a unique ability to connect seemingly unrelated ideas.',
        'Intuitive and empathetic, able to understand others\' deeper emotions and motivations.',
        'Passionate about personal growth and exploring fresh perspectives.'
      ]
    },
    career: {
      title: 'Career Paths',
      content: [
        'Creative fields such as writing, design, and entertainment.',
        'People-oriented roles like counseling, coaching, and public relations.',
        'Innovative environments where brainstorming and unconventional ideas are valued.',
        'Non-profit and advocacy work that aligns with their personal values.'
      ]
    }
  },
  recommendedCourses: [
    { 
        id: 1, 
        category: "MARKETING",
        title: "Vibe Marketing", 
        description: "Build a brand that resonates on a human level. Master the art of emotional connection as an ENFP.",
        price: "$199.00",
        image: "/editorial_portrait_narrative_1775068974772.png" 
    },
    { 
        id: 2, 
        category: "ENTREPRENEURSHIP",
        title: "Solopreneur", 
        description: "Turn your creative energy into a sustainable business model that preserves your freedom.",
        price: "$249.00",
        image: "/minimalist_desk_premium_1775068995445.png" 
    },
    { 
        id: 3, 
        category: "ADVERTISING",
        title: "Facebook Ads Mastery", 
        description: "Reach the right audience with your message through precise targeting and storytelling.",
        price: "$159.00",
        image: "/architecture_page_preview_1775068911256.png" 
    }
  ]
}

const DashboardPersonality = () => {
  const containerRef = useRef(null)
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const { results, loading } = useSelector((state) => state.personality)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    dispatch(fetchPersonalityResults())
  }, [dispatch])

  useLayoutEffect(() => {
    if (results) {
      window.scrollTo(0, 0)
      const ctx = gsap.context(() => {
        gsap.fromTo('.result-reveal', 
          { y: 40, autoAlpha: 0, filter: 'blur(10px)' },
          { y: 0, autoAlpha: 1, filter: 'blur(0px)', duration: 1.2, ease: 'power4.out', stagger: 0.15 }
        )
      }, containerRef)
      return () => ctx.revert()
    }
  }, [results])

  if (loading && !results) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <span className="font-jetbrains text-[10px] text-accent tracking-[0.5em] animate-pulse uppercase">Synchronizing Neural Profile...</span>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-dark">
        <DashboardHeader />
        <main className="pt-40 pb-24 px-4 md:px-12 flex flex-col items-center justify-center text-center">
           <div className="w-32 h-32 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-10 group">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-description group-hover:text-accent transition-colors duration-500">
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
              </svg>
           </div>
           <h2 className="font-inter text-5xl text-normal font-extralight mb-6 tracking-tighter">{t('noNeuralData')}</h2>
           <p className="font-jetbrains text-[9px] text-description/80 tracking-[0.4em] uppercase mb-12 max-w-sm leading-relaxed">{t('cognitiveNotCalibrated')}</p>
           <Link 
            to="/personality-test"
            className="px-20 py-5 bg-accent text-dark font-montserrat text-[14px] font-bold tracking-[0.5em] uppercase hover:scale-105 transition-all duration-500"
           >
            {t('startAssessment')}
           </Link>
        </main>
      </div>
    )
  }

  // Map real data if available, fallback to mock for structure demo
  const resultsObj = Array.isArray(results) ? results[0] : results
  
  const displayData = {
    type: resultsObj?.personalityType || resultData.type,
    name: resultsObj?.personalityType === 'ENFP' ? 'Campaigner' : (resultsObj?.personalityType || resultData.name),
    shortIntro: resultsObj?.overview || resultData.shortIntro,
    tags: [
        resultsObj?.stats?.extroversionRatio > 50 ? 'EXTROVERTED' : 'INTROVERTED',
        resultsObj?.stats?.intuitionRatio > 50 ? 'INTUITIVE' : 'OBSERVANT',
        resultsObj?.stats?.feelingRatio > 50 ? 'FEELING' : 'THINKING',
        resultsObj?.stats?.perceivingRatio > 50 ? 'PROSPECTING' : 'JUDGING'
    ],
    traits: [
        { left: 'INTROVERTED', right: 'EXTROVERTED', score: resultsObj?.stats?.extroversionRatio || 50, activeSide: resultsObj?.stats?.extroversionRatio > 50 ? 'right' : 'left' },
        { left: 'OBSERVANT', right: 'INTUITIVE', score: resultsObj?.stats?.intuitionRatio || 50, activeSide: resultsObj?.stats?.intuitionRatio > 50 ? 'right' : 'left' },
        { left: 'THINKING', right: 'FEELING', score: resultsObj?.stats?.feelingRatio || 50, activeSide: resultsObj?.stats?.feelingRatio > 50 ? 'right' : 'left' },
        { left: 'JUDGING', right: 'PROSPECTING', score: resultsObj?.stats?.perceivingRatio || 50, activeSide: resultsObj?.stats?.perceivingRatio > 50 ? 'right' : 'left' },
    ],
    tabs: {
        overview: {
            title: 'Characteristics',
            content: resultsObj?.overview ? [resultsObj.overview] : resultData.tabs.overview.content
        },
        strengths: {
            title: 'Strengths',
            content: resultsObj?.strengths?.strengths || resultData.tabs.strengths.content
        },
        weaknesses: {
            title: 'Development Areas',
            content: resultsObj?.strengths?.weaknesses || []
        },
        career: {
            title: 'Career Environment',
            content: resultsObj?.career ? [resultsObj.career.environment, ...(resultsObj.career.careers || [])] : resultData.tabs.career.content
        }
    },
    recommendedCourses: resultsObj?.suitableCourses?.map(c => ({
        id: c._id,
        category: c.categoryId?.name?.toUpperCase() || "SKILL",
        title: c.title,
        description: c.description,
        image: c.thumbnail ? (c.thumbnail.startsWith('http') ? c.thumbnail : `${getImageBaseUrl()}/${c.thumbnail.replace(/^\/+/, '')}`) : "/news_placeholder.png"
    })) || resultData.recommendedCourses
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-dark selection:bg-accent/40 selection:text-white">
      <DashboardHeader />
      
      <main className="pt-32 pb-24 px-4 md:px-12 relative overflow-hidden">
         {/* Background Subtle Elements */}
         <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
            <div className="absolute top-1/4 -left-20 w-[800px] h-[800px] border border-accent/20 blur-[150px] opacity-20 rounded-full" />
            <div className="absolute bottom-1/4 -right-20 w-[600px] h-[600px] border border-accent/10 blur-[120px] opacity-10 rounded-full" />
         </div>

         <div className="max-w-[1600px] mx-auto relative z-10">
            {/* 1. Profile Summary Header */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-12 lg:gap-20 mb-24 result-reveal opacity-0 invisible">
                <div className="w-48 h-48 bg-accent rounded-[3rem] flex items-center justify-center shadow-[0_0_80px_rgba(139, 92, 246,0.3)] shrink-0 group hover:scale-105 transition-transform duration-500">
                   <div className="text-center">
                     <span className="block text-dark font-jetbrains text-5xl font-bold tracking-tighter leading-none mb-1">{displayData.type}</span>
                     <span className="block text-dark/60 font-jetbrains text-[9px] font-bold tracking-[0.2em] uppercase">Core Frequency</span>
                   </div>
                </div>
                <div className="text-center md:text-left pt-4">
                   <p className="font-jetbrains text-[8px] text-accent font-black tracking-[0.6em] uppercase mb-4">Analysis Synchronized</p>
                   <h1 className="font-inter text-4xl md:text-6xl text-normal font-extralight mb-6 tracking-tighter leading-none">
                     Type: <span className="text-accent underline-lime">{displayData.name}</span>
                   </h1>
                   <p className="font-montserrat text-[14px] md:text-xs text-description/80 max-w-2xl leading-relaxed uppercase tracking-[0.3em] mb-10">
                     {displayData.shortIntro}
                   </p>
                   <div className="flex flex-wrap justify-center md:justify-start gap-4">
                     {displayData.tags.map((tag, i) => (
                         <span key={i} className="px-6 py-2 border border-white/10 rounded-full font-jetbrains text-[8px] font-bold text-accent tracking-[0.2em] bg-white/5 uppercase">
                             {tag}
                         </span>
                     ))}
                   </div>
                </div>
            </div>

            {/* 2. Calibration & Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 mb-32">
                {/* Left: Traits */}
                <div className="lg:col-span-5 space-y-10 result-reveal opacity-0 invisible">
                   <div className="flex items-center gap-6 mb-12">
                      <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse shadow-[0_0_10px_#8B5CF6]" />
                      <h3 className="font-jetbrains text-[9px] font-bold tracking-[0.5em] text-normal uppercase">Biological Calibration</h3>
                   </div>
                   {displayData.traits.map((trait, i) => (
                      <div key={i} className="group cursor-default">
                        <div className="flex justify-between items-center mb-5">
                            <span className={`font-jetbrains text-[8px] font-bold tracking-[0.3em] transition-colors duration-500 ${trait.activeSide === 'left' ? 'text-accent' : 'text-description/80'}`}>{trait.left}</span>
                            <span className={`font-jetbrains text-[8px] font-bold tracking-[0.3em] transition-colors duration-500 ${trait.activeSide === 'right' ? 'text-accent' : 'text-description/80'}`}>{trait.right}</span>
                        </div>
                        <div className="h-[1.5px] bg-white/5 rounded-full relative overflow-hidden">
                            <div 
                              className="absolute h-full bg-accent shadow-[0_0_20px_#8B5CF6] transition-all duration-[2000ms] ease-out"
                              style={{ width: `${trait.score}%`, left: trait.activeSide === 'right' ? 'auto' : 0, right: trait.activeSide === 'right' ? 0 : 'auto' }}
                            />
                        </div>
                        <div className="mt-3 flex justify-between">
                            <span className="font-jetbrains text-[7px] text-description/80 tracking-[0.4em] uppercase">SYSTEM THRESHOLD 99.8%</span>
                            <span className="font-jetbrains text-[9px] font-bold text-accent tracking-widest">{trait.score}% {trait.activeSide === 'right' ? trait.right : trait.left}</span>
                        </div>
                      </div>
                   ))}
                </div>

                {/* Right: Detailed Analysis Tabs */}
                <div className="lg:col-span-7 flex flex-col result-reveal opacity-0 invisible">
                    <div className="flex border-b border-white/5 mb-10 overflow-x-auto no-scrollbar scrollbar-hide">
                        {Object.keys(displayData.tabs).map((tabKey) => (
                            <button
                                key={tabKey}
                                onClick={() => setActiveTab(tabKey)}
                                className={`px-10 py-5 font-jetbrains text-[9px] font-bold tracking-[0.5em] uppercase transition-all relative shrink-0
                                    ${activeTab === tabKey ? 'text-accent' : 'text-description/80 hover:text-normal'}`}
                            >
                                {tabKey}
                                {activeTab === tabKey && (
                                    <div className="absolute bottom-0 left-0 w-full h-[1.5px] bg-accent shadow-[0_0_10px_#8B5CF6]" />
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 p-10 md:p-14 lg:p-16 rounded-[2rem] flex-1 backdrop-blur-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-5">
                            <span className="font-jetbrains text-[90px] font-black tracking-tighter text-white leading-none">0{Object.keys(displayData.tabs).indexOf(activeTab) + 1}</span>
                        </div>
                        <h4 className="font-inter text-4xl text-normal mb-10 font-extralight tracking-tight underline-lime decoration-accent/30">{displayData.tabs[activeTab].title}</h4>
                        <div className="space-y-8">
                            {displayData.tabs[activeTab].content.map((p, i) => (
                                <p key={i} className="font-montserrat text-[14px] text-description/80 leading-[2.2] tracking-widest uppercase">
                                    <span className="text-accent/30 mr-4 font-bold">»</span> {p}
                                </p>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Recommended Architecture Section */}
            <div className="result-reveal pt-12 border-t border-white/5 opacity-0 invisible">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-20">
                    <div>
                        <h2 className="font-inter text-5xl md:text-6xl text-normal font-extralight mb-4 tracking-tighter">Recommended Architecture</h2>
                        <p className="font-jetbrains text-[9px] text-description/80 tracking-[0.5em] uppercase">Accelerated learning paths tailored to your frequency.</p>
                    </div>
                    <Link 
                      to="/dashboard/courses"
                      className="px-10 py-5 border border-white/10 font-jetbrains text-[9px] font-bold tracking-[0.4em] uppercase text-description/80 hover:text-normal hover:bg-white/5 transition-all duration-500 rounded-full"
                    >
                      Browse Full Catalog
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-24">
                   {displayData.recommendedCourses.map((course) => (
                     <CourseCard key={course.id} item={course} />
                   ))}
                </div>

                <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-12 border-t border-white/5">
                   <Link 
                      to="/personality-test"
                      className="group flex items-center gap-6 px-12 py-5 border border-white/10 font-jetbrains text-[9px] font-bold tracking-[0.4em] uppercase text-description/80 hover:text-normal hover:bg-white/5 transition-all duration-500 rounded-full"
                   >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:rotate-180 transition-transform duration-700 opacity-40">
                         <path d="M2.5 2v6h6M21.5 22v-6h-6M22 11.5A10 10 0 0 0 3.2 7.2M2 12.5a10 10 0 0 0 18.8 4.3" />
                      </svg>
                      {t('retakeProtocol')}
                   </Link>
                   <Link 
                      to="/dashboard"
                      className="group relative px-20 py-5 bg-accent text-dark font-montserrat text-[14px] font-bold tracking-[0.5em] uppercase shadow-accent-soft hover:scale-105 transition-all duration-500 overflow-hidden"
                   >
                      <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12" />
                      {t('systemOverview')}
                   </Link>
                </div>
            </div>
         </div>
      </main>
    </div>
  )
}

export default DashboardPersonality
