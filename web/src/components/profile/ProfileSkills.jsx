import React, { useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { updateUserProfile, deleteDocument } from '../../redux/slices/profileSlice'
import ConfirmModal from './ConfirmModal'
import { getImageBaseUrl } from '../../utils/apiConfig'

const ProfileSkills = () => {
  const dispatch = useDispatch()
  const { user, updateLoading } = useSelector((state) => state.profile)
  const skills = user?.skills || ['Design', 'Development', 'Marketing']
  const documentation = user?.documentation || []
  const fileInputRef = useRef(null)

  // Modal State
  const [modal, setModal] = useState({
    isOpen: false,
    id: null,
    name: ''
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

  const openDeleteModal = (id, name) => {
    setModal({
      isOpen: true,
      id,
      name
    })
  }

  const handleConfirmDelete = async () => {
    try {
      await dispatch(deleteDocument(modal.id)).unwrap()
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
        title="Remove Certificate?"
        message={`You are about to remove "${modal.name}" from your portfolio. This action is irreversible.`}
        confirmText="Remove Asset"
        loading={updateLoading}
      />
      
      {/* Skills Section */}
      <div className="space-y-6">
         <h3 className="font-jetbrains text-[10px] text-normal uppercase tracking-[0.4em] font-black">My Skills</h3>
         <div className="flex flex-wrap gap-2">
            {skills.map((skill, i) => (
               <div key={i} className="px-5 py-2.5 bg-white/[0.03] border border-white/10 font-inter text-[14px] text-normal hover:border-accent hover:text-accent transition-all cursor-default">
                  {skill}
               </div>
            ))}
            <div className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.01] border border-dashed border-white/20">
               <input 
                 type="text" placeholder="Add skill..."
                 className="bg-transparent border-none outline-none font-jetbrains text-[10px] text-normal w-24 placeholder:opacity-30"
               />
               <button className="text-accent text-lg leading-none">+</button>
            </div>
         </div>
      </div>

      {/* Documents Section */}
      <div className="space-y-6">
         <h3 className="font-jetbrains text-[10px] text-normal uppercase tracking-[0.4em] font-black">Certificates</h3>
         
         <div className="space-y-[1px] bg-white/5 border border-white/5 shadow-2xl max-h-[300px] overflow-y-auto">
            {documentation.length > 0 ? (
               documentation.map((doc, index) => (
                  <div key={doc._id || index} className="bg-dark p-6 flex justify-between items-center group hover:bg-white/[0.03] transition-all">
                     <div className="flex items-center gap-4">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-normal/40 group-hover:text-accent">
                           <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                           <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <div>
                           <p className="font-montserrat text-[15px] text-normal tracking-wide leading-tight">{doc.name || 'Unnamed Document'}</p>
                           <p className="font-jetbrains text-[9px] text-normal/20 uppercase tracking-[0.2em] mt-1">{doc.Doc ? 'Verified File' : 'Pending Verification'}</p>
                        </div>
                     </div>
                     <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        {doc.Doc && (
                           <a 
                              href={doc.Doc?.startsWith('http') ? doc.Doc : `${getImageBaseUrl()}/uploads/${doc.Doc?.replace(/^\/?(uploads\/)?/, '')}`}
                              target="_blank" 
                              rel="noreferrer"
                              className="text-accent hover:text-white transition-colors"
                           >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5-5 5 5m-5-5v12"/></svg>
                           </a>
                        )}
                        <button 
                           onClick={() => openDeleteModal(doc._id, doc.name)}
                           className="text-red-500/40 hover:text-red-500 transition-colors"
                        >
                           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 6L6 18M6 6l12 12" />
                           </svg>
                        </button>
                     </div>
                  </div>
               ))
            ) : (
               <div className="bg-dark p-10 text-center border-b border-white/5">
                  <p className="font-inter text-xl text-normal/20">No certificates uploaded yet.</p>
               </div>
            )}
         </div>

         {/* Upload Zone */}
         <div 
            onClick={handleUploadClick}
            className={`p-12 border border-dashed border-white/10 bg-white/[0.01] flex flex-col items-center justify-center text-center space-y-4 group hover:border-accent/40 hover:bg-accent/[0.02] transition-all duration-700 cursor-pointer ${updateLoading ? 'opacity-50 pointer-events-none' : ''}`}
         >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-normal/40 group-hover:text-accent group-hover:scale-110 transition-all duration-700">
               <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
               <polyline points="17 8 12 3 7 8" />
               <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <div className="space-y-1">
               <p className="font-jetbrains text-[10px] text-normal uppercase tracking-[0.4em] group-hover:text-normal transition-colors">
                  {updateLoading ? 'Uploading Assets...' : 'Upload File'}
               </p>
               <p className="font-jetbrains text-[9px] text-normal/40 uppercase tracking-[0.2em]">MAX SIZE 10MB</p>
            </div>
         </div>
      </div>

    </div>
  )
}

export default ProfileSkills
