import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { useDispatch, useSelector } from 'react-redux';
import { createSupportTicket, fetchMyTickets, resetSupportState } from '../redux/slices/supportSlice';
import { useLanguage } from '../context/LanguageContext';

const DashboardSupport = () => {
    const dispatch = useDispatch();
    const { t } = useLanguage();
    const { tickets, loading, submitting, error, success } = useSelector((state) => state.support);
    const { user } = useSelector((state) => state.auth);

    const [activeTab, setActiveTab] = useState('raise');
    const [queryType, setQueryType] = useState('general');
    const [charCount, setCharCount] = useState(0);
    const [showEmojis, setShowEmojis] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [formError, setFormError] = useState('');
    const containerRef = useRef(null);
    const fileInputRef = useRef(null);

    const quickEmojis = ['👋', '❓', '⚠️', '🐞', '💳', '📧', '📎', '⚡'];

    // Form State
    const [formData, setFormData] = useState({
        userName: user?.fullName || user?.name || '',
        userEmail: user?.email || '',
        userPhone: user?.phone || '',
        subject: '',
        description: '',
        priority: 'medium',
        attachment: null
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                userName: prev.userName || user?.fullName || user?.name || '',
                userEmail: prev.userEmail || user?.email || '',
                userPhone: prev.userPhone || user?.phone || ''
            }));
        }
    }, [user]);

    useEffect(() => {
        dispatch(fetchMyTickets());
    }, [dispatch]);

    useEffect(() => {
        if (activeTab === 'my') {
            dispatch(fetchMyTickets());
        }
    }, [dispatch, activeTab]);

    useEffect(() => {
        if (success) {
            setShowSuccessModal(true);
            setFormData({
                userName: user?.fullName || user?.name || '',
                userEmail: user?.email || '',
                userPhone: user?.phone || '',
                subject: '',
                description: '',
                priority: 'medium',
                attachment: null
            });
            setCharCount(0);
            setFormError('');
            dispatch(resetSupportState());
            dispatch(fetchMyTickets());
        }
    }, [success, dispatch, user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'description') setCharCount(value.length);
        if (formError) setFormError('');
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.size > 10 * 1024 * 1024) {
            setFormError('File size exceeds the 10MB limit. Please upload a smaller file.');
            return;
        }
        setFormData(prev => ({ ...prev, attachment: file }));
        setFormError('');
    };

    const removeAttachment = (e) => {
        e.stopPropagation();
        setFormData(prev => ({ ...prev, attachment: null }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const addEmoji = (emoji) => {
        setFormData(prev => ({ ...prev, description: prev.description + emoji }));
        setCharCount(prev => prev + emoji.length);
        setShowEmojis(false);
    };

    const handleSubmit = (e) => {
        e?.preventDefault();
        if (!formData.subject.trim() || !formData.description.trim() || !formData.userEmail.trim()) {
            setFormError('Please fill in all required fields: Subject, Description, and Email.');
            return;
        }

        const data = new FormData();
        data.append('subject', formData.subject.trim());
        data.append('category', queryType);
        data.append('description', formData.description.trim());
        data.append('priority', formData.priority);
        data.append('userName', formData.userName.trim());
        data.append('userEmail', formData.userEmail.trim());
        data.append('userPhone', formData.userPhone.trim());
        if (formData.attachment) {
            data.append('attachment', formData.attachment);
        }

        dispatch(createSupportTicket(data));
    };

    useEffect(() => {
        window.scrollTo(0, 0);
        const ctx = gsap.context(() => {
            gsap.fromTo('.support-reveal',
                { y: 15, opacity: 0 },
                { 
                    y: 0, 
                    opacity: 1, 
                    duration: 0.6, 
                    stagger: 0.08, 
                    ease: 'power2.out' 
                }
            );
        }, containerRef);
        return () => ctx.revert();
    }, [activeTab]);

    const queryTypes = [
        { 
            id: 'general', 
            title: 'General Inquiry', 
            desc: 'Course access, account help, and platform questions', 
            icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' 
        },
        { 
            id: 'technical', 
            title: 'Technical Support', 
            desc: 'Video playback, code editor, or technical glitches', 
            icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z' 
        },
        { 
            id: 'bug', 
            title: 'Bug Report', 
            desc: 'Something is not working or behaving as expected', 
            icon: 'M9.172 19.172a4 4 0 0 1 5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z M9.172 19.172a4 4 0 0 1 5.656 0' 
        },
        { 
            id: 'billing', 
            title: 'Billing & Payments', 
            desc: 'Invoices, transaction queries, and refunds', 
            icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3z' 
        }
    ];

    return (
        <div ref={containerRef} className="min-h-screen bg-slate-50 text-slate-900 selection:bg-amber-100 selection:text-amber-900 font-inter relative overflow-x-hidden">
            <DashboardHeader />
            
            <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-10">
                <div className="max-w-6xl mx-auto space-y-10">
                    
                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between items-start gap-6 support-reveal opacity-0">
                        <div className="space-y-1.5">
                            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                                {t('supportProtocolTag') || 'Help & Support'}
                            </span>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                                {t('supportCenter') || 'Support Center'}
                            </h1>
                            <p className="text-sm text-slate-500 max-w-xl">
                                Need help with your courses or account? Raise a ticket and our support team will assist you.
                            </p>
                        </div>
                        
                        {/* Quick Stats Pill */}
                        <div className="hidden sm:flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200/80 shadow-sm">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Average Response</p>
                                <p className="text-sm font-bold text-slate-900">Within 24 Hours</p>
                            </div>
                        </div>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex items-center gap-3 border-b border-slate-200 pb-4 support-reveal opacity-0">
                        <button 
                            onClick={() => setActiveTab('raise')}
                            className={`flex items-center gap-2 text-sm font-semibold transition-all px-5 py-2.5 rounded-xl cursor-pointer
                              ${activeTab === 'raise' 
                                ? 'text-slate-900 bg-amber-400 shadow-sm' 
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}`}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            <span>{t('raiseTicket') || 'Raise a Ticket'}</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('my')}
                            className={`flex items-center gap-2 text-sm font-semibold transition-all px-5 py-2.5 rounded-xl cursor-pointer
                              ${activeTab === 'my' 
                                ? 'text-slate-900 bg-amber-400 shadow-sm' 
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}`}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                            <span>{t('myTickets') || 'My Tickets'}</span>
                            {tickets?.length > 0 && (
                                <span className="ml-1 px-2 py-0.5 text-xs font-bold rounded-full bg-slate-900 text-white">
                                    {tickets.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {activeTab === 'raise' ? (
                        <form onSubmit={handleSubmit} className="space-y-10">
                            {/* Error Banner */}
                            {formError && (
                                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-3">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="8" x2="12" y2="12"></line>
                                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                    </svg>
                                    <span>{formError}</span>
                                </div>
                            )}

                            {/* Section 1: Contact Information */}
                            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6 support-reveal opacity-0">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                                        {t('contactInfo') || 'Contact Information'}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Please provide accurate contact details so we can update you regarding your inquiry.
                                    </p>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-semibold text-slate-700">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-600 transition-colors">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m8-11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/></svg>
                                            </div>
                                            <input 
                                                type="text" 
                                                name="userName"
                                                value={formData.userName}
                                                onChange={handleInputChange}
                                                placeholder="Enter your full name" 
                                                required
                                                className="w-full bg-slate-50/70 border border-slate-200 rounded-xl py-3 pl-11 pr-4 outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition-all text-sm text-slate-900 placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-xs font-semibold text-slate-700">
                                            Email Address <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-600 transition-colors">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="m22 6-10 7L2 6"/></svg>
                                            </div>
                                            <input 
                                                type="email" 
                                                name="userEmail"
                                                value={formData.userEmail}
                                                onChange={handleInputChange}
                                                placeholder="name@example.com" 
                                                required
                                                className="w-full bg-slate-50/70 border border-slate-200 rounded-xl py-3 pl-11 pr-4 outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition-all text-sm text-slate-900 placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-xs font-semibold text-slate-700">
                                            Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-600 transition-colors">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                            </div>
                                            <input 
                                                type="tel" 
                                                name="userPhone"
                                                value={formData.userPhone}
                                                onChange={handleInputChange}
                                                placeholder="+91 98765 43210" 
                                                className="w-full bg-slate-50/70 border border-slate-200 rounded-xl py-3 pl-11 pr-4 outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition-all text-sm text-slate-900 placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-xs font-semibold text-slate-700">
                                            Ticket Subject <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-600 transition-colors">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                            </div>
                                            <input 
                                                type="text" 
                                                name="subject"
                                                value={formData.subject}
                                                onChange={handleInputChange}
                                                placeholder="Brief summary of the issue" 
                                                required
                                                className="w-full bg-slate-50/70 border border-slate-200 rounded-xl py-3 pl-11 pr-4 outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition-all text-sm text-slate-900 placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Support Category */}
                            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6 support-reveal opacity-0">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                                        {t('supportCategory') || 'Support Category'}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Select the category that best matches your request.
                                    </p>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {queryTypes.map((type) => (
                                        <div 
                                            key={type.id}
                                            onClick={() => setQueryType(type.id)}
                                            className={`p-5 rounded-2xl transition-all duration-200 cursor-pointer border flex flex-col justify-between gap-4 text-left
                                              ${queryType === type.id 
                                                ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/30 shadow-sm' 
                                                : 'bg-slate-50/50 border-slate-200 hover:bg-white hover:border-slate-300'}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                                                  ${queryType === type.id ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-white border border-slate-200 text-slate-600'}`}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={type.icon}/></svg>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                                                  ${queryType === type.id ? 'border-amber-500 bg-amber-500' : 'border-slate-300'}`}>
                                                    {queryType === type.id && (
                                                        <div className="w-2 h-2 rounded-full bg-white" />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className={`text-sm font-bold ${queryType === type.id ? 'text-amber-950' : 'text-slate-900'}`}>
                                                    {type.title}
                                                </h4>
                                                <p className="text-xs text-slate-500 leading-relaxed">
                                                    {type.desc}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Section 3: Issue Description & File Attachment */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 support-reveal opacity-0">
                                {/* Description Area */}
                                <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                                                {t('intelligenceBriefingTitle') || 'Describe Your Issue'} <span className="text-red-500">*</span>
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Please include relevant details, error messages, or course names.
                                            </p>
                                        </div>
                                        <div className="text-xs font-semibold text-slate-400">
                                            {charCount} / 1000
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <textarea 
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            maxLength={1000}
                                            required
                                            placeholder="Explain what happened, what you expected, and any steps to reproduce..."
                                            className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl p-4 sm:p-5 h-52 outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition-all text-sm text-slate-900 resize-none placeholder:text-slate-400 leading-relaxed"
                                        />
                                        
                                        {/* Emoji Trigger */}
                                        <div className="absolute bottom-4 right-4 flex items-center gap-2">
                                            <button 
                                                type="button"
                                                onClick={() => setShowEmojis(!showEmojis)}
                                                className={`p-2 rounded-lg transition-colors ${showEmojis ? 'bg-amber-100 text-amber-700' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
                                                title="Add Emoji"
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                                            </button>
                                            
                                            {showEmojis && (
                                                <div className="absolute bottom-12 right-0 bg-white border border-slate-200 rounded-2xl p-2.5 flex gap-1.5 z-30 shadow-xl animate-in fade-in zoom-in-95">
                                                    {quickEmojis.map(emoji => (
                                                        <button 
                                                            key={emoji}
                                                            type="button"
                                                            onClick={() => addEmoji(emoji)}
                                                            className="hover:scale-125 transition-transform p-1.5 text-lg"
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Attachment Box */}
                                <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                                            {t('attachmentsTitle') || 'Attachment'}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Add a screenshot or document (max 10MB).
                                        </p>
                                    </div>

                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden" 
                                        accept="image/*,.pdf"
                                    />

                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-amber-400 transition-all cursor-pointer group text-center min-h-[160px]
                                          ${formData.attachment ? 'border-amber-400 bg-amber-50/40' : 'border-slate-200 bg-slate-50/50 hover:bg-white'}`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all
                                          ${formData.attachment ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-white border border-slate-200 text-slate-500 group-hover:border-amber-400 group-hover:text-amber-600'}`}>
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                {formData.attachment ? <path d="M20 6L9 17l-5-5"/> : <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5-5 5 5m-5-5v12"/>}
                                            </svg>
                                        </div>

                                        <div className="space-y-1">
                                            {formData.attachment ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <p className="text-xs font-semibold text-slate-900 truncate max-w-[180px]">
                                                        {formData.attachment.name}
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={removeAttachment}
                                                        className="text-red-500 hover:text-red-700 p-0.5 rounded"
                                                        title="Remove file"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="text-xs font-bold text-slate-800">
                                                        Click to upload file
                                                    </p>
                                                    <p className="text-[11px] text-slate-400">
                                                        PNG, JPG, or PDF up to 10MB
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-[11px] text-slate-400 text-center">
                                        Screenshots help resolve issues faster
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button Bar */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 support-reveal opacity-0">
                                <p className="text-xs text-slate-500">
                                    By submitting, your ticket will be routed to the appropriate support specialist.
                                </p>
                                <button 
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-sm hover:shadow active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {submitting ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-slate-950" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                            </svg>
                                            <span>Submitting Ticket...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                            </svg>
                                            <span>Submit Support Ticket</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    ) : (
                        /* My Tickets Tab */
                        <div className="support-reveal opacity-0 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                                        {t('raisedTickets') || 'Submitted Tickets'}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        View and track the status of your past support requests.
                                    </p>
                                </div>
                                <button
                                    onClick={() => dispatch(fetchMyTickets())}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-white transition-colors"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                                    <span>Refresh</span>
                                </button>
                            </div>
                            
                            <div className="overflow-hidden border border-slate-200/90 bg-white rounded-2xl shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/90 border-b border-slate-200 text-xs text-slate-600 font-semibold">
                                                <th className="p-4 sm:p-5">{t('protocolIdCol') || 'Ticket ID'}</th>
                                                <th className="p-4 sm:p-5">{t('briefingSubjectCol') || 'Subject'}</th>
                                                <th className="p-4 sm:p-5">{t('classificationCol') || 'Category'}</th>
                                                <th className="p-4 sm:p-5">{t('currentStateCol') || 'Status'}</th>
                                                <th className="p-4 sm:p-5 text-right">{t('timestampCol') || 'Date'}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-sm">
                                            {loading ? (
                                                <tr>
                                                    <td colSpan="5" className="p-12 text-center text-slate-500 font-medium">
                                                        <div className="flex flex-col items-center justify-center gap-2">
                                                            <svg className="animate-spin h-6 w-6 text-amber-500" viewBox="0 0 24 24" fill="none">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                                            </svg>
                                                            <span>Loading tickets...</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : tickets.length > 0 ? (
                                                tickets.map((ticket) => {
                                                    const statusLower = (ticket.status || 'open').toLowerCase();
                                                    const statusStyles = {
                                                        resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                                        open: 'bg-amber-50 text-amber-700 border-amber-200',
                                                        in_progress: 'bg-blue-50 text-blue-700 border-blue-200'
                                                    };

                                                    return (
                                                        <tr key={ticket._id} className="hover:bg-slate-50/80 transition-colors">
                                                            <td className="p-4 sm:p-5 font-mono text-xs font-semibold text-slate-600">
                                                                #{ticket._id?.slice(-6).toUpperCase()}
                                                            </td>
                                                            <td className="p-4 sm:p-5 font-semibold text-slate-900">
                                                                {ticket.subject}
                                                                {ticket.description && (
                                                                    <p className="text-xs text-slate-500 font-normal mt-0.5 line-clamp-1">
                                                                        {ticket.description}
                                                                    </p>
                                                                )}
                                                            </td>
                                                            <td className="p-4 sm:p-5">
                                                                <span className="capitalize text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                                                    {ticket.category || 'General'}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 sm:p-5">
                                                                <span className={`capitalize text-xs font-semibold px-2.5 py-1 rounded-full border ${statusStyles[statusLower] || statusStyles.open}`}>
                                                                    {statusLower.replace('_', ' ')}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 sm:p-5 text-right text-xs text-slate-500">
                                                                {new Date(ticket.createdAt).toLocaleDateString('en-US', { 
                                                                    month: 'short', 
                                                                    day: 'numeric', 
                                                                    year: 'numeric' 
                                                                })}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="p-12 text-center text-slate-400 text-sm">
                                                        <div className="flex flex-col items-center justify-center gap-2">
                                                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                                            </div>
                                                            <p className="font-medium text-slate-600">No support tickets found</p>
                                                            <p className="text-xs text-slate-400">Tickets you submit will be listed here.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Success Confirmation Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 text-center space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm ring-8 ring-emerald-50">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                        </div>

                        <div>
                            <h3 className="text-2xl font-bold text-slate-900">
                                Ticket Submitted!
                            </h3>
                            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                                Your support ticket has been received. Our team will review your details and reach out to your email shortly.
                            </p>
                        </div>

                        <div className="pt-2 flex flex-col sm:flex-row gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    setActiveTab('my');
                                }}
                                className="flex-1 py-3 px-4 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-sm"
                            >
                                View My Tickets
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowSuccessModal(false)}
                                className="flex-1 py-3 px-4 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-sm rounded-xl transition-all"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardSupport;
