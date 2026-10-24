import React, { useState } from 'react';
import ConsultationModal from './ConsultationModal';

const ConsultationBanner = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quickForm, setQuickForm] = useState({
    name: '',
    phone: '',
    track: 'Master Data & Business Analyst',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!quickForm.name || !quickForm.phone) {
      setIsModalOpen(true);
      return;
    }
    // Open modal with prefilled data so candidate can pick preferred time slot
    setIsModalOpen(true);
  };

  return (
    <section id="consultation" className="relative w-full py-16 md:py-24 bg-gradient-to-b from-white via-slate-50 to-slate-100/80 overflow-hidden border-t border-slate-200">
      
      {/* Ambient background blur circles */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[650px] h-[350px] bg-[#3498db]/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-sky-100/50 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 lg:px-20">
        
        {/* Main Composite Card */}
        <div className="relative rounded-3xl bg-white border border-slate-200/90 p-8 sm:p-10 lg:p-14 shadow-xl shadow-slate-200/60 overflow-hidden">
          
          {/* Top subtle decorative color ribbon */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1a5276] via-[#3498db] to-cyan-400" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Side: Copy, Mentors & Guarantees (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#3498db]/10 border border-[#3498db]/25 text-[#1f6696] text-xs font-jetbrains font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>1-on-1 Career Mentorship</span>
              </div>

              {/* Title */}
              <div className="space-y-3">
                <h2 className="font-inter text-3xl sm:text-4xl lg:text-[2.6rem] font-extrabold text-slate-900 tracking-tight leading-[1.18]">
                  Ready to Start Your Career in Data? <br className="hidden sm:inline" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3498db] via-blue-600 to-[#1a5276]">
                    Book a Free 1-on-1 Consultation
                  </span>
                </h2>
                <p className="font-inter text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                  Connect directly with experienced data mentors (Ex-Cognizant, Ex-PwC) to evaluate your current profile, map your learning journey, and attend <strong>4 Free Demo Classes</strong> with zero risk.
                </p>
              </div>

              {/* 4 Value Proposition Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold font-inter text-slate-900">4 Free Demo Classes</p>
                    <p className="text-[11px] text-slate-500 font-inter">Try before you enroll</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="w-8 h-8 rounded-xl bg-[#3498db]/15 text-[#1f6696] flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold font-inter text-slate-900">100% Practical Roadmap</p>
                    <p className="text-[11px] text-slate-500 font-inter">SQL, BI, Python & ML</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold font-inter text-slate-900">1:1 Mentor Guidance</p>
                    <p className="text-[11px] text-slate-500 font-inter">Ex-Cognizant & PwC</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold font-inter text-slate-900">Placement Support</p>
                    <p className="text-[11px] text-slate-500 font-inter">Mocks & resume review</p>
                  </div>
                </div>
              </div>

              {/* Mentors Preview Ribbon */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <div className="flex -space-x-3">
                  <img
                    src="/data_knowlege/mentor/Rushikesh.jpeg"
                    alt="Mentor Rushikesh"
                    className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm ring-1 ring-slate-200"
                    onError={(e) => { e.target.src = '/herocard.png' }}
                  />
                  <img
                    src="/data_knowlege/mentor/krishna.jpeg"
                    alt="Mentor Krishna"
                    className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm ring-1 ring-slate-200"
                    onError={(e) => { e.target.src = '/herocard.png' }}
                  />
                </div>
                <div className="text-xs font-inter">
                  <p className="font-bold text-slate-900">Trained by Industry Veterans</p>
                  <p className="text-slate-500 text-[11px]">800+ Students Mentored • 4.9/5 Rating</p>
                </div>
              </div>

            </div>

            {/* Right Side: Quick Scheduler Card (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full bg-slate-50/90 border border-slate-200/90 rounded-3xl p-6 sm:p-7 space-y-5 shadow-sm">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#3498db]/15 text-[#1f6696] flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-inter font-bold text-slate-900 text-sm">Quick Appointment</h4>
                      <p className="font-inter text-[11px] text-slate-500">Pick time & confirm in 30s</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-jetbrains font-bold uppercase tracking-wider">
                    Free (15 Min)
                  </span>
                </div>

                {/* Form / Direct Action */}
                <div className="space-y-3 font-inter text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Your Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={quickForm.name}
                      onChange={(e) => setQuickForm({ ...quickForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3498db]/30 text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Phone / WhatsApp Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 9876543210"
                      value={quickForm.phone}
                      onChange={(e) => setQuickForm({ ...quickForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3498db]/30 text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Interested Track</label>
                    <select
                      value={quickForm.track}
                      onChange={(e) => setQuickForm({ ...quickForm, track: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3498db]/30 text-slate-800"
                    >
                      <option value="Master Data & Business Analyst">Master Data & Business Analyst</option>
                      <option value="Master Data Science">Master Data Science</option>
                      <option value="Master Machine Learning">Master Machine Learning</option>
                      <option value="Master Generative AI">Master Generative AI</option>
                      <option value="General Career Counseling">General Career Counseling</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2.5 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="w-full py-3.5 px-6 rounded-2xl bg-[#3498db] hover:bg-[#2980b9] text-white font-inter text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-[#3498db]/25 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-98 cursor-pointer"
                  >
                    <span>Pick Date & Book Free Slot</span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>

                  <a
                    href="https://wa.me/917483741501?text=Hi%20Data%20Knowledge,%20I%20would%20like%20to%20know%20more%20about%20your%20courses%20and%20book%20a%20free%20demo%20class."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-inter text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.584 1.861.947 2.796.948h.005c3.18 0 5.767-2.587 5.768-5.766.001-3.18-2.585-5.767-5.768-5.767zm7.545 5.766c-.002 4.161-3.387 7.546-7.549 7.546-1.282 0-2.518-.328-3.606-.949l-4.421 1.16 1.18-4.311a7.514 7.514 0 0 1-1.096-3.882c.002-4.161 3.388-7.546 7.549-7.546 4.162 0 7.545 3.385 7.545 7.546z" />
                    </svg>
                    <span>Instant Chat on WhatsApp</span>
                  </a>
                </div>

              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Consultation Booking Modal */}
      {isModalOpen && (
        <ConsultationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}
    </section>
  );
};

export default ConsultationBanner;
