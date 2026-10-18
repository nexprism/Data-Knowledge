import React, { useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { updateUserProfile, deleteDocument, deleteEducation } from '../../redux/slices/profileSlice'
import ConfirmModal from './ConfirmModal'
import { useLanguage } from '../../context/LanguageContext'
import { getImageBaseUrl } from '../../utils/apiConfig'

const AcademicInfo = () => {
  const fileInputRef = useRef(null)
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const { user, updateLoading } = useSelector((state) => state.profile)
  const education = user?.education || []
  const documentation = user?.documentation || []

  // Modal State
  const [modal, setModal] = useState({
    isOpen: false,
    type: null, // 'doc' or 'edu'
    id: null,
    title: '',
    message: ''
  })

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const formData = new FormData()
      formData.append('documentation', file)
      
      try {
        await dispatch(updateUserProfile(formData)).unwrap()
      } catch (err) {
        alert(`Upload failed: ${err}`)
      }
    }
  }

  const openDeleteModal = (type, id, name) => {
    setModal({
      isOpen: true,
      type,
      id,
      title: `Remove ${type === 'doc' ? 'Document' : 'Education'}?`,
      message: `Are you certain you wish to purge "${name}" from your permanent record? This action cannot be undone.`
    })
  }

  const handleConfirmDelete = async () => {
    const { type, id } = modal
    try {
      if (type === 'doc') {
        await dispatch(deleteDocument(id)).unwrap()
      } else {
        await dispatch(deleteEducation(id)).unwrap()
      }
      setModal({ ...modal, isOpen: false })
    } catch (err) {
      alert(`Deletion failed: ${err}`)
    }
  }

  return (
    <div className="space-y-12">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileChange}
        accept=".pdf,.jpg,.jpeg,.png"
      />

      <ConfirmModal 
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        onConfirm={handleConfirmDelete}
        title={modal.title}
        message={modal.message}
        confirmText="Confirm Deletion"
        loading={updateLoading}
      />
      
      {/* -------------------- EDUCATION HISTORY -------------------- */}
      <div className="space-y-6">
         <div className="flex justify-between items-end border-b border-slate-100 pb-4">
            <h2 className="font-inter text-3xl text-slate-900 font-bold tracking-tight lowercase flex items-center gap-2">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600"><path d="M12 2L2 7l10 5l10-5l-10-5z M2 17l10 5l10-5 M2 12l10 5l10-5" /></svg>
               {t('academic') || 'Education'} <span className="text-slate-400 font-normal">History</span>
            </h2>
            <button className="px-5 py-2 border border-slate-200 font-jetbrains text-xs text-slate-700 font-bold uppercase tracking-[0.2em] hover:bg-slate-100 transition-all rounded-full">{t('viewAll') || 'VIEW ALL'}</button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {education.length > 0 ? (
               education.map((edu, index) => (
                  <div key={edu._id || index} className="p-6 border border-slate-200/80 bg-slate-50 rounded-2xl flex flex-col items-start space-y-3 group relative overflow-hidden shadow-sm">
                     <div className="space-y-1 relative z-10 w-full">
                        <div className="flex justify-between items-start">
                           <p className="font-jetbrains text-xs text-amber-800 font-black uppercase tracking-[0.3em]">{edu.degree || 'Degree'}</p>
                           <p className="font-jetbrains text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                              {edu.startDate ? new Date(edu.startDate).getFullYear() : 'N/A'} — {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'}
                           </p>
                        </div>
                        <h4 className="font-inter text-2xl text-slate-900 font-bold tracking-tight">{edu.institution || 'Institution Name'}</h4>
                        <p className="font-jetbrains text-xs text-slate-600 font-medium uppercase tracking-widest pt-2 border-t border-slate-200/80 mt-3">Field of Study: {edu.fieldOfStudy || 'General'}</p>
                     </div>
                     
                     <button 
                        onClick={() => openDeleteModal('edu', edu._id, edu.institution)}
                        className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all p-2 hover:text-red-600 text-slate-400"
                     >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                     </button>
                  </div>
               ))
            ) : (
               <div className="p-8 border border-slate-200 bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 group">
                  <div className="w-12 h-12 rounded-full border border-dashed border-slate-300 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-all text-slate-400">
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-5-4.5-5-4.5s-3 2.9-5 4.5s-3 3.5-3 5.5a7 7 0 0 0 7 7z" /></svg>
                  </div>
                  <div className="space-y-1">
                     <p className="font-inter text-xl text-slate-500 capitalize">{t('noHistoryRecorded') || 'No History Recorded'}</p>
                     <p className="font-jetbrains text-[10px] text-slate-400 uppercase tracking-widest font-bold">{t('addEducationDetails') || 'Add your education details'}</p>
                  </div>
               </div>
            )}
            
            <div className="p-8 border-2 border-dashed border-slate-200 hover:border-amber-400 bg-slate-50/50 hover:bg-amber-50/30 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 cursor-pointer transition-all min-h-[140px]">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-amber-600"><path d="M12 5v14M5 12h14" /></svg>
               <p className="font-jetbrains text-xs text-amber-800 font-black uppercase tracking-[0.3em]">{t('addEducation') || 'ADD EDUCATION'}</p>
            </div>
         </div>
      </div>

      {/* -------------------- DOCUMENT VAULT -------------------- */}
      <div className="pt-8 border-t border-slate-100">
         <div className="flex justify-between items-end border-b border-slate-100 pb-4">
            <h2 className="font-inter text-3xl text-slate-900 font-bold tracking-tight lowercase flex items-center gap-2">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
               My <span className="text-slate-400 font-normal">{t('myDocuments') || 'Documents'}</span>
            </h2>
            <button 
               onClick={handleUploadClick}
               disabled={updateLoading}
               className="px-8 py-3.5 bg-accent text-slate-950 font-jetbrains text-xs font-black uppercase tracking-[0.3em] hover:scale-105 transition-all rounded-full shadow-accent-soft disabled:opacity-50"
            >
               {updateLoading ? 'Uploading...' : (t('uploadFile') || 'UPLOAD FILE')}
            </button>
         </div>

         {/* Document List */}
         <div className="mt-6 space-y-4">
            {documentation.length > 0 ? (
               <div className="grid grid-cols-1 gap-3">
                  {documentation.map((doc, index) => (
                     <div key={doc._id || index} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center group hover:border-amber-400 transition-all shadow-sm">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-amber-100 border border-amber-300/60 rounded-lg flex items-center justify-center">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-800">
                                 <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                 <polyline points="14 2 14 8 20 8" />
                              </svg>
                           </div>
                           <div>
                              <p className="font-jetbrains text-xs text-slate-900 font-bold uppercase tracking-wider truncate max-w-[240px]">{doc.name || 'Untitled Document'}</p>
                              <p className="font-jetbrains text-[10px] text-slate-500 uppercase tracking-widest mt-0.5 font-medium">Verified Asset</p>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           {doc.Doc && (
                              <a 
                                 href={doc.Doc?.startsWith('http') ? doc.Doc : `${getImageBaseUrl()}/uploads/${doc.Doc?.replace(/^\/?(uploads\/)?/, '')}`}
                                 target="_blank" 
                                 rel="noreferrer"
                                 className="p-2.5 bg-amber-100 border border-amber-300 text-amber-900 hover:bg-amber-400 hover:text-slate-950 transition-all rounded-lg"
                                 title="View Document"
                              >
                                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              </a>
                           )}
                           <button 
                              onClick={() => openDeleteModal('doc', doc._id, doc.name)}
                              className="p-2.5 bg-red-50 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-all rounded-lg"
                              title="Remove Asset"
                           >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
            ) : (
               <div 
                  onClick={handleUploadClick}
                  className={`p-12 border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-amber-50/30 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 group transition-all duration-300 cursor-pointer ${updateLoading ? 'opacity-50 pointer-events-none' : ''}`}
               >
                  <div className="w-14 h-14 bg-amber-100 border border-amber-300/60 rounded-full flex items-center justify-center text-amber-700 group-hover:scale-110 transition-transform">
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12M12 3l-4 4M12 3l4 4M5 20h14"/></svg>
                  </div>
                  <p className="font-jetbrains text-xs text-slate-600 font-medium uppercase tracking-wider max-w-xs mx-auto">Your document vault is empty. Upload certificates for carrier verification.</p>
               </div>
            )}
         </div>
      </div>

    </div>
  )
}

export default AcademicInfo
