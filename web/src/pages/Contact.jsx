import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { gsap } from 'gsap';
import {
    fetchContactPage,
    submitContactForm,
    resetContactFormState
} from '../redux/slices/contactSlice';
import { useLanguage } from '../context/LanguageContext';

const DEFAULT_SUBJECT_OPTIONS = [
    'General Inquiry',
    'Course Enquiry',
    'Solopreneur',
    'Personal Branding',
    'Studio Services',
    'Cohort Enrollment',
    'Offline Mentorship Enrollment',
    'Billing or Payment Issue',
    'Feedback',
    'Complaint',
    'Other'
];

const Contact = () => {
    const dispatch = useDispatch();
    const { t } = useLanguage();
    const { user } = useSelector((state) => state.auth);
    const { data: contactConfig, submitting, error, submitSuccess } = useSelector((state) => state.contact);

    const containerRef = useRef(null);
    const scanLineRef = useRef(null);

    const [formData, setFormData] = useState({
        userName: user?.name || user?.fullName || '',
        userEmail: user?.email || '',
        code: '+91',
        phoneNumber: '',
        subject: 'General Inquiry',
        description: ''
    });

    const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
    const [clientError, setClientError] = useState('');

    useEffect(() => {
        dispatch(fetchContactPage());
        dispatch(resetContactFormState());
        window.scrollTo(0, 0);

        // GSAP Animations
        const ctx = gsap.context(() => {
            gsap.fromTo('.contact-reveal',
                { y: 40, opacity: 0, filter: 'blur(8px)' },
                {
                    y: 0,
                    opacity: 1,
                    filter: 'blur(0px)',
                    duration: 1,
                    stagger: 0.12,
                    ease: 'power3.out',
                    delay: 0.1
                }
            );

            // Subtle scrolling scanline effect on details card
            if (scanLineRef.current) {
                gsap.to(scanLineRef.current, {
                    top: '100%',
                    duration: 5,
                    repeat: -1,
                    ease: 'none'
                });
            }
        }, containerRef);

        return () => ctx.revert();
    }, [dispatch]);

    // Prefill user data if auth state changes
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                userName: prev.userName || user.name || user.fullName || '',
                userEmail: prev.userEmail || user.email || '',
                phoneNumber: prev.phoneNumber || user.phone || user.phoneNumber || ''
            }));
        }
    }, [user]);

    // Handle ticket submission status changes
    useEffect(() => {
        if (submitSuccess) {
            setShowSuccessOverlay(true);
            setClientError('');
            // Reset form
            setFormData({
                userName: user?.name || user?.fullName || '',
                userEmail: user?.email || '',
                code: '+91',
                phoneNumber: '',
                subject: contactConfig?.subjectOptions?.[0] || 'General Inquiry',
                description: ''
            });
            dispatch(resetContactFormState());
        }
    }, [submitSuccess, dispatch, user, contactConfig]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (clientError) setClientError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setClientError('');

        if (!formData.userName?.trim()) {
            setClientError('Please enter your full name.');
            return;
        }
        if (!formData.userEmail?.trim() || !/^\S+@\S+\.\S+$/.test(formData.userEmail.trim())) {
            setClientError('Please enter a valid email address.');
            return;
        }
        if (!formData.phoneNumber?.trim()) {
            setClientError('Please enter your phone number.');
            return;
        }
        if (!formData.subject?.trim()) {
            setClientError('Please select a subject for your inquiry.');
            return;
        }

        const pageUrl = new URL(window.location.href);

        const payload = {
            name: formData.userName.trim(),
            email: formData.userEmail.trim(),
            phone: `${formData.code.trim()} ${formData.phoneNumber.trim()}`.trim(),
            subject: formData.subject,
            message: formData.description.trim() || '',
            source: 'Contact Form',
            extra: {
                website: window.location.hostname,
                pageUrl: window.location.href,
                referrer: document.referrer || '',
                formName: 'Contact Form',
                utm: {
                    source: pageUrl.searchParams.get('utm_source') || '',
                    medium: pageUrl.searchParams.get('utm_medium') || '',
                    campaign: pageUrl.searchParams.get('utm_campaign') || ''
                }
            }
        };

        dispatch(submitContactForm(payload));
    };

    const subjectOptions =
        contactConfig?.subjectOptions && contactConfig.subjectOptions.length > 0
            ? contactConfig.subjectOptions
            : DEFAULT_SUBJECT_OPTIONS;

    const badgeText = contactConfig?.badgeText || t('getInTouch') || 'GET IN TOUCH';
    const pageTitle = contactConfig?.title || t('contactUs') || 'CONTACT US.';
    const pageDesc = contactConfig?.description || t('contactDesc') || 'We are here to help! Whether you have questions about our courses, need technical support, or just want to share feedback, the Support Team is always ready to assist you.';

    const primaryEmail = contactConfig?.primaryEmail || 'dataknowledge.class@gmail.com';
    const emailSupportDesc = contactConfig?.emailSupportDescription || 'For program inquiries, course questions, or mentorship assistance:';
    const primaryPhone = contactConfig?.primaryPhone || '+91 74837 41501';
    const alternatePhone = contactConfig?.alternatePhone || '+91 82377 00626';
    const whatsappDigits = (contactConfig?.whatsappNumber || '917483741501').replace(/[^0-9]/g, '');
    const whatsappText = contactConfig?.whatsappText || 'Chat on WhatsApp';
    const portalTitle = contactConfig?.portalTitle || 'Live Classes Portal';
    const portalUrl = contactConfig?.portalUrl || 'https://classes.dataknowledge.in/';
    const portalDesc = contactConfig?.portalDescription || 'Access online live sessions, assignments, and mock test portal:';
    const officeAddress = contactConfig?.address || '';

    return (
        <div ref={containerRef} className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 relative overflow-x-hidden pt-28 md:pt-36 pb-24 px-4 md:px-12 lg:px-20 font-inter">
            {/* Ambient Background Glows */}
            <div className="absolute inset-0 pointer-events-none opacity-40 z-0 overflow-hidden">
                <div className="absolute -top-24 left-1/4 w-[500px] h-[500px] bg-blue-100/60 blur-[140px] rounded-full" />
                <div className="absolute top-1/3 -right-24 w-[450px] h-[450px] bg-sky-100/50 blur-[130px] rounded-full" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Contact Header */}
                <div className="mb-12 md:mb-16 contact-reveal">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#3498db]/10 border border-[#3498db]/20 text-[#2980b9] text-xs font-semibold tracking-wider uppercase mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3498db] animate-pulse" />
                        <span>{badgeText || 'Get In Touch'}</span>
                    </div>
                    <h1 className="font-inter text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                        {pageTitle?.replace(/\.$/, '') || 'Contact Us'}
                    </h1>
                    <p className="font-inter text-slate-600 text-sm sm:text-base md:text-lg max-w-2xl mt-4 leading-relaxed font-normal">
                        {pageDesc}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                    {/* Left Column: Form */}
                    <div className="lg:col-span-7 contact-reveal">
                        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-200/50">
                            <div className="mb-8">
                                <h2 className="font-inter text-2xl text-slate-900 font-bold tracking-tight">
                                    {t('sendMessage') || 'Send a Message'}
                                </h2>
                                <p className="font-inter text-sm text-slate-500 mt-1.5">
                                    Fill out the form below and our team will get back to you shortly.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="block font-inter text-xs sm:text-sm font-semibold text-slate-700">
                                            {t('yourNameLabel') || 'Your Name'} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="userName"
                                            value={formData.userName}
                                            onChange={handleInputChange}
                                            placeholder={t('enterYourName') || 'John Doe'}
                                            required
                                            className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-4 py-3.5 font-inter text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#3498db] focus:ring-4 focus:ring-[#3498db]/10 transition-all outline-none shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block font-inter text-xs sm:text-sm font-semibold text-slate-700">
                                            {t('emailAddressLabel') || 'Email Address'} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            name="userEmail"
                                            value={formData.userEmail}
                                            onChange={handleInputChange}
                                            placeholder={t('enterYourEmail') || 'john@example.com'}
                                            required
                                            className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-4 py-3.5 font-inter text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#3498db] focus:ring-4 focus:ring-[#3498db]/10 transition-all outline-none shadow-sm"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                                    <div className="md:col-span-1 space-y-2">
                                        <label className="block font-inter text-xs sm:text-sm font-semibold text-slate-700">
                                            Code <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="code"
                                            value={formData.code}
                                            onChange={handleInputChange}
                                            placeholder="+91"
                                            required
                                            className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-3.5 font-inter text-sm text-center font-medium text-slate-900 focus:bg-white focus:border-[#3498db] focus:ring-4 focus:ring-[#3498db]/10 transition-all outline-none shadow-sm"
                                        />
                                    </div>
                                    <div className="md:col-span-3 space-y-2">
                                        <label className="block font-inter text-xs sm:text-sm font-semibold text-slate-700">
                                            {t('phoneNumberLabel') || 'Phone Number'} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            name="phoneNumber"
                                            value={formData.phoneNumber}
                                            onChange={handleInputChange}
                                            placeholder={t('enterYourPhone') || '98765 43210'}
                                            required
                                            className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-4 py-3.5 font-inter text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#3498db] focus:ring-4 focus:ring-[#3498db]/10 transition-all outline-none shadow-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block font-inter text-xs sm:text-sm font-semibold text-slate-700">
                                        {t('subjectLabel') || 'Subject'} <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleInputChange}
                                            className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-4 py-3.5 pr-10 font-inter text-sm text-slate-900 focus:bg-white focus:border-[#3498db] focus:ring-4 focus:ring-[#3498db]/10 transition-all outline-none shadow-sm appearance-none cursor-pointer"
                                        >
                                            {subjectOptions.map(opt => (
                                                <option key={opt} value={opt} className="bg-white text-slate-900">{opt}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block font-inter text-xs sm:text-sm font-semibold text-slate-700">
                                        {t('messageLabel') || 'Your Message / Query'}
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder={t('tellUsHowHelp') || 'Write your query or message here...'}
                                        rows="4"
                                        className="w-full bg-slate-50/70 border border-slate-200 rounded-xl p-4 font-inter text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#3498db] focus:ring-4 focus:ring-[#3498db]/10 transition-all outline-none shadow-sm resize-y min-h-[120px]"
                                    />
                                </div>

                                {(clientError || error) && (
                                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 font-inter text-xs flex items-center gap-2">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-red-500">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="8" x2="12" y2="12" />
                                            <line x1="12" y1="16" x2="12.01" y2="16" />
                                        </svg>
                                        <span>{clientError || error}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-[#3498db] hover:bg-[#2980b9] text-white py-4 px-6 rounded-xl flex items-center justify-center gap-3 font-inter font-bold text-sm transition-all duration-200 shadow-md shadow-[#3498db]/20 hover:shadow-lg hover:shadow-[#3498db]/30 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Sending message...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>{t('sendMessageBtn') || 'Send Message'}</span>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="22" y1="2" x2="11" y2="13" />
                                                <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right Column: Support Channels & Direct Contacts */}
                    <div className="lg:col-span-5 space-y-6 contact-reveal lg:sticky lg:top-28">
                        {/* Channels Card */}
                        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="font-inter font-bold text-lg text-slate-900">Direct Contact</h3>
                                    <p className="font-inter text-xs text-slate-500 mt-0.5">Reach out to us directly through any channel</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-blue-50 text-[#3498db] flex items-center justify-center">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Email Support */}
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-[#3498db] flex items-center justify-center shrink-0 border border-sky-100">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="2" y="4" width="20" height="16" rx="2" />
                                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                    </svg>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-inter text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('emailSupport') || 'Email Support'}</h4>
                                    <p className="font-inter text-xs text-slate-500 leading-relaxed">{emailSupportDesc}</p>
                                    <a
                                        href={`mailto:${primaryEmail}`}
                                        className="font-inter text-sm sm:text-base font-bold text-[#3498db] hover:text-[#2980b9] hover:underline transition-colors block break-all pt-0.5"
                                    >
                                        {primaryEmail}
                                    </a>
                                </div>
                            </div>

                            {/* Phone & Calls */}
                            <div className="flex items-start gap-4 pt-4 border-t border-slate-100">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                    </svg>
                                </div>
                                <div className="space-y-1 w-full">
                                    <h4 className="font-inter text-xs font-semibold text-slate-500 uppercase tracking-wider">Call & Enquiries</h4>
                                    <div className="flex flex-col gap-1 pt-0.5 font-inter text-sm">
                                        {primaryPhone && (
                                            <a href={`tel:${primaryPhone.replace(/\s+/g, '')}`} className="font-semibold text-slate-900 hover:text-[#3498db] transition-colors flex items-center justify-between">
                                                <span>{primaryPhone}</span>
                                                <span className="text-[11px] font-medium text-slate-400">Primary</span>
                                            </a>
                                        )}
                                        {alternatePhone && (
                                            <a href={`tel:${alternatePhone.replace(/\s+/g, '')}`} className="font-semibold text-slate-900 hover:text-[#3498db] transition-colors flex items-center justify-between">
                                                <span>{alternatePhone}</span>
                                                <span className="text-[11px] font-medium text-slate-400">Alternate</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* WhatsApp Direct Action Button */}
                            {whatsappDigits && (
                                <div className="pt-2">
                                    <a
                                        href={`https://wa.me/${whatsappDigits}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-inter font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-md shadow-[#25D366]/20 hover:shadow-lg cursor-pointer"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M20.52 3.48A11.85 11.85 0 0 0 12.05 0C5.46 0 .1 5.36.1 11.95c0 2.1.55 4.15 1.6 5.96L0 24l6.26-1.64a11.9 11.9 0 0 0 5.79 1.48h.01c6.59 0 11.95-5.36 11.95-11.95 0-3.19-1.24-6.19-3.49-8.41zm-8.47 18.36h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.72.97.99-3.62-.23-.37a9.89 9.89 0 0 1-1.52-5.28c0-5.46 4.45-9.91 9.92-9.91 2.65 0 5.14 1.03 7.01 2.9a9.85 9.85 0 0 1 2.9 7.01c0 5.46-4.45 9.89-9.94 9.89zm5.44-7.44c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.49-.9-.8-1.5-1.78-1.67-2.08-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.03-1.05 2.51s1.08 2.91 1.23 3.11c.15.2 2.12 3.24 5.14 4.54.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z"/>
                                        </svg>
                                        <span>{whatsappText || 'Chat on WhatsApp'}</span>
                                    </a>
                                </div>
                            )}

                            {/* Official Portal */}
                            {portalUrl && (
                                <div className="flex items-start gap-4 pt-4 border-t border-slate-100">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="2" y="3" width="20" height="14" rx="2" />
                                            <line x1="8" y1="21" x2="16" y2="21" />
                                            <line x1="12" y1="17" x2="12" y2="21" />
                                        </svg>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-inter text-xs font-semibold text-slate-500 uppercase tracking-wider">{portalTitle || 'Live Classes Portal'}</h4>
                                        <p className="font-inter text-xs text-slate-500 leading-relaxed">{portalDesc}</p>
                                        <a
                                            href={portalUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-inter text-sm font-semibold text-[#3498db] hover:text-[#2980b9] hover:underline transition-colors flex items-center gap-1.5 pt-0.5"
                                        >
                                            <span>{portalUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                <polyline points="15 3 21 3 21 9" />
                                                <line x1="10" y1="14" x2="21" y2="3" />
                                            </svg>
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Office Address */}
                            {officeAddress && (
                                <div className="flex items-start gap-4 pt-4 border-t border-slate-100">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                            <circle cx="12" cy="10" r="3" />
                                        </svg>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-inter text-xs font-semibold text-slate-500 uppercase tracking-wider">Training Center</h4>
                                        <p className="font-inter text-xs text-slate-700 leading-relaxed pt-0.5">{officeAddress}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Working Hours Badge Card */}
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-full bg-blue-100/70 text-[#3498db] flex items-center justify-center shrink-0">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                            </div>
                            <div className="text-xs text-slate-600 leading-relaxed">
                                <span className="font-semibold text-slate-900 block">Admissions & Support Hours:</span>
                                <span>Mon – Sat: 9:00 AM – 8:00 PM (IST)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SUCCESS OVERLAY */}
            {showSuccessOverlay && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4 animate-in fade-in duration-200">
                    <div className="bg-white border border-slate-200 p-8 md:p-10 max-w-md w-full relative overflow-hidden shadow-2xl rounded-3xl animate-in zoom-in-95 duration-200">
                        <div className="relative z-10 flex flex-col items-center text-center space-y-5">
                            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-200 shadow-sm">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-emerald-600 stroke-emerald-600">
                                    <path d="M20 6L9 17l-5-5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>

                            <div className="space-y-2">
                                <span className="font-inter text-xs text-emerald-700 font-bold uppercase tracking-wider">Message Sent</span>
                                <h3 className="font-inter text-2xl font-bold text-slate-900">Thank you for reaching out!</h3>
                                <p className="font-inter text-sm text-slate-600 leading-relaxed">
                                    We have received your message. Our mentorship and admissions team will contact you within 24 hours.
                                </p>
                            </div>

                            <button
                                onClick={() => setShowSuccessOverlay(false)}
                                className="mt-2 w-full bg-[#3498db] hover:bg-[#2980b9] text-white py-3.5 rounded-xl font-inter text-sm font-bold transition-all shadow-md cursor-pointer"
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

export default Contact;
