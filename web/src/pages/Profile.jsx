import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { gsap } from 'gsap'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import ProfileSidebar from '../components/profile/ProfileSidebar'
import ProfileForm from '../components/profile/ProfileForm'
import ProfileSkills from '../components/profile/ProfileSkills'
import SecuritySettings from '../components/profile/SecuritySettings'
import ProfileTabs from '../components/profile/ProfileTabs'
import AcademicInfo from '../components/profile/AcademicInfo'
import { fetchUserProfile } from '../redux/slices/profileSlice'
import { fetchMyEnrollments } from '../redux/slices/enrollmentSlice'
import { useLanguage } from '../context/LanguageContext'

const Profile = () => {
  const [activeTab, setActiveTab] = useState('profile')
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const { user, loading, error } = useSelector((state) => state.profile)

   // Map MBTI codes to readable archetype names and descriptions
   const archetypes = {
      INTJ: { name: 'Architect', desc: 'Imaginative and strategic thinkers, with a plan for everything.' },
      INTP: { name: 'Logician', desc: 'Innovative inventors with an unquenchable thirst for knowledge.' },
      ENTJ: { name: 'Commander', desc: 'Bold, imaginative and strong-willed leaders, always finding a way – or making one.' },
      ENTP: { name: 'Debater', desc: 'Smart and curious thinkers who cannot resist an intellectual challenge.' },
      INFJ: { name: 'Advocate', desc: 'Quiet and mystical, yet very inspiring and tireless idealists.' },
      INFP: { name: 'Mediator', desc: 'Poetic, kind and altruistic people, always eager to help a good cause.' },
      ENFJ: { name: 'Protagonist', desc: 'Charismatic and inspiring leaders, able to mesmerize their listeners.' },
      ENFP: { name: 'Campaigner', desc: 'Enthusiastic, creative and sociable free spirits, who can always find a reason to smile.' },
      ISTJ: { name: 'Logistician', desc: 'Practical and fact-minded individuals, whose reliability cannot be doubted.' },
      ISFJ: { name: 'Defender', desc: 'Very dedicated and warm protectors, always ready to defend their loved ones.' },
      ESTJ: { name: 'Executive', desc: 'Excellent administrators, unsurpassed at managing things – or people.' },
      ESFJ: { name: 'Consul', desc: 'Extraordinarily caring, social and popular people, always eager to help.' },
      ISTP: { name: 'Virtuoso', desc: 'Bold and practical experimenters, masters of all kinds of tools.' },
      ISFP: { name: 'Adventurer', desc: 'Flexible and charming artists, always ready to explore and experience something new.' },
      ESTP: { name: 'Entrepreneur', desc: 'Smart, energetic and very perceptive people, who truly enjoy living on the edge.' },
      ESFP: { name: 'Entertainer', desc: 'Spontaneous, energetic and enthusiastic people – life is never boring around them.' },
   }

   const archeCode = user?.personality?.resultType || user?.archetype || 'ENFP'
   const arche = archetypes[archeCode] || { name: archeCode, desc: 'Unique personality profile with distinct traits and perspectives.' }

  useEffect(() => {
    dispatch(fetchUserProfile())
    dispatch(fetchMyEnrollments())
  }, [dispatch])

  useEffect(() => {
    window.scrollTo(0, 0)
    
    gsap.fromTo('.bento-panel', 
      { scale: 0.98, opacity: 0, y: 10 },
      { 
        scale: 1, 
        opacity: 1, 
        y: 0,
        duration: 1.2, 
        stagger: 0.05, 
        ease: 'expo.out', 
        delay: 0.1 
      }
    )
  }, [activeTab])

  return (
    <div className="min-h-screen bg-slate-50 relative pb-16">
      <DashboardHeader />
      
      <main className="pt-24 px-4 md:px-8 pb-4">
         <div className="mx-auto w-full max-w-[1600px]">
            {loading ? (
               <div className="h-[60vh] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                     <div className="w-12 h-12 border-3 border-amber-400/20 border-t-amber-500 rounded-full animate-spin" />
                     <p className="font-jetbrains text-xs font-bold text-amber-800 uppercase tracking-[0.4em] animate-pulse">Loading Profile...</p>
                  </div>
               </div>
            ) : error ? (
               <div className="h-[60vh] flex items-center justify-center">
                  <div className="bg-red-50 border border-red-200 p-8 text-center space-y-4 max-w-md rounded-2xl shadow-sm">
                     <p className="font-jetbrains text-xs text-red-600 uppercase tracking-[0.4em] font-black">Connection Error</p>
                     <p className="font-inter text-xl text-red-700">{error}</p>
                     <button 
                        onClick={() => dispatch(fetchUserProfile())}
                        className="px-8 py-3 bg-red-100 text-red-700 font-jetbrains text-xs font-bold uppercase tracking-widest hover:bg-red-200 transition-all rounded-full"
                     >
                        Retry
                     </button>
                  </div>
               </div>
            ) : (
               /* -------------------- GRID SYSTEM -------------------- */
               <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start relative">
                  
                  {/* [PANEL A]: LEADERBOARD & IDENTITY (Col 1-3) */}
                  <div className="md:col-span-3 space-y-6 md:sticky md:top-24 h-fit">
                     <div className="bento-panel bg-white border border-slate-200/80 p-8 relative overflow-hidden group rounded-2xl shadow-sm">
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-400/40 group-hover:border-amber-500 transition-colors duration-700 rounded-tr-2xl" />
                        <ProfileSidebar compact={true} />
                     </div>
                     
                     {/* Leaderboard Section */}
                     {user?.leaderboard && (
                        <div className="bento-panel bg-white border border-amber-300/40 p-8 space-y-8 rounded-2xl relative overflow-hidden shadow-sm">
                           <div className="absolute top-0 right-0 p-3 opacity-15 text-amber-600">
                              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 15l-2 5l2 2l2-2l-2-5z M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/></svg>
                           </div>
                           <p className="font-jetbrains text-xs text-amber-800 uppercase tracking-[0.3em] font-black">Leaderboard Status</p>
                           <div className="space-y-6">
                              <div className="flex justify-between items-end">
                                 <div>
                                    <p className="font-jetbrains text-[10px] text-slate-500 uppercase tracking-widest font-bold">Global Rank</p>
                                    <p className="font-inter text-5xl text-slate-900 font-medium">#{user.leaderboard.rank || 'N/A'}</p>
                                 </div>
                                 <div className="text-right">
                                    <p className="font-jetbrains text-[10px] text-slate-500 uppercase tracking-widest font-bold">Experience</p>
                                    <p className="font-inter text-3xl text-slate-900 font-medium">{user.leaderboard.xp?.toLocaleString() || '0'} XP</p>
                                 </div>
                              </div>
                              <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                                 <span className="font-jetbrains text-xs text-slate-900 uppercase tracking-widest font-black">Level</span>
                                 <span className="px-4 py-1.5 bg-amber-100 text-amber-900 border border-amber-300/60 font-jetbrains text-[10px] uppercase tracking-widest rounded-full font-black">{user.leaderboard.level || 'Novice'}</span>
                              </div>
                           </div>
                        </div>
                     )}

                     {/* Account Details */}
                     <div className="bento-panel bg-white border border-slate-200/80 p-6 space-y-4 rounded-2xl shadow-sm">
                        <p className="font-jetbrains text-xs text-slate-900 uppercase tracking-[0.3em] font-black">{t('accountInfo') || 'Account Info'}</p>
                        <div className="flex justify-between items-center text-xs font-jetbrains">
                           <span className="text-slate-500 uppercase font-medium">User ID</span>
                           <span className="text-slate-900 font-black tracking-widest">#{user?._id?.slice(-8).toUpperCase() || 'N/A'}</span>
                        </div>
                     </div>
                  </div>

                  {/* [PANEL B]: MAIN CONTENT (Col 4-9) */}
                  <div className="md:col-span-6 space-y-6">
                     <div className="bento-panel bg-white border border-slate-200/80 p-2 rounded-2xl shadow-sm relative z-10">
                        <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} compact={true} />
                     </div>

                     <div className="bento-panel bg-white border border-slate-200/80 p-6 md:p-10 relative rounded-2xl overflow-hidden shadow-sm">
                        {activeTab === 'profile' && <ProfileForm />}
                        {activeTab === 'security' && <SecuritySettings />}
                        {activeTab === 'academic' && <AcademicInfo />}
                     </div>
                  </div>

                  {/* [PANEL C]: PERSONALITY & SUMMARY (Col 10-12) */}
                  <div className="md:col-span-3 space-y-6 md:sticky md:top-24 h-fit">
                     
                     {/* Personality Section */}
                     {user?.personality && (
                        <div className="bento-panel bg-white border border-slate-200/80 p-8 relative overflow-hidden rounded-2xl shadow-sm">
                           <div className="absolute top-0 right-0 p-4 opacity-10 text-slate-700">
                              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zM12 6v6l4 2"/></svg>
                           </div>
                           <div className="space-y-8">
                              <div className="space-y-3">
                                 <p className="font-jetbrains text-xs text-amber-800 uppercase tracking-[0.3em] font-black">{t('personalityArchetype') || 'Personality Archetype'}</p>
                                 <div className="space-y-1">
                                    <h3 className="font-inter text-3xl text-slate-900 font-bold tracking-tight uppercase leading-none">{arche.name}</h3>
                                 </div>
                              </div>
                              
                              {/* Personality Description */}
                              <div className="space-y-4 pt-6 border-t border-slate-100">
                                 <p className="font-jetbrains text-[10px] text-slate-500 uppercase tracking-widest font-bold">{t('coreDescription') || 'Core Description'}</p>
                                 <p className="font-inter text-lg text-slate-700 leading-relaxed font-medium">
                                    {arche.desc}
                                 </p>
                              </div>
                           </div>
                        </div>
                     )}

                     {/* Bio Summary */}
                     <div className="bento-panel bg-white border border-slate-200/80 p-8 relative overflow-hidden rounded-2xl shadow-sm h-fit">
                        <div className="space-y-8">
                           <p className="font-jetbrains text-xs text-slate-900 uppercase tracking-[0.3em] font-black">{t('bioSummary') || 'Bio Summary'}</p>
                           <p className="font-inter text-lg text-slate-600 leading-relaxed font-medium">
                              {user?.bio || (t('noBioRecorded') || 'No bio recorded in the registry.')}
                           </p>
                           <div className="pt-6 space-y-4 border-t border-slate-100">
                              <p className="font-jetbrains text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black">{t('badgesTitle') || 'Badges'}</p>
                              <div className="flex flex-wrap gap-2">
                                 {[t('earlyAdopter') || 'Early Adopter', t('verifiedUser') || 'Verified User'].map((badge, i) => (
                                    <div key={i} className="px-4 py-1.5 bg-amber-50 border border-amber-200 text-[10px] font-jetbrains text-amber-900 uppercase tracking-widest font-black rounded-full">
                                       {badge}
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                </div>
            )}
         </div>
      </main>

    </div>
  )
}

export default Profile
