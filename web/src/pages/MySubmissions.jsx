import React, { useEffect, useRef, useState, useMemo } from 'react'
import { gsap } from 'gsap'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchMyAssignmentArchive } from '../redux/slices/assignmentSlice'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import DashboardLoading from '../components/dashboard/DashboardLoading'
import { useLanguage } from '../context/LanguageContext'
import { getApiBaseUrl } from '../utils/apiConfig.js'

const MySubmissions = () => {
   const containerRef = useRef(null)
   const dispatch = useDispatch()
   const navigate = useNavigate()
   const { t } = useLanguage()
   const { submissions, loading, error } = useSelector((state) => state.assignments)
   const [selectedSub, setSelectedSub] = useState(null)
   const [searchQuery, setSearchQuery] = useState('')

   const filteredSubmissions = useMemo(() => {
      return submissions.filter(sub => {
         const title = sub.assignmentId?.title?.toLowerCase() || ''
         const course = sub.courseId?.title?.toLowerCase() || sub.assignmentId?.courseName?.toLowerCase() || ''
         const lesson = sub.lessonId?.title?.toLowerCase() || sub.assignmentId?.lessonName?.toLowerCase() || ''
         const query = searchQuery.toLowerCase()
         return title.includes(query) || course.includes(query) || lesson.includes(query)
      })
   }, [submissions, searchQuery])

   useEffect(() => {
      window.scrollTo(0, 0)
      dispatch(fetchMyAssignmentArchive())
   }, [dispatch])

   useEffect(() => {
      if (!loading && submissions.length >= 0) {
         const ctx = gsap.context(() => {
            gsap.fromTo('.sub-reveal',
               { y: 20, autoAlpha: 0 },
               {
                  y: 0,
                  autoAlpha: 1,
                  duration: 0.6,
                  ease: 'power2.out',
                  stagger: 0.1,
                  delay: 0.2
               }
            )
         }, containerRef)
         return () => ctx.revert()
      }
   }, [loading, submissions.length, selectedSub])

   const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
         year: 'numeric',
         month: 'numeric',
         day: 'numeric'
      });
   };

   const formatTime = (dateString) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleTimeString('en-US', {
         hour: '2-digit',
         minute: '2-digit',
         second: '2-digit'
      });
   };

   const handleDownload = async (fileUrl, fileName) => {
      try {
         const response = await fetch(fileUrl);
         const blob = await response.blob();
         const url = window.URL.createObjectURL(blob);
         const link = document.createElement('a');
         link.href = url;
         link.setAttribute('download', fileName || 'submission_file');
         document.body.appendChild(link);
         link.click();
         link.parentNode.removeChild(link);
         window.URL.revokeObjectURL(url);
      } catch (error) {
         console.error('Download failed:', error);
         // Fallback: just open in new tab if fetch fails
         window.open(fileUrl, '_blank');
      }
   };

   const getStatusColor = (status) => {
      switch (status?.toLowerCase()) {
         case 'submitted': return 'bg-[#8B5CF6] text-dark border-[#8B5CF6]';
         case 'graded': return 'bg-blue-500 text-white border-blue-500';
         case 'pending': return 'bg-orange-500 text-white border-orange-500';
         default: return 'bg-white/10 text-normal border-white/20';
      }
   };

   if (selectedSub) {
      const courseName = selectedSub.courseId?.title || selectedSub.assignmentId?.courseName || 'Unknown Course';
      const lessonName = selectedSub.lessonId?.title || selectedSub.assignmentId?.lessonName || 'Assignment';
      const apiBase = getApiBaseUrl();
      const submissionFileUrl = selectedSub.submissionFile
         ? `${apiBase}/${selectedSub.submissionFile.replace(/^\/+/, '')}`
         : null;

      return (
         <div ref={containerRef} className="min-h-screen bg-dark relative selection:bg-accent/30 overflow-x-clip">
            <DashboardHeader />

            <main className="pt-24 pb-20 px-4 lg:px-8 max-w-[1500px] mx-auto">
               {/* Detail Header */}
               <div className="sub-reveal opacity-0 mb-10 rounded-3xl border border-slate-200/80 bg-white p-6 md:p-10 shadow-sm">
                  <button
                     onClick={() => setSelectedSub(null)}
                     className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 font-inter text-xs font-semibold text-slate-600 hover:border-accent hover:text-accent transition-colors mb-8"
                  >
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                     Back to Archive
                  </button>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                     <h1 className="font-inter text-3xl md:text-5xl font-bold text-normal tracking-tight">
                        {selectedSub.assignmentId?.title || 'Tactical Assignment'}
                     </h1>
                     <div className="flex items-center gap-3">
                        <span className={`px-4 py-1.5 rounded-full font-jetbrains text-[10px] font-black uppercase tracking-widest ${getStatusColor(selectedSub.status)}`}>
                           {selectedSub.status || 'SUBMITTED'}
                        </span>
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full">
                           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-description"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v8H6z" /></svg>
                           <span className="font-inter text-xs font-semibold text-description">{selectedSub.scoreGiven !== null ? 'Graded' : 'Not graded'}</span>
                        </div>
                        {/* <button className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-description hover:text-accent transition-all">
                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button> */}
                     </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-6 border-t border-slate-100">
                     <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-description"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                        <span className="font-inter text-xs font-semibold text-description">{courseName}</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-description"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
                        <span className="font-inter text-xs font-semibold text-description">{lessonName}</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-description"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                        <span className="font-inter text-xs font-semibold text-description">{formatDate(selectedSub.submittedAt)}</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-description"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        <span className="font-inter text-xs font-semibold text-description">{formatTime(selectedSub.submittedAt)}</span>
                     </div>
                  </div>
               </div>

               {/* Detail Content */}
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 sub-reveal opacity-0">
                  {/* Left Column: Submission Details */}
                  <div className="lg:col-span-7 space-y-10">
                     <div className="space-y-4">
                        <h3 className="font-inter text-2xl font-bold text-normal">Submission Details</h3>
                        <div className="space-y-2">
                           <p className="font-jetbrains text-[10px] text-description uppercase tracking-widest">Submission Text</p>
                           <div className="w-full bg-white border border-slate-200 p-6 min-h-[120px] rounded-2xl shadow-sm">
                              <p className="font-inter text-base leading-7 text-normal">
                                 {selectedSub.submissionText || 'No text submitted'}
                              </p>
                           </div>
                        </div>
                     </div>

                     {selectedSub.submissionFile && <div className="space-y-4">
                        <p className="font-jetbrains text-[10px] text-description uppercase tracking-widest">Attached File</p>
                        <div className="w-full bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex items-center justify-between gap-4">
                           <div className="flex items-center gap-4">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                              <button
                                 onClick={() => handleDownload(submissionFileUrl, selectedSub.submissionFile?.split('/').pop())}
                                 className="rounded-full bg-accent/10 px-4 py-2 font-inter text-sm font-semibold text-accent hover:bg-accent/20"
                              >
                                 Download File
                              </button>
                           </div>
                           <button
                              onClick={() => window.open(submissionFileUrl, '_blank')}
                              className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 font-inter text-xs font-semibold text-normal hover:border-accent hover:text-accent transition-colors"
                           >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                              View File
                           </button>
                        </div>
                     </div>}

                     {selectedSub.assignmentId?.documentFile && (
                        <div className="space-y-4">
                           <p className="font-jetbrains text-[10px] text-description uppercase tracking-widest">Assignment Instructions</p>
                           <div className="w-full bg-white border border-accent/20 p-6 rounded-2xl shadow-sm flex items-center justify-between group/inst">
                              <div className="flex items-center gap-4">
                                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-normal opacity-40 group-hover/inst:opacity-100 transition-opacity"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                 <span className="font-inter text-sm font-semibold text-normal">Reference Document</span>
                              </div>
                              <button
                                 onClick={() => window.open(selectedSub.assignmentId.documentFile?.startsWith('http') ? selectedSub.assignmentId.documentFile : `${apiBase}/${selectedSub.assignmentId.documentFile?.replace(/^\/+/, '')}`, '_blank')}
                                 className="flex items-center gap-2 rounded-full border border-accent/20 px-4 py-2 font-inter text-xs font-semibold text-accent hover:bg-accent/10 transition-all"
                              >
                                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                 Open Brief
                              </button>
                           </div>
                        </div>
                     )}
                  </div>

                  {/* Right Column: Assignment Information */}
                  <div className="lg:col-span-5">
                     <div className="bg-white border border-slate-200 p-8 md:p-10 rounded-3xl shadow-sm space-y-8 h-full">
                        <h3 className="font-inter text-2xl font-bold text-normal">Assignment Information</h3>

                        <div className="space-y-6">
                           <div className="flex items-center justify-between">
                              <span className="font-jetbrains text-[10px] text-description uppercase tracking-widest">Course:</span>
                              <span className="font-inter text-sm font-semibold text-normal text-right">{courseName}</span>
                           </div>
                           <div className="flex items-center justify-between">
                              <span className="font-jetbrains text-[10px] text-description uppercase tracking-widest">Lesson:</span>
                              <span className="font-inter text-sm font-semibold text-normal text-right">{lessonName}</span>
                           </div>
                           <div className="flex items-center justify-between">
                              <span className="font-jetbrains text-[10px] text-description uppercase tracking-widest">Status:</span>
                              <span className="font-inter text-sm font-semibold text-accent">{selectedSub.status || 'Submitted'}</span>
                           </div>
                           <div className="flex items-center justify-between">
                              <span className="font-jetbrains text-[10px] text-description uppercase tracking-widest">Score:</span>
                              <span className="font-inter text-sm font-semibold text-normal">
                                 {selectedSub.scoreGiven ? (
                                    <>
                                       {selectedSub.scoreGiven} {selectedSub.assignmentId?.maxScore ? `/ ${selectedSub.assignmentId.maxScore}` : ''}
                                    </>
                                 ) : 'Not graded yet'}
                              </span>
                           </div>
                           <div className="flex items-center justify-between pt-6 border-t border-white/5">
                              <span className="font-jetbrains text-[10px] text-description uppercase tracking-widest">Submitted:</span>
                              <span className="font-inter text-sm font-semibold text-normal text-right">
                                 {formatDate(selectedSub.submittedAt)}, {formatTime(selectedSub.submittedAt)}
                              </span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </main>
         </div>
      )
   }

   return (
      <div ref={containerRef} className="min-h-screen bg-dark relative selection:bg-accent/30 overflow-x-clip">
         <DashboardHeader />

         <main className="pt-24 pb-20 px-4 lg:px-8 max-w-[1500px] mx-auto">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 sub-reveal opacity-0">
               <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                     <h1 className="font-inter text-4xl md:text-5xl font-bold text-normal tracking-tight">{t('assignmentArchive') || 'Assignment Archive'}</h1>
                     <div className="h-[1px] w-20 bg-white/5" />
                  </div>
                  <p className="font-jetbrains text-[10px] text-description uppercase tracking-[0.4em]">{t('submissionsSub') || 'Track your tactical submissions and performance metrics'}</p>
               </div>

               <div className="relative group max-w-md w-full">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-normal group-focus-within:text-accent transition-colors">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                  </div>
                  <input
                     type="text"
                     placeholder={t('searchArchive')}
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full bg-white border border-slate-200 rounded-full focus:border-accent/50 py-3 pl-12 pr-4 font-inter text-sm text-normal placeholder:text-description outline-none transition-all shadow-sm"
                  />
                  <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-accent group-focus-within:w-full transition-all duration-500" />
               </div>
            </div>

            {error && (
               <div className="mb-6 rounded-2xl border border-red-300/30 bg-red-500/10 p-5 text-red-200">
                  <p className="font-jetbrains text-[10px] font-black uppercase tracking-widest">Unable to load submissions</p>
                  <p className="mt-2 font-inter text-sm">{error}</p>
                  <p className="mt-3 font-jetbrains text-[10px] uppercase tracking-widest text-red-200/70">
                     Confirm the frontend and backend are using the same environment, then refresh this page.
                  </p>
               </div>
            )}

            {/* Submissions List */}
            <div className="space-y-6">
               {loading && submissions.length === 0 ? (
                  <DashboardLoading />
               ) : filteredSubmissions.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                     {filteredSubmissions.map((sub) => (
                        <div
                           key={sub._id}
                           onClick={() => {
                              if (sub.status === 'pending' && sub.courseId?._id && sub.lessonId?._id) {
                                 navigate(`/dashboard/assignment/${sub.courseId._id}/${sub.lessonId._id}`)
                              } else {
                                 setSelectedSub(sub)
                              }
                           }}
                           className="sub-reveal opacity-0 bg-white border border-slate-200/80 hover:border-accent/50 rounded-3xl p-6 md:p-8 transition-all flex flex-col md:flex-row md:items-center justify-between gap-8 group cursor-pointer shadow-sm hover:shadow-md"
                        >

                           <div className="flex flex-col gap-4 flex-1">
                              <div className="flex items-center gap-4">
                                 <span className={`font-inter text-[10px] font-bold tracking-wider px-3 py-1.5 border border-transparent ${getStatusColor(sub.status)} uppercase rounded-full`}>
                                    {sub.status || 'SUBMITTED'}
                                 </span>
                                 <span className="font-inter text-xs text-description">{formatDate(sub.submittedAt)}</span>
                              </div>

                              <div className="space-y-2">
                                 <h2 className="font-inter text-2xl text-normal tracking-tight group-hover:text-accent transition-colors">
                                    {sub.assignmentId?.title || 'Unknown Assignment'}
                                 </h2>
                                 <p className="font-inter text-xs font-semibold text-description uppercase tracking-wider">
                                    {sub.assignmentId?.subject || 'General Assessment'}
                                 </p>
                              </div>
                           </div>

                           <div className="flex items-center gap-12">
                              {/* Score Protocol */}
                              <div className="flex flex-col items-end gap-1">
                                 <span className="font-jetbrains text-[8px] text-normal uppercase tracking-widest">{t('performance') || 'Performance'}</span>
                                 <div className="flex items-baseline gap-1">
                                    <span className="font-inter text-3xl text-normal">{sub.scoreGiven || '--'}</span>
                                    {sub.assignmentId?.maxScore && (
                                       <span className="font-jetbrains text-[12px] text-normal">/ {sub.assignmentId.maxScore}</span>
                                    )}
                                 </div>
                              </div>

                              {/* Action Protocol */}
                              <div className="flex items-center gap-4">
                                 {sub.submissionFile && (
                                    <div className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/5 text-description group-hover:text-accent group-hover:border-accent/20 transition-all">
                                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                    </div>
                                 )}
                                 <button className="h-11 px-6 rounded-full bg-slate-100 border border-slate-200 font-inter text-xs font-bold text-normal uppercase tracking-wider group-hover:bg-accent group-hover:text-dark group-hover:border-accent transition-all">
                                    {sub.status === 'pending' ? 'Start assignment' : t('viewDetails')}
                                 </button>
                              </div>
                           </div>

                        </div>
                     ))}
                  </div>
               ) : (
                  <div className="py-32 flex flex-col items-center justify-center gap-6 border border-dashed border-white/5 sub-reveal opacity-0">
                     <div className="w-16 h-16 bg-white/5 flex items-center justify-center text-description/20">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                     </div>
                     <div className="flex flex-col items-center gap-2">
                        <h3 className="font-inter text-2xl text-normal/40">No records detected</h3>
                        <p className="font-jetbrains text-[10px] text-description/30 uppercase tracking-widest">Your mission logs are currently empty</p>
                     </div>
                     <button className="mt-4 font-jetbrains text-[10px] text-accent font-black uppercase tracking-[0.4em] border border-accent/20 px-8 py-3 hover:bg-accent hover:text-dark transition-all">
                        Browse Missions
                     </button>
                  </div>
               )}
            </div>
         </main>
      </div>
   )
}

export default MySubmissions
