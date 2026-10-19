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
        <div ref={containerRef} className="min-h-screen bg-slate-50 text-slate-900 selection:bg-amber-400/30 relative overflow-x-hidden pt-28 md:pt-36 pb-24 px-4 md:px-12 lg:px-20">
            {/* Ambient Background Glows */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.05] z-0">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-amber-400 blur-[150px] rounded-full animate-float-slow" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-amber-300 blur-[120px] rounded-full" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Contact Header */}
                <div className="mb-20 contact-reveal">
                    <span className="font-jetbrains text-[10px] font-bold text-amber-800 tracking-[0.5em] uppercase mb-4 block">
                        {badgeText}
                    </span>
                    <h1 className="font-inter text-[clamp(3rem,8vw,7rem)] leading-[0.9] font-extralight uppercase select-none tracking-tighter text-slate-900">
                        {pageTitle}
                    </h1>
                    <p className="font-jetbrains text-slate-600 text-sm max-w-xl mt-6 leading-relaxed">
                        {pageDesc}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
                    {/* Left Column: Form */}
                    <div className="lg:col-span-7 space-y-10 contact-reveal">
                        <div className="space-y-2">
                            <h2 className="font-inter text-3xl text-slate-900 font-bold tracking-tight uppercase">
                                {t('sendMessage')}
                            </h2>
                            <div className="h-[2px] w-12 bg-amber-400 mt-4" />
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="font-jetbrains text-[9px] text-slate-600 uppercase tracking-[0.3em] font-bold">{t('yourNameLabel')} *</label>
                                    <input
                                        type="text"
                                        name="userName"
                                        value={formData.userName}
                                        onChange={handleInputChange}
                                        placeholder={t('enterYourName')}
                                        required
                                        className="w-full bg-white border border-slate-200 rounded-xl p-4 font-jetbrains text-xs text-slate-900 focus:border-amber-500 outline-none transition-all shadow-sm placeholder:text-slate-400"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="font-jetbrains text-[9px] text-slate-600 uppercase tracking-[0.3em] font-bold">{t('emailAddressLabel')} *</label>
                                    <input
                                        type="email"
                                        name="userEmail"
                                        value={formData.userEmail}
                                        onChange={handleInputChange}
                                        placeholder={t('enterYourEmail')}
                                        required
                                        className="w-full bg-white border border-slate-200 rounded-xl p-4 font-jetbrains text-xs text-slate-900 focus:border-amber-500 outline-none transition-all shadow-sm placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="md:col-span-1 space-y-2">
                                    <label className="font-jetbrains text-[9px] text-slate-600 uppercase tracking-[0.3em] font-bold">{t('phoneCodeLabel')} *</label>
                                    <input
                                        type="text"
                                        name="code"
                                        value={formData.code}
                                        onChange={handleInputChange}
                                        placeholder="+91"
                                        required
                                        className="w-full bg-white border border-slate-200 rounded-xl p-4 font-jetbrains text-xs text-slate-900 focus:border-amber-500 outline-none transition-all shadow-sm"
                                    />
                                </div>
                                <div className="md:col-span-3 space-y-2">
                                    <label className="font-jetbrains text-[9px] text-slate-600 uppercase tracking-[0.3em] font-bold">{t('phoneNumberLabel')} *</label>
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleInputChange}
                                        placeholder={t('enterYourPhone')}
                                        required
                                        className="w-full bg-white border border-slate-200 rounded-xl p-4 font-jetbrains text-xs text-slate-900 focus:border-amber-500 outline-none transition-all shadow-sm placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="font-jetbrains text-[9px] text-slate-600 uppercase tracking-[0.3em] font-bold block">{t('subjectLabel')} *</label>
                                <select
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleInputChange}
                                    className="w-full bg-white border border-slate-200 rounded-xl p-4 font-jetbrains text-xs text-slate-900 focus:border-amber-500 outline-none transition-all shadow-sm cursor-pointer"
                                >
                                    {subjectOptions.map(opt => (
                                        <option key={opt} value={opt} className="bg-white text-slate-900">{opt}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="font-jetbrains text-[9px] text-slate-600 uppercase tracking-[0.3em] font-bold">{t('messageLabel')}</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder={t('tellUsHowHelp')}
                                    rows="5"
                                    className="w-full bg-white border border-slate-200 rounded-xl p-4 outline-none focus:border-amber-500 transition-all font-jetbrains text-xs text-slate-900 resize-vertical shadow-sm placeholder:text-slate-400"
                                />
                            </div>

                            {(clientError || error) && (
                                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 font-jetbrains text-xs">
                                    {clientError || error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 py-5 rounded-xl flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 shadow-sm font-black font-jetbrains text-xs uppercase tracking-[0.4em] cursor-pointer"
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                                        <span>SENDING INQUIRY...</span>
                                    </>
                                ) : (
                                    <span>{t('sendMessageBtn')}</span>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Right Column: Office Coordinates / Support Info */}
                    <div className="lg:col-span-5 space-y-8 contact-reveal lg:sticky lg:top-28">
                        <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-10 relative overflow-hidden flex flex-col justify-between min-h-[460px] shadow-xl">
                            {/* Scanning Effect */}
                            <div ref={scanLineRef} className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-400 to-transparent z-10 opacity-40 shadow-sm" />

                            <div className="space-y-8">
                                {/* Header bracket */}
                                <div className="flex justify-between items-center opacity-40">
                                    <span className="font-jetbrains text-[8px] tracking-[0.4em] uppercase text-slate-500">Contact Channels</span>
                                    <div className="h-[1px] w-16 bg-slate-300" />
                                    <span className="font-jetbrains text-[8px] tracking-[0.1em] uppercase text-slate-500">Data Knowledge</span>
                                </div>

                                <div className="space-y-6">
                                    {/* Email Section */}
                                    <div className="space-y-2">
                                        <h3 className="font-inter text-xl text-amber-800 font-bold">{t('emailSupport')}</h3>
                                        <p className="font-jetbrains text-xs text-slate-600 leading-relaxed">
                                            {emailSupportDesc}
                                        </p>
                                        <div className="pt-2">
                                            <a
                                                href={`mailto:${primaryEmail}`}
                                                className="font-jetbrains text-base sm:text-lg font-bold text-slate-900 hover:text-amber-600 transition-colors break-all"
                                            >
                                                {primaryEmail}
                                            </a>
                                        </div>
                                    </div>

                                    {/* Phone & WhatsApp Section */}
                                    <div className="space-y-3 pt-4 border-t border-slate-100">
                                        <h3 className="font-inter text-xl text-amber-800 font-bold">Call & WhatsApp</h3>
                                        <div className="space-y-2 font-jetbrains text-sm">
                                            {primaryPhone && (
                                                <div>
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Primary Call & WhatsApp:</p>
                                                    <a href={`tel:${primaryPhone.replace(/\s+/g, '')}`} className="text-slate-900 font-bold hover:text-amber-600 transition-colors">
                                                        {primaryPhone}
                                                    </a>
                                                </div>
                                            )}
                                            {alternatePhone && (
                                                <div>
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Alternate Phone:</p>
                                                    <a href={`tel:${alternatePhone.replace(/\s+/g, '')}`} className="text-slate-900 font-bold hover:text-amber-600 transition-colors">
                                                        {alternatePhone}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Official Website Portal */}
                                    {portalUrl && (
                                        <div className="space-y-2 pt-4 border-t border-slate-100">
                                            <h3 className="font-inter text-xl text-amber-800 font-bold">{portalTitle}</h3>
                                            <p className="font-jetbrains text-xs text-slate-600 leading-relaxed">
                                                {portalDesc}
                                            </p>
                                            <div className="pt-1">
                                                <a
                                                    href={portalUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-jetbrains text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors flex items-center gap-1.5"
                                                >
                                                    <span>{portalUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                        <polyline points="15 3 21 3 21 9" />
                                                        <line x1="10" y1="14" x2="21" y2="3" />
                                                    </svg>
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {/* Address Section if available */}
                                    {officeAddress && (
                                        <div className="space-y-2 pt-4 border-t border-slate-100">
                                            <h3 className="font-inter text-xl text-amber-800 font-bold">Training Center</h3>
                                            <p className="font-jetbrains text-xs text-slate-700 leading-relaxed">
                                                {officeAddress}
                                            </p>
                                        </div>
                                    )}

                                    {/* WhatsApp Direct Action */}
                                    {whatsappDigits && (
                                        <div className="pt-2">
                                            <a
                                                href={`https://wa.me/${whatsappDigits}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-jetbrains font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M20.52 3.48A11.85 11.85 0 0 0 12.05 0C5.46 0 .1 5.36.1 11.95c0 2.1.55 4.15 1.6 5.96L0 24l6.26-1.64a11.9 11.9 0 0 0 5.79 1.48h.01c6.59 0 11.95-5.36 11.95-11.95 0-3.19-1.24-6.19-3.49-8.41zm-8.47 18.36h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.72.97.99-3.62-.23-.37a9.89 9.89 0 0 1-1.52-5.28c0-5.46 4.45-9.91 9.92-9.91 2.65 0 5.14 1.03 7.01 2.9a9.85 9.85 0 0 1 2.9 7.01c0 5.46-4.45 9.89-9.94 9.89zm5.44-7.44c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.49-.9-.8-1.5-1.78-1.67-2.08-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.03-1.05 2.51s1.08 2.91 1.23 3.11c.15.2 2.12 3.24 5.14 4.54.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z"/>
                                                </svg>
                                                <span>{whatsappText}</span>
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Corner Brackets */}
                            <div className="absolute top-4 left-4 w-4 h-4 border-l border-t border-slate-200" />
                            <div className="absolute top-4 right-4 w-4 h-4 border-r border-t border-slate-200" />
                            <div className="absolute bottom-4 left-4 w-4 h-4 border-l border-b border-slate-200" />
                            <div className="absolute bottom-4 right-4 w-4 h-4 border-r border-b border-slate-200" />
                        </div>
                    </div>
                </div>
            </div>

            {/* SUCCESS OVERLAY */}
            {showSuccessOverlay && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4">
                    <div className="bg-white border border-slate-200 p-8 md:p-12 max-w-lg w-full relative overflow-hidden shadow-2xl rounded-3xl">
                        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center border border-green-200">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-green-600 stroke-green-600">
                                    <path d="M20 6L9 17l-5-5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>

                            <div className="space-y-2">
                                <span className="font-jetbrains text-[9px] text-green-700 uppercase tracking-[0.4em] font-black">Message Sent</span>
                                <h3 className="font-inter text-3xl text-slate-900 font-bold tracking-tight">Thank You.</h3>
                                <p className="font-jetbrains text-[10px] text-slate-600 uppercase tracking-widest mt-2">
                                    We have received your message. Our team aims to respond within 24–48 hours.
                                </p>
                            </div>

                            <button
                                onClick={() => setShowSuccessOverlay(false)}
                                className="mt-4 w-full bg-amber-400 text-slate-950 py-4 rounded-xl font-jetbrains text-xs font-black uppercase tracking-[0.3em] hover:scale-[1.02] transition-transform duration-300 shadow-sm cursor-pointer"
                            >
                                CLOSE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Contact;
