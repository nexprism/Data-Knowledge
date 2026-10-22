import React, { useState, useEffect } from 'react'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import DashboardLoading from '../components/dashboard/DashboardLoading'
import { gsap } from 'gsap'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMyEnrollments } from '../redux/slices/enrollmentSlice'
import { useLanguage } from '../context/LanguageContext'
import { getApiBaseUrl } from '../utils/apiConfig'
import ReceiptModal from '../components/dashboard/ReceiptModal'

const Purchases = () => {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const { user } = useSelector((state) => state.auth)
  const { enrollments, loading, error } = useSelector((state) => state.enrollment)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedReceipt, setSelectedReceipt] = useState(null)
  const itemsPerPage = 5

  useEffect(() => {
    dispatch(fetchMyEnrollments())
  }, [dispatch])
  const baseUrl = getApiBaseUrl();
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = enrollments.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(enrollments.length / itemsPerPage)

  useEffect(() => {
    if (loading) return

    // Initial Archival Reveal
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1 } })
    tl.fromTo('.purchases-header', { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1 }, 0.2)
    tl.fromTo('.bento-ledger', { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1 }, '-=0.6')
    tl.fromTo('.bento-sidebar', { scale: 0.98, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, stagger: 0.1 }, '-=0.4')
  }, [loading])

  useEffect(() => {
    // Page Change Animation
    if (currentItems.length > 0) {
      gsap.fromTo('.ledger-row', 
        { x: -10, opacity: 0 }, 
        { x: 0, opacity: 1, stagger: 0.05, ease: 'power2.out', duration: 0.6 }
      )
    }
  }, [currentPage, currentItems])

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-slate-50 relative pb-16">
      <DashboardHeader />
      
      <main className="pt-24 pb-12 px-6 md:px-12">
        <div className="max-w-[1600px] mx-auto space-y-10">
          
          {/* HEADER SECTION */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 purchases-header">
            <div className="space-y-2">
               <p className="font-inter text-xs text-[#3498db] uppercase tracking-[0.3em] font-bold not-">{t('archiveLedger') || 'My Purchases & Enrollments'}</p>
               <h1 className="font-inter not- text-3xl md:text-5xl text-slate-900 font-extrabold tracking-tight leading-none uppercase">
                  {t('myPurchases') || 'My Purchases'}
               </h1>
            </div>
            <p className="max-w-md font-inter text-xs text-slate-600 font-medium leading-relaxed uppercase tracking-wider text-left md:text-right not-">
               {t('purchasesLedgerSub') || 'Persistent record of course enrollments and invoices across Data Knowledge.'}
            </p>
          </div>

          {/* DASHBOARD CONTAINER */}
          <div className="grid grid-cols-12 gap-8 items-start">
            
            {/* [PANEL A]: THE LEDGER NEXUS (Full Width Archive) */}
            <div className="col-span-12 space-y-6 bento-ledger">
               
               {/* Main Card Wrapper */}
               <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden min-h-[440px] relative">
                  
                  {/* Table Header Bar */}
                  <div className="grid grid-cols-12 px-8 py-5 border-b border-slate-200/80 bg-slate-100/80 z-20">
                     <div className="col-span-2 font-jetbrains text-xs text-slate-700 uppercase tracking-widest font-black">ID</div>
                     <div className="col-span-5 font-jetbrains text-xs text-slate-700 uppercase tracking-widest font-black">{t('moduleArchive') || 'Module Archive'}</div>
                     <div className="col-span-2 font-jetbrains text-xs text-slate-700 uppercase tracking-widest font-black text-center">{t('acquisition') || 'Acquisition'}</div>
                     <div className="col-span-1 font-jetbrains text-xs text-slate-700 uppercase tracking-widest font-black text-right">{t('amount') || 'Amount'}</div>
                     <div className="col-span-2 font-jetbrains text-xs text-slate-700 uppercase tracking-widest font-black text-right">{t('actions') || 'Actions'}</div>
                  </div>

                  {/* Loading Overlay */}
                  {loading && (
                     <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm z-10">
                        <DashboardLoading />
                     </div>
                  )}

                  {/* Error State */}
                  {error && (
                     <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                        <div className="font-jetbrains text-xs text-red-600 uppercase tracking-[0.4em] font-bold">Sync Error: {error}</div>
                     </div>
                  )}

                  {/* Empty State */}
                  {!loading && currentItems.length === 0 && (
                     <div className="flex flex-col items-center justify-center py-28 space-y-4">
                        <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v20M17 5H9.5a4.5 4.5 0 000 9h5a4.5 4.5 0 010 9H6" /></svg>
                        </div>
                        <p className="font-jetbrains text-xs text-slate-600 font-bold uppercase tracking-[0.3em]">No Acquisitions Found</p>
                     </div>
                  )}

                  {/* Table Rows */}
                  {currentItems.map((item, i) => (
                     <div key={item._id || i} className="ledger-row grid grid-cols-12 items-center px-8 py-6 bg-white hover:bg-blue-50/40 transition-colors group border-b border-slate-100 last:border-0 relative">
                        {/* Enrollment ID */}
                        <div className="col-span-2 font-jetbrains text-xs text-slate-500 group-hover:text-[#3498db] transition-colors font-bold uppercase tracking-wider">
                           #{item._id?.slice(-8).toUpperCase() || 'P-0000'}
                        </div>

                        {/* Course Info */}
                        <div className="col-span-5 space-y-1.5">
                           <h3 className="font-inter not- text-lg md:text-xl text-slate-900 font-bold group-hover:text-[#3498db] transition-colors leading-snug">
                              {item.course?.title || (item.error ? 'Legacy Module (Deleted)' : 'Protocol Error')}
                           </h3>
                           <div className="flex items-center gap-3">
                              <span className={`text-[9px] font-jetbrains font-bold px-3 py-0.5 rounded-full border ${
                                item.status === 'active' || item.status === 'COMPLETED'
                                  ? 'border-amber-300 bg-amber-100 text-amber-900' 
                                  : 'border-slate-200 bg-slate-100 text-slate-700'
                              }`}>{item.status?.toUpperCase() || 'PENDING'}</span>
                              
                              {item.iscompleted && (
                                <span className="text-[9px] font-jetbrains text-amber-700 uppercase tracking-widest font-black flex items-center gap-1.5">
                                   <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                   Certification Issued
                                </span>
                              )}
                           </div>
                        </div>

                        {/* Acquisition Date */}
                        <div className="col-span-2 font-jetbrains text-xs text-slate-600 font-medium uppercase tracking-wider text-center">
                           {item.enrolledAt ? new Date(item.enrolledAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase() : 'N/A'}
                        </div>

                        {/* Amount Paid */}
                        <div className="col-span-1 font-jetbrains text-sm text-slate-900 font-black text-right tracking-tight">
                           {item.pricePaid !== undefined ? `₹${item.pricePaid.toLocaleString()}` : 'FREE'}
                        </div>

                        {/* Actions */}
                        <div className="col-span-2 flex justify-end items-center gap-2 transition-all duration-500">
                           {item.certificate && (
                              <a 
                                href={item.certificate.certificate_url?.startsWith('http') ? item.certificate.certificate_url : `${baseUrl}/${item.certificate.certificate_url?.replace(/^\/+/, '')}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="font-jetbrains text-[10px] font-bold text-amber-800 hover:text-slate-950 uppercase tracking-wider transition-colors bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-full border border-amber-300/60 flex items-center gap-1"
                              >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                                <span>Certificate</span>
                              </a>
                           )}
                           <button 
                             onClick={() => setSelectedReceipt(item)}
                             className="font-jetbrains text-[10px] font-bold text-slate-700 hover:text-slate-950 uppercase tracking-wider transition-colors px-3 py-1.5 rounded-full bg-slate-100 hover:bg-amber-100 hover:border-amber-300 border border-slate-200 flex items-center gap-1.5 shadow-2xs"
                           >
                             <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                             <span>{t('receipt') || 'Receipt'}</span>
                           </button>
                        </div>
                     </div>
                  ))}
               </div>

               {/* PAGINATION CONTROLLER */}
               <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
                  <p className="font-jetbrains text-xs text-slate-500 font-medium uppercase tracking-[0.2em]">
                    Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, enrollments.length)} of {enrollments.length} Acquisitions
                  </p>
                 
                 <div className="flex items-center gap-3">
                   <button 
                     onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                     disabled={currentPage === 1}
                     className={`font-jetbrains text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border transition-all ${currentPage === 1 ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-slate-300 bg-white text-slate-700 hover:bg-accent hover:border-amber-400 hover:text-slate-950'}`}
                   >
                     Prev
                   </button>
                   
                   <div className="flex items-center gap-1.5">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                         <button
                           key={num}
                           onClick={() => paginate(num)}
                           className={`w-9 h-9 rounded-full font-jetbrains text-xs font-bold transition-all ${
                             currentPage === num 
                               ? 'bg-accent text-slate-950 shadow-sm font-black' 
                               : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                           }`}
                         >
                            {num}
                         </button>
                      ))}
                   </div>

                   <button 
                     onClick={() => currentPage < totalPages && paginate(currentPage + 1)}
                     disabled={currentPage === totalPages}
                     className={`font-jetbrains text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border transition-all ${currentPage === totalPages ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-slate-300 bg-white text-slate-700 hover:bg-accent hover:border-amber-400 hover:text-slate-950'}`}
                   >
                     Next
                   </button>
                 </div>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Official Receipt & Invoice Modal */}
      <ReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        enrollment={selectedReceipt}
        user={user}
      />
    </div>
  )
}

export default Purchases
