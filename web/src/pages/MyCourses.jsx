import React, { useEffect, useState, useLayoutEffect, useMemo } from 'react'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMyEnrollments } from '../redux/slices/enrollmentSlice'
import { useLanguage } from '../context/LanguageContext'
import { getImageBaseUrl } from '../utils/apiConfig'

import DashboardLoading from '../components/dashboard/DashboardLoading'
import socketService from '../services/socketService'

const MyCourses = () => {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const { enrollments, loading, error } = useSelector((state) => state.enrollment)
  const [activeFilter, setActiveFilter] = useState('ALL COURSES')
  const navigate = useNavigate()

  useEffect(() => {
    dispatch(fetchMyEnrollments())

    const token = localStorage.getItem('edrilla_token') || localStorage.getItem('token')
    socketService.connect(token).catch(() => {})

    const handleProgressUpdate = () => {
      dispatch(fetchMyEnrollments())
    }

    socketService.on('progress-updated', handleProgressUpdate)
    socketService.on('video-completed', handleProgressUpdate)

    return () => {
      socketService.off('progress-updated', handleProgressUpdate)
      socketService.off('video-completed', handleProgressUpdate)
    }
  }, [dispatch])

  // Filter Logic
  const filteredEnrollments = useMemo(() => {
    return enrollments.filter(item => {
      if (!item.course) return false // Hide legacy/deleted courses from curriculum view
      const itemProgress = item.progressPercentage ?? item.course?.overallProgress ?? 0
      if (activeFilter === 'ALL COURSES') return true
      if (activeFilter === 'IN PROGRESS') return itemProgress < 100 && !item.iscompleted
      if (activeFilter === 'COMPLETED') return item.iscompleted || itemProgress >= 100
      return true
    })
  }, [enrollments, activeFilter])

  // Statistics
  const activeCount = useMemo(() => enrollments.filter(item => item.status === 'active' && item.course).length, [enrollments])
  const avgProgress = useMemo(() => {
    return enrollments.length > 0 
      ? Math.round(enrollments.reduce((acc, item) => acc + (item.progressPercentage ?? item.course?.overallProgress ?? 0), 0) / enrollments.length) 
      : 0
  }, [enrollments])

  useLayoutEffect(() => {
    if (loading) return

    // Archival Reveal Sequence
    let ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out', duration: 1.2 } })
      
      tl.fromTo('.curriculum-header', { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1 }, 0.2)
      tl.fromTo('.filter-bar', { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1 }, '-=0.8')
      tl.fromTo('.course-card', { y: 40, autoAlpha: 0, rotateX: -4 }, { y: 0, autoAlpha: 1, rotateX: 0, stagger: 0.1 }, '-=0.6')
    })

    return () => ctx.revert()
  }, [loading, activeFilter])

  return (
    <div className="min-h-screen bg-slate-50 relative pb-16">
      <DashboardHeader />
      
      <main className="pt-24 pb-12 px-6 md:px-12">
        <div className="max-w-[1600px] mx-auto space-y-10">
          
          {/* CURRICULUM DOSSIER HEADER */}
          <div className="flex flex-col md:flex-row md:items-end justify-between items-start gap-8 curriculum-header opacity-0 invisible">
            <div className="space-y-2">
               <p className="font-inter text-xs text-[#3498db] uppercase tracking-[0.3em] font-bold not-">{t('continuingEducation') || 'Learning Dashboard'}</p>
               <h1 className="font-inter not- text-3xl md:text-5xl text-slate-900 font-extrabold tracking-tight leading-none uppercase">
                   {t('myCurriculum') || 'My Courses'}
               </h1>
            </div>
            
            <div className="flex gap-8 md:gap-16 items-center self-end md:self-auto">
               <div className="text-right group relative">
                  <p className="font-inter text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold not-">{t('activeCoursesLabel') || 'Enrolled Courses'}</p>
                  <p className="font-inter not- text-3xl md:text-4xl text-slate-900 leading-none font-bold tracking-tight">
                     {activeCount < 10 ? `0${activeCount}` : activeCount}
                  </p>
               </div>
               <div className="text-right group relative">
                  <p className="font-inter text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold not-">{t('completionRateLabel') || 'Avg Progress'}</p>
                  <p className="font-inter not- text-3xl md:text-4xl text-slate-900 leading-none font-bold tracking-tight">{avgProgress}<span className="text-[#3498db]">%</span></p>
               </div>
            </div>
          </div>

          {/* TACTICAL FILTER BAR */}
          <div className="filter-bar flex flex-col md:flex-row justify-between items-center py-4 border-y border-slate-200/80 gap-6 opacity-0 invisible">
             <div className="relative group w-full md:w-auto flex items-center">
                <div className="relative flex-1 md:w-80 group">
                  <input 
                    type="text" 
                    placeholder={t('searchArchive')} 
                    className="bg-white border border-slate-200 focus:border-amber-500 outline-none font-montserrat text-xs text-slate-900 placeholder:text-slate-400 pl-10 pr-4 py-3 w-full tracking-[0.15em] uppercase transition-all duration-300 rounded-l-xl"
                  />
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-600 transition-colors"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                </div>
                <button className="bg-amber-100 border border-amber-300 border-l-0 px-6 py-3 font-jetbrains text-xs font-black text-amber-900 uppercase tracking-widest hover:bg-amber-400 hover:text-slate-950 transition-all duration-300 rounded-r-xl">
                  {t('searchBtn')}
                </button>
             </div>
             
             <div className="w-full md:w-auto overflow-x-auto no-scrollbar scrollbar-hide">
                <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 border border-slate-200/80 rounded-2xl min-w-max md:min-w-0">
                   {[
                     { id: 'ALL COURSES', label: t('allCourses') },
                     { id: 'IN PROGRESS', label: t('inProgress') },
                     { id: 'COMPLETED', label: t('completed') },
                     { id: 'WISHLIST', label: t('wishlist') }
                   ].map(({ id, label }) => (
                      <button 
                        key={id}
                        onClick={() => setActiveFilter(id)}
                        className={`font-jetbrains text-xs font-black uppercase tracking-[0.2em] transition-all relative px-5 py-2.5 rounded-xl whitespace-nowrap
                          ${activeFilter === id ? 'text-slate-950 bg-accent shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'}`}
                      >
                         {label}
                      </button>
                   ))}
                </div>
             </div>
          </div>

          {/* ARCHIVAL GRID FLOW */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 min-h-[400px] relative">
             {loading && (
                <div className="col-span-full">
                   <DashboardLoading />
                </div>
             )}

             {!loading && filteredEnrollments.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-28 space-y-4">
                   <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v20M17 5H9.5a4.5 4.5 0 000 9h5a4.5 4.5 0 010 9H6" /></svg>
                   </div>
                   <p className="font-jetbrains text-xs text-slate-600 font-bold uppercase tracking-[0.3em]">No Active Modules Found in Archive</p>
                </div>
             )}

             {filteredEnrollments.map((item, i) => (
                <div key={item._id || i} className="course-card group bg-white border border-slate-200/80 transition-all duration-500 relative overflow-hidden opacity-0 invisible hover:border-amber-400 rounded-2xl shadow-sm hover:shadow-md flex flex-col min-h-[540px]">
                   
                   {/* 1. Image Section */}
                   <div className="w-full aspect-[16/10] relative overflow-hidden border-b border-slate-100 shrink-0">
                      <img 
                        src={(() => {
                            const thumb = item.course?.thumbnail;
                            if (!thumb) return '/news_placeholder.png';
                            if (thumb.startsWith('http')) return thumb;
                            const baseUrl = getImageBaseUrl();
                            return `${baseUrl}${thumb.startsWith('/') ? '' : '/'}${thumb}`;
                        })()} 
                        alt={item.course?.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" 
                      />
                   </div>
 
                   {/* 2. Text Content */}
                   <div className="p-7 flex flex-col flex-grow space-y-6 z-10 relative">
                      <div className="space-y-4">
                         {/* Status Badge */}
                         <div className="inline-flex items-center gap-2 bg-amber-100 border border-amber-300/80 px-3.5 py-1 rounded-full">
                            <span className="font-jetbrains text-[10px] text-amber-900 font-black uppercase tracking-wider leading-none">
                               {item.iscompleted ? 'Completed' : 'In Progress'}
                            </span>
                         </div>
  
                         <h2 className="font-inter not- text-xl md:text-2xl text-slate-900 group-hover:text-[#3498db] transition-colors duration-300 leading-tight font-bold tracking-tight line-clamp-2">
                            {item.course?.title}
                         </h2>
  
                         {/* Metadata Grid */}
                         <div className="grid grid-cols-1 gap-y-3 pt-1">
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-slate-600">
                               <div className="flex items-center gap-2">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                  <span className="font-montserrat text-[10px] font-bold tracking-widest uppercase">
                                     ENROLLED: {item.enrolledAt ? new Date(item.enrolledAt).toLocaleDateString() : 'N/A'}
                                  </span>
                               </div>
                               <div className="flex items-center gap-2">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                                  <span className="font-montserrat text-[10px] font-bold tracking-widest uppercase">{item.course?.difficulty || 'Medium'}</span>
                               </div>
                            </div>
 
                            <div className="flex flex-wrap gap-x-6 gap-y-2">
                               <div className="flex items-center gap-2 text-red-600">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 4H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
                                  <span className="font-montserrat text-[10px] font-bold tracking-widest uppercase truncate max-w-[160px]">
                                     EXPIRES: {item.accessExpiry ? new Date(item.accessExpiry).toLocaleDateString() : 'LIFETIME'}
                                  </span>
                               </div>
                            </div>
 
                            <div className="flex items-center gap-2 text-slate-800">
                               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                               <span className="font-montserrat text-[10px] font-bold tracking-widest uppercase">STATUS: {item.status}</span>
                            </div>
                         </div>
                      </div>
  
                      {/* Progress Area */}
                      <div className="space-y-2 pt-2 mt-auto">
                         <div className="flex justify-between items-center font-jetbrains text-xs font-bold tracking-widest uppercase">
                            <span className="text-slate-500">Progress</span>
                            <span className="text-slate-900 font-black">{Math.round(item.progressPercentage ?? item.course?.overallProgress ?? 0)}%</span>
                         </div>
                         <div className="h-2 bg-slate-100 rounded-full relative overflow-hidden">
                            <div 
                               className="absolute top-0 left-0 h-full bg-amber-500 transition-all duration-1000 ease-out rounded-full" 
                               style={{ width: `${Math.min(100, Math.max(0, item.progressPercentage ?? item.course?.overallProgress ?? 0))}%` }} 
                            />
                         </div>
                      </div>
  
                      {/* Action Link */}
                      <div className="pt-2">
                         <button 
                            onClick={() => navigate(`/dashboard/course/${item.courseId}`)}
                            className="w-full py-3.5 bg-accent text-slate-950 font-jetbrains text-xs font-black uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all rounded-full shadow-accent-soft text-center"
                         >
                            Continue Learning
                         </button>
                      </div>
                   </div>
                </div>
             ))}
          </div>

        </div>
      </main>
    </div>
  )
}

export default MyCourses
