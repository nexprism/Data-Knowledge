import React, { useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { updateUserProfile } from '../../redux/slices/profileSlice'
import { useLanguage } from '../../context/LanguageContext'
import { getImageBaseUrl } from '../../utils/apiConfig'

const ProfileSidebar = ({ compact = false }) => {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const { user, updateLoading } = useSelector((state) => state.profile)
  const fileInputRef = useRef(null)

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const formData = new FormData()
      formData.append('profilePicture', file)
      
      try {
        await dispatch(updateUserProfile(formData)).unwrap()
        alert('Profile picture updated!')
      } catch (err) {
        alert(`Update failed: ${err}`)
      }
    }
  }

  return (
    <div className="space-y-8 h-fit">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileChange}
        accept="image/*"
      />
      
      {/* Identity Core */}
      <div className="space-y-6">
         <div 
            onClick={handleAvatarClick}
            className={`relative w-24 h-24 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center group overflow-hidden cursor-pointer transition-all shadow-sm ${updateLoading ? 'opacity-50 pointer-events-none' : 'hover:border-amber-400'}`}
         >
            {/* Avatar Protocol */}
            {user?.profilePicture ? (
               <img 
                  src={user.profilePicture.startsWith('http') ? user.profilePicture : `${getImageBaseUrl()}/uploads/${user.profilePicture.replace(/^\/?(uploads\/)?/, '')}`}
                  alt={user.fullName} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
               />
            ) : (
               <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-slate-400 group-hover:text-amber-500 transition-colors duration-700">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                  <path d="M4 20c0-4 4-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" />
               </svg>
            )}
            
            {/* Overlay for interaction */}
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </div>

            <div className="absolute bottom-0 left-0 w-full py-1 bg-slate-950/80 backdrop-blur-sm text-center">
               <span className="font-jetbrains text-[8px] text-amber-400 uppercase tracking-widest font-black">{updateLoading ? 'SYNCING' : 'UPDATE'}</span>
            </div>
         </div>

         <div className="space-y-4">
            <div className="space-y-1">
               <h2 className="font-inter text-3xl text-slate-900 font-bold tracking-tight lowercase leading-tight">
                  {user?.fullName?.split(' ')[0] || 'User'} <span className="text-slate-400 font-normal">{user?.fullName?.split(' ').slice(1).join(' ') || ''}</span>
               </h2>
               <p className="font-jetbrains text-xs text-amber-800 font-black uppercase tracking-[0.3em]">{user?.role ? (t(user.role.toLowerCase() + 'Role') || user.role) : (t('studentRole') || 'STUDENT')}</p>
            </div>
            
            <div className="space-y-2 pt-3 border-t border-slate-100">
                <p className="font-jetbrains text-[10px] text-slate-500 lowercase tracking-widest font-medium">id: {user?._id?.slice(-12).toUpperCase() || 'UNREGISTERED'}</p>
                <p className="font-jetbrains text-[10px] text-slate-500 uppercase tracking-widest font-medium">SINCE {user?.createdAt ? new Date(user.createdAt).getFullYear() : '2024'}</p>
            </div>
         </div>
      </div>

      {/* High-Density Stats Cluster */}
      <div className="grid grid-cols-1 gap-2.5 pt-4 border-t border-slate-100">
         {[
            { label: t('coursesStat') || 'Courses', value: user?.enrolledCourses?.length || '0', icon: 'M12 2L2 7l10 5l10-5l-10-5z M2 17l10 5l10-5 M2 12l10 5l10-5' },
            { label: t('postsStat') || 'Posts', value: '00', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
            { label: t('certificatesStat') || 'Certificates', value: user?.qualifications?.length || '0', icon: 'M12 15l-2 5l2 2l2-2l-2-5z M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z' },
         ].map((stat, i) => (
            <div key={i} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-200/80 hover:bg-amber-50/50 hover:border-amber-300/60 rounded-xl transition-all group overflow-hidden relative">
               <div className="space-y-1 relative z-10">
                  <p className="font-jetbrains text-[10px] text-slate-500 uppercase tracking-[0.3em] font-bold">{stat.label}</p>
                  <p className="font-inter text-3xl text-slate-900 font-bold leading-none">
                     {String(stat.value).padStart(2, '0')}
                  </p>
               </div>
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400 group-hover:text-amber-600 transition-colors relative z-10">
                  <path d={stat.icon} />
               </svg>
            </div>
         ))}
      </div>

    </div>
  )
}

export default ProfileSidebar
