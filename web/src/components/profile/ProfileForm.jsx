import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { updateUserProfile } from '../../redux/slices/profileSlice'
import { useLanguage } from '../../context/LanguageContext'

const ProfileForm = () => {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const { user, updateLoading, updateError } = useSelector((state) => state.profile)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    location: '',
    bio: '',
    companyName: '',
    gstNumber: ''
  })

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
        location: user.location || user.address?.city || '',
        bio: user.bio || '',
        companyName: user.company?.name || '',
        gstNumber: user.company?.gstNumber || ''
      })
    }
  }, [user])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaveSuccess(false)
    const payload = {
      fullName: formData.fullName,
      phone: formData.phone,
      location: formData.location,
      bio: formData.bio,
      company: {
        name: formData.companyName,
        gstNumber: formData.gstNumber
      }
    }
    const result = await dispatch(updateUserProfile(payload))
    if (updateUserProfile.fulfilled.match(result)) {
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }
  }

  return (
    <div className="space-y-12 h-full flex flex-col justify-between">
      
      {/* -------------------- PROFILE SECTION -------------------- */}
      <div className="space-y-10">
         <div className="flex justify-between items-end border-b border-slate-100 pb-4">
            <h2 className="font-inter text-4xl text-slate-900 font-bold tracking-tight lowercase">{t('profile') || 'Profile'} <span className="text-slate-400 font-normal">{t('profileDetails') || 'Details'}</span></h2>
            <div className="flex gap-4">
               {saveSuccess && (
                  <span className="font-jetbrains text-xs text-amber-600 uppercase tracking-widest flex items-center gap-2 font-bold">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                     {t('changesSavedMsg') || 'Changes Saved'}
                  </span>
               )}
               {updateError && (
                  <span className="font-jetbrains text-xs text-red-600 uppercase tracking-widest flex items-center gap-2 font-bold">
                     Error: {updateError}
                  </span>
               )}
            </div>
         </div>

         <form className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8" onSubmit={handleSave}>
            
            <div className="space-y-2">
               <label className="font-jetbrains text-[10px] text-slate-700 uppercase tracking-[0.3em] font-bold">{t('fullNameLabel') || 'Full Name'}</label>
               <input 
                  type="text" 
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 p-3.5 font-jetbrains text-xs text-slate-900 focus:border-amber-500 transition-all outline-none rounded-xl"
               />
            </div>

            <div className="space-y-2">
               <label className="font-jetbrains text-[10px] text-slate-700 uppercase tracking-[0.3em] font-bold">{t('emailAddressLabel') || 'Email Address'} <span className="text-amber-600 font-normal lowercase">({t('lockedLabel') || 'Locked'})</span></label>
               <div className="w-full bg-slate-100 border border-slate-200 p-3.5 font-jetbrains text-xs text-slate-500 rounded-xl">
                  {user?.email || 'N/A'}
               </div>
            </div>

            <div className="space-y-2">
               <label className="font-jetbrains text-[10px] text-slate-700 uppercase tracking-[0.3em] font-bold">{t('phoneNumberLabel') || 'Phone Number'}</label>
               <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 p-3.5 font-jetbrains text-xs text-slate-900 focus:border-amber-500 transition-all outline-none rounded-xl"
               />
            </div>

            <div className="space-y-2">
               <label className="font-jetbrains text-[10px] text-slate-700 uppercase tracking-[0.3em] font-bold">{t('locationLabel') || 'Location'}</label>
               <input 
                  type="text" 
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 p-3.5 font-jetbrains text-xs text-slate-900 focus:border-amber-500 transition-all outline-none rounded-xl"
               />
            </div>

            <div className="col-span-1 md:col-span-2 space-y-2">
               <label className="font-jetbrains text-[10px] text-slate-700 uppercase tracking-[0.3em] font-bold">{t('aboutMeBio') || 'About Me / Bio'}</label>
               <textarea 
                  rows="4"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 p-3.5 font-jetbrains text-xs text-slate-900 focus:border-amber-500 transition-all outline-none resize-none leading-relaxed rounded-xl"
               />
            </div>

         </form>
      </div>

      {/* -------------------- COMPANY SECTION -------------------- */}
      <div className="pt-8 border-t border-slate-100 mt-8">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div className="flex items-center gap-4 group">
               <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center group-hover:border-amber-400 transition-colors shadow-sm shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500 group-hover:text-amber-600 transition-colors"><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><path d="M3 21h18"/></svg>
               </div>
               <div className="space-y-1 w-full">
                  <p className="font-jetbrains text-[10px] text-slate-700 uppercase tracking-[0.3em] font-bold">{t('companyNameLabel') || 'Company Name'}</p>
                  <input 
                    type="text" 
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-jetbrains text-xs text-slate-900 font-medium tracking-wide outline-none focus:border-amber-500 transition-all"
                  />
               </div>
            </div>

            <div className="flex items-center gap-4 group">
               <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center group-hover:border-amber-400 transition-colors shadow-sm shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500 group-hover:text-amber-600 transition-colors"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M16 4v16"/><path d="M12 4v16"/><path d="M8 4v16"/><path d="M3 10h18"/><path d="M3 14h18"/></svg>
               </div>
               <div className="space-y-1 w-full">
                  <p className="font-jetbrains text-[10px] text-slate-700 uppercase tracking-[0.3em] font-bold">{t('gstNumberLabel') || 'GST Number'}</p>
                  <input 
                    type="text" 
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-jetbrains text-xs text-slate-900 font-medium tracking-wide outline-none focus:border-amber-500 transition-all"
                  />
               </div>
            </div>

         </div>
      </div>

      {/* -------------------- ACTION HUB -------------------- */}
      <div className="flex justify-end pt-8">
         <button 
            onClick={handleSave}
            disabled={updateLoading}
            className="px-12 py-4 bg-accent text-slate-950 font-montserrat text-xs font-black uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all rounded-full shadow-accent-soft disabled:opacity-50 disabled:cursor-not-allowed"
         >
            {updateLoading ? (t('savingState') || 'Saving...') : (t('saveChangesBtn') || 'Save Changes')}
         </button>
      </div>

    </div>
  )
}

export default ProfileForm
