import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  fetchAvailableSlots,
  fetchAllUpcomingSlots,
  createConsultationOrder,
  bookConsultation,
  setSelectedDate,
  setSelectedSlot,
  resetBookingState,
  clearError
} from '../../redux/slices/consultationSlice';

// Helper to format date as YYYY-MM-DD in local timezone
const getLocalDateString = (d = new Date()) => {
  const dateObj = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return new Date().toISOString().split('T')[0];
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Official Data Knowledge WhatsApp Contact Number
const WHATSAPP_PHONE = '917483741501';

// Helper to dynamically ensure Razorpay checkout SDK is loaded
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      return resolve(true);
    }
    const existing = document.getElementById('razorpay-sdk-script');
    if (existing) {
      existing.addEventListener('load', () => resolve(true), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      // If already loaded before listeners attached
      if (window.Razorpay) return resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-sdk-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const ConsultationModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    slots,
    allUpcomingSlots,
    selectedDate,
    selectedSlot,
    loading,
    bookingLoading,
    error,
    lastBooking
  } = useSelector((state) => state.consultation);

  const authUser = useSelector((state) => state.auth?.user);
  const authToken = useSelector((state) => state.auth?.token) || localStorage.getItem('edrilla_token');

  // Steps: 1 = Date & Slot, 2 = Learner Info, 3 = Confirmed
  const [step, setStep] = useState(1);

  // Calendar navigation state
  const [viewDate, setViewDate] = useState(new Date());

  // Form Details state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    currentRole: 'Fresher / College Graduate',
    topic: 'Master Data & Business Analytics (SQL, Excel, Power BI)',
    institute: '',
    query: '',
    fileUpload: null,
  });
  const [fileName, setFileName] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  // WhatsApp redirect state & countdown
  const [redirectCountdown, setRedirectCountdown] = useState(null);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const redirectTimerRef = useRef(null);

  const handleClose = useCallback(() => {
    if (typeof onClose === 'function') {
      onClose();
    }
  }, [onClose]);

  // Lock background scroll and listen for Escape key when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  // Autofill user details if logged in
  useEffect(() => {
    if (authUser) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || authUser.fullName || authUser.name || '',
        email: prev.email || authUser.email || '',
        phone: prev.phone || authUser.phone || '',
        institute: prev.institute || authUser.institute || authUser.organization || '',
      }));
    }
  }, [authUser]);

  // Sync slots on modal open
  useEffect(() => {
    if (isOpen) {
      loadRazorpayScript();
      dispatch(clearError());
      dispatch(fetchAllUpcomingSlots());
      const initialDate = selectedDate || getLocalDateString();
      if (!selectedDate) {
        dispatch(setSelectedDate(initialDate));
      }
      dispatch(fetchAvailableSlots({ date: initialDate }));
    } else {
      // Reset state when closed
      setStep(1);
      dispatch(resetBookingState());
      setFormErrors({});
      setSubmitError(null);
      setFileName('');
      setRedirectCountdown(null);
      if (redirectTimerRef.current) clearInterval(redirectTimerRef.current);
    }
  }, [isOpen, dispatch]);

  // Fetch slots whenever selectedDate changes
  useEffect(() => {
    if (isOpen && selectedDate) {
      dispatch(clearError());
      dispatch(fetchAvailableSlots({ date: selectedDate }));
    }
  }, [isOpen, selectedDate, dispatch]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearInterval(redirectTimerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  // Calendar Calculations
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = getLocalDateString(new Date());

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  // Set of dates with available open slots
  const availableDatesSet = new Set(
    (allUpcomingSlots || [])
      .filter((s) => !s.isBooked && s.isActive && new Date(s.startTime) >= new Date(new Date().setHours(0, 0, 0, 0)))
      .map((s) => getLocalDateString(s.startTime))
      .filter(Boolean)
  );

  // Filter slots to only show those that match the selected date in the user's local timezone
  const displayedSlots = (slots || []).filter((s) => getLocalDateString(s.startTime) === selectedDate);


  const handleSelectDay = (day) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

    if (dateStr < todayStr) return; // Prevent selecting past dates

    dispatch(setSelectedDate(dateStr));
    dispatch(setSelectedSlot(null));
  };

  const formatSlotTime = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '';
    }
  };

  const formatSelectedDateHeading = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setFormErrors((prev) => ({ ...prev, fileUpload: 'File size must be under 10MB' }));
        return;
      }
      setFormData((prev) => ({ ...prev, fileUpload: file }));
      setFileName(file.name);
      setFormErrors((prev) => ({ ...prev, fileUpload: null }));
    }
  };

  const handleRemoveFile = () => {
    setFormData((prev) => ({ ...prev, fileUpload: null }));
    setFileName('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (submitError) setSubmitError(null);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = 'Full Name is required';
    if (!formData.email?.trim() || !/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      errors.email = 'Valid email address is required';
    }
    if (!formData.phone?.trim() || formData.phone.trim().length < 8) {
      errors.phone = 'Valid Phone / WhatsApp number is required';
    }
    if (!formData.query?.trim()) {
      errors.query = 'Please share your queries or career goals';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Generate WhatsApp Message URL and trigger auto-redirect
  const triggerWhatsAppRedirect = (confirmedBooking = null) => {
    const formattedDate = selectedSlot
      ? new Date(selectedSlot.startTime).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      : selectedDate;

    const formattedTime = selectedSlot
      ? `${formatSlotTime(selectedSlot.startTime)} - ${formatSlotTime(selectedSlot.endTime)}`
      : 'Scheduled Time';

    const duration = selectedSlot?.duration || 15;

    const rawMessage = 
`👋 *Hello Team!*
I have booked a session:
👤 *Name:* ${formData.fullName.trim()}
📱 *Phone:* ${formData.phone.trim()}
📧 *Email:* ${formData.email.trim()}
📅 *Date:* ${formattedDate}
⏰ *Time:* ${formattedTime} (${duration} Mins)
🎯 *Topic:* ${formData.topic}
💬 *Query:* ${formData.query.trim()}`;

    const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(rawMessage)}`;
    setWhatsappUrl(url);

    // Start 3-second countdown before auto-opening WhatsApp
    let count = 3;
    setRedirectCountdown(count);

    if (redirectTimerRef.current) clearInterval(redirectTimerRef.current);

    redirectTimerRef.current = setInterval(() => {
      count -= 1;
      setRedirectCountdown(count);
      if (count <= 0) {
        clearInterval(redirectTimerRef.current);
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }, 1000);
  };

  const handleProceedToDetails = () => {
    if (!selectedSlot) return;
    setStep(2);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) {
      setSubmitError('Please select a time slot before confirming.');
      setStep(1);
      return;
    }
    if (!validateForm()) return;
    setSubmitError(null);

    const submission = new FormData();
    submission.append('slotId', selectedSlot._id);
    submission.append('fullName', formData.fullName.trim());
    submission.append('email', formData.email.trim());
    submission.append('phone', formData.phone.trim());
    submission.append('designation', formData.currentRole.trim());
    submission.append('department', formData.topic.trim());
    submission.append('institute', (formData.institute || formData.currentRole).trim());
    submission.append('query', formData.query.trim());

    if (formData.fileUpload) {
      submission.append('fileUpload', formData.fileUpload);
    }

    // Stay on Learner Info (step 2) and surface the real error message on failure
    const handleBookingFailure = (err) => {
      console.error('Booking error:', err);
      const message =
        (typeof err === 'string' && err) ||
        err?.message ||
        'Something went wrong while booking your session. Please check your details and try again.';
      setSubmitError(message);
      // Only refresh slots if the failure is about slot availability,
      // so a network/validation error never wipes the user's selected slot.
      if (/slot|booked|passed|book/i.test(message)) {
        dispatch(fetchAllUpcomingSlots());
        if (selectedDate) dispatch(fetchAvailableSlots({ date: selectedDate }));
      }
    };

    // Check if slot is paid
    if (selectedSlot.price > 0 && selectedSlot.duration === 30) {
      try {
        const orderResult = await dispatch(createConsultationOrder({ slotId: selectedSlot._id })).unwrap();
        if (orderResult.isFree) {
          const result = await dispatch(bookConsultation(submission)).unwrap();
          if (result.success) {
            dispatch(fetchAllUpcomingSlots());
            if (selectedDate) dispatch(fetchAvailableSlots({ date: selectedDate }));
            setStep(3);
            triggerWhatsAppRedirect(result.data);
          }
        } else {
          // Razorpay Checkout flow
          const options = {
            key: orderResult.key,
            amount: orderResult.amount,
            currency: orderResult.currency || 'INR',
            name: 'Data Knowledge',
            description: `1-on-1 Mentorship Session (${selectedSlot.duration} Mins)`,
            order_id: orderResult.orderId,
            handler: async (response) => {
              try {
                submission.append('razorpay_order_id', response.razorpay_order_id);
                submission.append('razorpay_payment_id', response.razorpay_payment_id);
                submission.append('razorpay_signature', response.razorpay_signature);
                const result = await dispatch(bookConsultation(submission)).unwrap();
                if (result.success) {
                  dispatch(fetchAllUpcomingSlots());
                  if (selectedDate) dispatch(fetchAvailableSlots({ date: selectedDate }));
                  setStep(3);
                  triggerWhatsAppRedirect(result.data);
                }
              } catch (err) {
                handleBookingFailure(err);
              }
            },
            prefill: {
              name: formData.fullName,
              email: formData.email,
              contact: formData.phone,
            },
            theme: { color: '#3498db' },
          };

          let isLoaded = typeof window !== 'undefined' && Boolean(window.Razorpay);
          if (!isLoaded) {
            isLoaded = await loadRazorpayScript();
          }

          if (isLoaded && window.Razorpay) {
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (response) => {
              handleBookingFailure(response?.error?.description || 'Payment failed. Please try again.');
            });
            rzp.open();
          } else {
            setSubmitError('Unable to load payment gateway. Please check your internet connection and try again.');
          }
        }
      } catch (err) {
        handleBookingFailure(err);
      }
    } else {
      // Free consultation booking
      try {
        const result = await dispatch(bookConsultation(submission)).unwrap();
        if (result.success) {
          dispatch(fetchAllUpcomingSlots());
          if (selectedDate) dispatch(fetchAvailableSlots({ date: selectedDate }));
          setStep(3);
          triggerWhatsAppRedirect(result.data);
        }
      } catch (err) {
        handleBookingFailure(err);
      }
    }
  };

  // Open WhatsApp manually
  const handleOpenWhatsAppManually = () => {
    if (whatsappUrl) {
      if (redirectTimerRef.current) clearInterval(redirectTimerRef.current);
      setRedirectCountdown(0);
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/75 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
      data-lenis-prevent
      onWheel={(e) => e.stopPropagation()}
    >
      <div 
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh] my-auto animate-in zoom-in-95 duration-200 select-text"
        onClick={(e) => e.stopPropagation()}
        data-lenis-prevent
        onWheel={(e) => e.stopPropagation()}
      >
        {/* ── Top Header Banner ── */}
        <div className="relative bg-gradient-to-r from-[#08192b] via-[#0d2a4a] to-[#08192b] text-white px-6 sm:px-8 pt-6 pb-5 shrink-0 overflow-hidden">
          {/* Subtle Ambient Background Light */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#3498db]/20 rounded-full blur-3xl pointer-events-none" />
          
          {/* Close X Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClose();
            }}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer z-50 pointer-events-auto"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="relative z-10 space-y-2 pr-10">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-inter text-[11px] font-bold tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>
                {selectedSlot?.price > 0 ? `${selectedSlot.duration}-MIN MENTORSHIP SESSION` : 'FREE 1-ON-1 TRIAL CLASS'}
              </span>
            </div>

            {/* Modal Heading */}
            <h2 className="font-inter font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              {selectedSlot?.price > 0 ? 'Book a Mentorship Session' : 'Book a Free Session'}
            </h2>

            {/* Modal Subtitle */}
            <p className="font-inter text-xs sm:text-[13px] text-slate-300 max-w-xl leading-relaxed">
              Pick a date and live session slot with Data Knowledge mentors. Slots once booked cannot be taken by another user.
            </p>
          </div>
        </div>

        {/* ── Stepper Navigation Tabs ── */}
        <div className="bg-white border-b border-slate-200/90 px-6 sm:px-8 flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`py-3.5 px-4 font-inter text-xs sm:text-[13px] font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              step === 1
                ? 'border-[#3498db] text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold ${
              step === 1 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              1
            </span>
            <span>Date & Slot</span>
          </button>

          <button
            type="button"
            disabled={!selectedSlot && step === 1}
            onClick={() => selectedSlot && setStep(2)}
            className={`py-3.5 px-4 font-inter text-xs sm:text-[13px] font-bold flex items-center gap-2 border-b-2 transition-all ${
              step === 2
                ? 'border-[#3498db] text-slate-900 cursor-pointer'
                : selectedSlot
                ? 'border-transparent text-slate-400 hover:text-slate-600 cursor-pointer'
                : 'border-transparent text-slate-300 cursor-not-allowed'
            }`}
          >
            <span className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold ${
              step === 2 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              2
            </span>
            <span>Learner Info</span>
          </button>

          <div
            className={`py-3.5 px-4 font-inter text-xs sm:text-[13px] font-bold flex items-center gap-2 border-b-2 transition-all ${
              step === 3
                ? 'border-[#3498db] text-slate-900'
                : 'border-transparent text-slate-300'
            }`}
          >
            <span className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold ${
              step === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
            }`}>
              3
            </span>
            <span>Confirmed</span>
          </div>
        </div>

        {/* ── Scrollable Modal Body ── */}
        <div 
          className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-7 space-y-6 touch-pan-y"
          data-lenis-prevent
          onWheel={(e) => e.stopPropagation()}
        >
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{typeof error === 'string' ? error : 'An error occurred'}</span>
              </div>
              <button 
                type="button" 
                onClick={() => dispatch(clearError())} 
                className="text-red-500 hover:text-red-800 font-bold ml-2 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* ──────────────── STEP 1: Date & Slot Selection ──────────────── */}
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Left Column: Interactive Monthly Calendar */}
              <div className="md:col-span-6 bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:p-5">
                {/* Month & Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <span className="font-inter font-extrabold text-slate-900 text-base">
                    {monthNames[month]} {year}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                      aria-label="Previous Month"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                      aria-label="Next Month"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Day Labels Row */}
                <div className="grid grid-cols-7 gap-1 text-center font-inter font-bold text-[11px] text-slate-400 mb-2">
                  <span>SU</span>
                  <span>MO</span>
                  <span>TU</span>
                  <span>WE</span>
                  <span>TH</span>
                  <span>FR</span>
                  <span>SA</span>
                </div>

                {/* Calendar Days Grid */}
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-9 sm:h-10" />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const formattedMonth = String(month + 1).padStart(2, '0');
                    const formattedDay = String(day).padStart(2, '0');
                    const dayDateStr = `${year}-${formattedMonth}-${formattedDay}`;
                    const isPast = dayDateStr < todayStr;
                    const isSelected = dayDateStr === selectedDate;
                    const hasAvailable = availableDatesSet.has(dayDateStr);

                    return (
                      <button
                        key={`day-${day}`}
                        type="button"
                        disabled={isPast}
                        onClick={() => handleSelectDay(day)}
                        className={`h-9 sm:h-10 w-full rounded-xl font-inter text-xs flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#08192b] text-white font-bold shadow-md ring-2 ring-[#08192b]/30'
                            : isPast
                            ? 'text-slate-300 opacity-40 cursor-not-allowed'
                            : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-blue-50/70 hover:border-[#3498db]/50 font-medium'
                        }`}
                      >
                        <span>{day}</span>
                        {!isPast && (
                          <span className="flex items-center justify-center mt-0.5">
                            {isSelected ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            ) : hasAvailable ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            ) : (
                              <span className="w-1 h-1 rounded-full bg-slate-300" />
                            )}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 mt-4 pt-3.5 border-t border-slate-200/80 font-inter text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Open Slots</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                    <span>No Slots</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Available Time Slots */}
              <div className="md:col-span-6 bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between min-h-[360px]">
                <div>
                  {/* Slots Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-inter font-bold text-slate-900 text-sm">
                        Available Time Slots
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedDate) dispatch(fetchAvailableSlots({ date: selectedDate }));
                          dispatch(fetchAllUpcomingSlots());
                        }}
                        className="text-slate-400 hover:text-[#3498db] transition-colors cursor-pointer"
                        title="Refresh slots"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M23 4v6h-6M1 20v-6h6" />
                          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                        </svg>
                      </button>
                    </div>

                    <span className="font-inter text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                      {displayedSlots.filter((s) => !s.isBooked && new Date(s.startTime) >= new Date()).length} open
                    </span>
                  </div>

                  {/* Selected Date Subtitle */}
                  <p className="font-inter font-bold text-xs text-amber-600 mb-3">
                    {formatSelectedDateHeading(selectedDate)}
                  </p>

                  {/* Slot Items List */}
                  {loading ? (
                    <div className="py-14 text-center text-slate-400 font-inter text-xs flex flex-col items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-[#3498db] border-t-transparent rounded-full animate-spin" />
                      <span>Checking slot availability...</span>
                    </div>
                  ) : displayedSlots.length === 0 ? (
                    <div className="py-12 px-4 text-center space-y-2">
                      <p className="font-inter font-bold text-slate-800 text-sm">
                        No open slots on this date.
                      </p>
                      <p className="font-inter text-xs text-slate-500 max-w-xs mx-auto">
                        Please select another date marked with a green dot on the calendar.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {displayedSlots.map((slot) => {
                        const isBooked = slot.isBooked;
                        const isPast = new Date(slot.startTime) < new Date();
                        const isDisabled = isBooked || isPast;
                        const isSelected = selectedSlot?._id === slot._id;
                        const isFree = slot.price === 0 || slot.duration === 15;

                        return (
                          <button
                            key={slot._id}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => dispatch(setSelectedSlot(slot))}
                            className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50/90 border-[#3498db] ring-2 ring-[#3498db]/30 shadow-sm'
                                : isDisabled
                                ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                                : 'bg-white border-slate-200 hover:border-[#3498db]/60 hover:bg-blue-50/30'
                            }`}
                          >
                            <div className="flex flex-col">
                              <span className="font-inter font-bold text-xs text-slate-900">
                                {formatSlotTime(slot.startTime)} - {formatSlotTime(slot.endTime)}
                              </span>
                              <span className="font-inter text-[11px] text-slate-500 font-medium">
                                {slot.duration} Mins
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`font-inter text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                isFree
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}>
                                {isFree ? 'FREE' : `₹${slot.price}`}
                              </span>
                              {isBooked ? (
                                <span className="font-inter text-[11px] text-rose-500 font-semibold">
                                  Booked
                                </span>
                              ) : isPast ? (
                                <span className="font-inter text-[11px] text-slate-400">
                                  Expired
                                </span>
                              ) : isSelected ? (
                                <span className="w-5 h-5 rounded-full bg-[#3498db] text-white flex items-center justify-center text-xs font-bold">
                                  ✓
                                </span>
                              ) : (
                                <span className="w-4 h-4 rounded-full border border-slate-300" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Bottom CTA Button */}
                <div className="pt-4 border-t border-slate-200/80 mt-4">
                  <button
                    type="button"
                    disabled={!selectedSlot}
                    onClick={handleProceedToDetails}
                    className="w-full bg-[#08192b] hover:bg-[#0f2e4f] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-inter text-xs font-bold uppercase tracking-wider py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Next: Learner Info</span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── STEP 2: Learner Details Form ──────────────── */}
          {step === 2 && selectedSlot && (
            <div className="space-y-4">
              {/* Booking failure banner — stays on this step so the user can retry */}
              {submitError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rose-500 shrink-0 mt-0.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span className="text-rose-700 text-xs font-medium leading-relaxed">{submitError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubmitError(null)}
                    className="text-rose-500 hover:text-rose-800 font-bold text-sm cursor-pointer shrink-0"
                    aria-label="Dismiss error"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Selected Slot Summary Bar with Change Slot button */}
              <div className="p-4 rounded-2xl bg-blue-50/90 border border-blue-200/80 flex items-center justify-between">
                <div>
                  <span className="font-jetbrains text-[10px] text-[#1f6696] font-bold uppercase tracking-wider block">
                    Selected Appointment Slot
                  </span>
                  <span className="font-inter font-bold text-slate-900 text-sm">
                    {formatSelectedDateHeading(selectedDate)} • {formatSlotTime(selectedSlot.startTime)} - {formatSlotTime(selectedSlot.endTime)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-inter text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {selectedSlot.price === 0 || selectedSlot.duration === 15 ? 'FREE (15 Mins)' : `₹${selectedSlot.price}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="font-inter text-xs font-bold text-[#3498db] hover:underline px-2 py-1 cursor-pointer"
                  >
                    Change Slot
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="block font-inter text-xs font-bold text-slate-700">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="e.g. Rahul Sharma"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-inter text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3498db]/30 ${
                    formErrors.fullName ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                  }`}
                />
                {formErrors.fullName && (
                  <p className="font-inter text-[11px] text-rose-500 font-medium">{formErrors.fullName}</p>
                )}
              </div>

              {/* Email & Phone / WhatsApp Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-inter text-xs font-bold text-slate-700">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="e.g. rahul@example.com"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-inter text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3498db]/30 ${
                      formErrors.email ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                    }`}
                  />
                  {formErrors.email && (
                    <p className="font-inter text-[11px] text-rose-500 font-medium">{formErrors.email}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block font-inter text-xs font-bold text-slate-700">
                    Phone / WhatsApp Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g. +91 9876543210"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-inter text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3498db]/30 ${
                      formErrors.phone ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                    }`}
                  />
                  {formErrors.phone && (
                    <p className="font-inter text-[11px] text-rose-500 font-medium">{formErrors.phone}</p>
                  )}
                </div>
              </div>

              {/* Role / Designation Dropdown & Topic Dropdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-inter text-xs font-bold text-slate-700">
                    Role / Designation <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="currentRole"
                    value={formData.currentRole}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-inter text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3498db]/30 cursor-pointer"
                  >
                    <option value="Fresher / College Graduate">Fresher / College Graduate</option>
                    <option value="Working Professional (IT / Software)">Working Professional (IT / Software)</option>
                    <option value="Career Switcher (Non-IT / Non-Tech)">Career Switcher (Non-IT / Non-Tech)</option>
                    <option value="Data / Business Analyst">Data / Business Analyst</option>
                    <option value="Student / Self-Learner">Student / Self-Learner</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-inter text-xs font-bold text-slate-700">
                    Topic of Interest <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="topic"
                    value={formData.topic}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-inter text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3498db]/30 cursor-pointer"
                  >
                    <option value="Master Data & Business Analytics (SQL, Excel, Power BI)">Master Data & Business Analytics (SQL, Excel, Power BI)</option>
                    <option value="Master Data Science & Machine Learning">Master Data Science & Machine Learning</option>
                    <option value="Master Generative AI & Python">Master Generative AI & Python</option>
                    <option value="Career Transition & 1-on-1 Mentorship">Career Transition & 1-on-1 Mentorship</option>
                    <option value="Resume Review & Interview Preparation">Resume Review & Interview Prep</option>
                    <option value="General Consultation / Free Demo">General Consultation / Free Demo</option>
                  </select>
                </div>
              </div>

              {/* Query / Notes Textarea */}
              <div className="space-y-1">
                <label className="block font-inter text-xs font-bold text-slate-700">
                  What would you like to discuss with the mentor? <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="query"
                  rows={3}
                  value={formData.query}
                  onChange={handleInputChange}
                  placeholder="Share your background, career transition goals, or specific topics you would like guidance on..."
                  className={`w-full p-3 bg-slate-50 border rounded-xl font-inter text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3498db]/30 resize-none ${
                    formErrors.query ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                  }`}
                />
                {formErrors.query && (
                  <p className="font-inter text-[11px] text-rose-500 font-medium">{formErrors.query}</p>
                )}
              </div>

              {/* Optional Resume / Attachment */}
              <div className="space-y-1">
                <label className="block font-inter text-xs font-bold text-slate-700">
                  Attach Resume / Profile (Optional)
                </label>
                <div className="p-3 border border-dashed border-slate-300 rounded-xl bg-slate-50/70 hover:bg-slate-50 transition-colors">
                  {fileName ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3498db" strokeWidth="2" className="shrink-0">
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                        </svg>
                        <span className="font-inter text-xs text-slate-800 font-medium truncate">
                          {fileName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="text-xs font-bold text-rose-600 hover:text-rose-800 ml-2 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 cursor-pointer py-1">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                      </svg>
                      <span className="font-inter text-xs text-slate-600 font-medium">
                        Upload Resume PDF / Doc (Optional, Max 10MB)
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── STEP 3: Confirmation & WhatsApp Redirect ──────────────── */}
          {step === 3 && (
            <div className="py-4 text-center space-y-5">
              {/* Success Badge */}
              <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-600 mx-auto flex items-center justify-center shadow-inner animate-in zoom-in-75 duration-300">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <div className="space-y-1.5">
                <h3 className="font-inter font-extrabold text-2xl text-slate-900 tracking-tight">
                  Session Booked Successfully! 🎉
                </h3>
                <p className="font-inter text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Your 1-on-1 trial class with <strong className="text-slate-900">Data Knowledge Mentors</strong> is confirmed.
                </p>
              </div>

              {/* Auto-redirect to WhatsApp Banner */}
              {redirectCountdown !== null && redirectCountdown > 0 ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl max-w-md mx-auto flex items-center justify-between text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>Connecting you to WhatsApp in <strong>{redirectCountdown}s</strong>...</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenWhatsAppManually}
                    className="font-bold underline text-emerald-800 hover:text-emerald-950 cursor-pointer"
                  >
                    Open Now →
                  </button>
                </div>
              ) : null}

              {/* Booking Summary Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 text-left space-y-3 max-w-md mx-auto shadow-xs">
                <div className="flex justify-between text-xs pb-2 border-b border-slate-200/70">
                  <span className="text-slate-500 font-medium">Candidate Name:</span>
                  <span className="font-bold text-slate-900">{formData.fullName}</span>
                </div>
                <div className="flex justify-between text-xs pb-2 border-b border-slate-200/70">
                  <span className="text-slate-500 font-medium">Phone / WhatsApp:</span>
                  <span className="font-bold text-slate-900">{formData.phone}</span>
                </div>
                <div className="flex justify-between text-xs pb-2 border-b border-slate-200/70">
                  <span className="text-slate-500 font-medium">Email:</span>
                  <span className="font-medium text-slate-700">{formData.email}</span>
                </div>
                <div className="flex justify-between text-xs pb-2 border-b border-slate-200/70">
                  <span className="text-slate-500 font-medium">Topic:</span>
                  <span className="font-bold text-[#1f6696] text-right max-w-[200px] truncate">{formData.topic}</span>
                </div>
                <div className="flex justify-between text-xs pb-2 border-b border-slate-200/70">
                  <span className="text-slate-500 font-medium">Date & Time:</span>
                  <span className="font-bold text-slate-900">
                    {formatSelectedDateHeading(selectedDate)} • {selectedSlot && formatSlotTime(selectedSlot.startTime)}
                  </span>
                </div>
                <div className="flex justify-between text-xs pb-2 border-b border-slate-200/70">
                  <span className="text-slate-500 font-medium">Duration:</span>
                  <span className="font-bold text-emerald-700">{selectedSlot?.duration || 15} Mins (Free)</span>
                </div>
                {lastBooking?._id && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Booking ID:</span>
                    <span className="font-mono text-slate-600 text-[11px]">{lastBooking._id}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto pt-2">
                <button
                  type="button"
                  onClick={handleOpenWhatsAppManually}
                  className="w-full sm:w-auto flex-1 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-inter text-xs font-bold uppercase tracking-wider py-3 px-5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.874.814 2.796.814 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.768-5.766zm9.969 5.766c0 5.514-4.486 10-10 10-1.748 0-3.385-.45-4.814-1.238l-7.186 1.884 1.918-7.009c-.848-1.48-1.318-3.186-1.318-4.996 0-5.514 4.486-10 10-10 5.514 0 10 4.486 10 10z" />
                  </svg>
                  <span>Open in WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-inter text-xs font-bold uppercase tracking-wider py-3 px-6 rounded-xl transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Sticky Modal Footer ── */}
        {step === 2 && (
          <div className="px-6 sm:px-8 py-4 border-t border-slate-100 bg-slate-50/90 backdrop-blur-sm flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="font-inter text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 cursor-pointer"
            >
              ← Back
            </button>
            <button
              type="button"
              disabled={bookingLoading}
              onClick={handleConfirmBooking}
              className="bg-[#08192b] hover:bg-[#0f2e4f] disabled:opacity-60 text-white font-inter text-xs font-bold uppercase tracking-wider px-7 py-3 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              {bookingLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Confirming Session...</span>
                </>
              ) : (
                <span>Confirm & Book</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ConsultationModal;
