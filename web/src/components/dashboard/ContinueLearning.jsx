import React from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import bannerImg from '../../assets/images/banner.png'
import { useLanguage } from '../../context/LanguageContext'
import { getMediaUrl } from '../../utils/apiConfig'

const ContinueLearning = () => {
  const navigate = useNavigate()
  const { data: dashData } = useSelector(state => state.dashboard)
  const { t } = useLanguage()
  const lastSession = dashData?.continueLearning?.[0]

  if (!lastSession) return null;

  // Find thumbnail from activeCourses
  const activeCourse = dashData?.activeCourses?.find(c => c.courseId === lastSession.courseId)
  const thumbnail = activeCourse?.thumbnail 
    ? getMediaUrl(activeCourse.thumbnail, 'courses', '') || bannerImg
    : bannerImg

  const percentage = Math.round(lastSession.completionPercentage || 0)

  return (
    <div className="relative w-full h-full min-h-[360px] rounded-3xl overflow-hidden group border border-card-border shadow-card flex flex-col justify-end">
      {/* Full Background Image */}
      <div className="absolute inset-0 w-full h-full bg-slate-900">
         <img 
           src={thumbnail} 
           alt="Course Artwork" 
           onError={(e) => {
             const currentSrc = e.currentTarget.src;
             if (!currentSrc.includes('api.dataknowledge.in') && activeCourse?.thumbnail) {
               const clean = activeCourse.thumbnail.replace(/^\/+/, '');
               const encoded = clean.split('/').map(s => encodeURIComponent(decodeURIComponent(s))).join('/');
               e.currentTarget.src = `https://api.dataknowledge.in/${encoded}`;
             } else {
               e.currentTarget.src = bannerImg;
             }
           }}
           className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-1000" 
         />
      </div>
      
      {/* Heavy Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/80 to-transparent" />
      
      {/* Top Header Floating */}
      <div className="absolute top-6 left-8 right-8 flex justify-between items-center z-10">
         <span className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 font-inter text-[10px] text-white font-bold uppercase tracking-wider">
            {activeCourse?.title || 'Course'}
         </span>
         <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-accent group-hover:border-accent transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white group-hover:translate-x-0.5 transition-transform">
               <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2.5" />
            </svg>
         </button>
      </div>

      {/* Main Content (Bottom Aligned) */}
      <div className="relative z-10 p-8 pt-20 w-full">
         <p className="font-inter text-[10px] text-accent font-bold uppercase tracking-widest mb-2">
            {t('continueLearning')}
         </p>
         <h3 className="font-inter text-3xl md:text-4xl text-white font-black leading-tight tracking-tight max-w-2xl group-hover:text-cyan-400 transition-colors">
            {lastSession.videoTitle} {lastSession.lessonTitle ? `- ${lastSession.lessonTitle}` : ''}
         </h3>
         
         {/* Progress Bar & Actions */}
         <div className="flex flex-col md:flex-row gap-6 justify-between items-end mt-8">
            <div className="w-full md:w-2/3 space-y-3">
               <div className="flex justify-between items-center text-white/60">
                  <span className="font-inter text-[10px] uppercase font-bold tracking-widest">{t('progress')}</span>
                  <span className="font-inter text-[10px] uppercase font-black tracking-widest text-white">{percentage}%</span>
               </div>
               <div className="w-full h-[4px] bg-white/20 rounded-full overflow-hidden">
                  <div 
                     className="h-full bg-accent shadow-accent-soft transition-all duration-1000 rounded-full" 
                     style={{ width: `${percentage}%` }}
                  />
               </div>
            </div>
            
            <button 
               onClick={() => navigate(`/dashboard/course/${lastSession.courseId}`)}
               className="w-full md:w-auto bg-accent text-white px-8 py-3.5 rounded-full font-inter text-[11px] font-bold tracking-widest uppercase hover:scale-[1.05] active:scale-95 transition-all shadow-accent-soft flex items-center justify-center gap-3 shrink-0"
            >
               {t('resume')}
               <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 3L19 12L5 21V3Z" />
               </svg>
            </button>
         </div>
      </div>
    </div>
  )
}

export default ContinueLearning
