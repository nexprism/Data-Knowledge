import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchSettings, validateCoupon, clearCoupon, fetchAllCoupons } from '../redux/slices/configSlice'
import { buyNow } from '../redux/slices/enrollmentSlice'
import bannerImg from '../assets/images/banner.png'
import CheckoutBreakdown from '../components/CheckoutBreakdown'
import { useLanguage } from '../context/LanguageContext'
import { getApiBaseUrl } from '../utils/apiConfig'

const Checkout = () => {
   const navigate = useNavigate()
   const location = useLocation()
   const dispatch = useDispatch()
   const { t } = useLanguage()

   const searchParams = new URLSearchParams(location.search)
   const urlCourseId = searchParams.get('course_id')
   const urlPlanId = searchParams.get('plan_id')
   const urlAcc = searchParams.get('acc')
   const urlAmount = searchParams.get('amount')

   const selectedPlan = location.state?.plan || (urlPlanId ? { id: urlPlanId, title: 'Selected Plan', price: urlAmount ? Number(urlAmount) : 3499 } : { id: '1year', title: '1 Year Access', price: 3499 })
   const course = location.state?.course || (urlCourseId ? { id: urlCourseId, _id: urlCourseId, title: 'Course Purchase' } : {})
   const accParam = urlAcc || location.state?.acc || ''

   const { settings, coupons, couponData, couponError, couponLoading } = useSelector(state => state.config)
   const authUser = useSelector(state => state.auth?.user)

   const BASE_API = getApiBaseUrl().replace(/\/api\/v1\/?$/, '')

   const [formData, setFormData] = useState(() => {
      let savedUser = null
      try {
         const lsUser = localStorage.getItem('user') || localStorage.getItem('userInfo')
         if (lsUser) {
            savedUser = JSON.parse(lsUser)
         }
      } catch (e) {
         console.error('Error parsing user from localStorage', e)
      }

      return {
         fullName: savedUser?.name || savedUser?.fullName || '',
         email: savedUser?.email || '',
         phone: savedUser?.phone || savedUser?.mobile || '',
         company: (savedUser && (savedUser.company?.name || (typeof savedUser.company === 'string' ? savedUser.company : ''))) || '',
         gst: savedUser?.gst || '',
         coupon: ''
      }
   })

   // Prefill from Redux auth if available
   useEffect(() => {
      if (!authUser) return
      setFormData(prev => ({
         ...prev,
         fullName: prev.fullName || authUser.name || authUser.fullName || '',
         email: prev.email || authUser.email || '',
         phone: prev.phone || authUser.phone || authUser.mobile || '',
         company: prev.company || (authUser.company?.name ?? (typeof authUser.company === 'string' ? authUser.company : '')) || '',
         gst: prev.gst || (authUser.company && authUser.company.gstNumber) || prev.gst || ''
      }))
   }, [authUser])

   const [isVerified, setIsVerified] = useState(false)
   const [showOTPModal, setShowOTPModal] = useState(false)
   const [otp, setOtp] = useState('')
   const [sendingOtp, setSendingOtp] = useState(false)
   const [verifyingOtp, setVerifyingOtp] = useState(false)
   const [otpMessage, setOtpMessage] = useState('')
   const [showSuccessModal, setShowSuccessModal] = useState(false)
   const [paying, setPaying] = useState(false)

   const basePrice = Number(selectedPlan.price || 0)
   const gstRate = Number(settings?.gstRate ?? 0.18)
   const discount = couponData ? (couponData.discountType === 'percentage' ? (basePrice * couponData.discountPercent / 100) : Number(couponData.discountAmount || 0)) : 0
   const discountedBase = Math.max(0, basePrice - discount)
   const gstAmount = discountedBase * gstRate
   const total = discountedBase + gstAmount
   const formatCurrency = (v) => `₹${Number(v || 0).toFixed(2)}`

   useEffect(() => {
      window.scrollTo(0, 0)
      dispatch(fetchSettings())
      dispatch(fetchAllCoupons())
      dispatch(clearCoupon())
   }, [dispatch])

   // Load Razorpay script dynamically
   const loadRazorpayScript = () => new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve(true)
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => reject(new Error('Razorpay SDK failed to load'))
      document.body.appendChild(script)
   })

   const handlePayment = async () => {
      if (!formData.fullName.trim()) {
         alert('Please enter your full name')
         return
      }
      if (!formData.email.trim()) {
         alert('Please enter your email address')
         return
      }
      if (!formData.phone.trim()) {
         alert('Please enter your phone number')
         return
      }

      setPaying(true)
      try {
         await loadRazorpayScript()
      } catch (e) {
         console.error('Razorpay SDK load error', e)
         alert('Payment gateway failed to load. Please check your internet connection.')
         setPaying(false)
         return
      }

      try {
         const isHexObjectId = (str) => typeof str === 'string' && /^[0-9a-fA-F]{24}$/.test(str);
         const validPlanId = isHexObjectId(selectedPlan?._id) ? selectedPlan._id : (isHexObjectId(selectedPlan?.id) ? selectedPlan.id : undefined);

         const payload = {
            courseId: course._id || course.id || '',
            guestEmail: formData.email.trim(),
            guestName: formData.fullName.trim(),
            couponCode: formData.coupon || '',
            is_verify: Boolean(isVerified)
         }

         if (validPlanId) {
            payload.coursePlanId = validPlanId
         }

         if (accParam) payload.acc = accParam

         const chkRes = await fetch(`${BASE_API}/checkout/check-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
         })
         const chkData = await chkRes.json()

         if (!chkRes.ok) {
            alert(chkData?.message || chkData?.err?.email || 'Order validation failed')
            setPaying(false)
            return
         }

         if (!chkData?.success || !chkData?.is_valid) {
            alert(chkData?.data?.message || chkData?.message || 'Order cannot be placed')
            setPaying(false)
            return
         }

         const razor = chkData?.razorpay || {}
         const rKey = razor.key || settings?.RAZORPAY_KEY_ID || settings?.settings?.RAZORPAY_KEY_ID || 'rzp_live_ToVrNLJ5jinYRy'
         const order = razor.order || {}
         const rAmount = (order.amount != null) ? order.amount : Math.round(total * 100)

         const options = {
            key: rKey,
            amount: rAmount,
            currency: razor.currency || 'INR',
            name: selectedPlan.title || 'Data Knowledge',
            description: course.title || 'Course Enrollment',
            order_id: order.id,
            handler: async function (response) {
               try {
                  const buyPayload = {
                     courseId: course._id || course.id || '',
                     paymentId: response.razorpay_payment_id,
                     orderId: response.razorpay_order_id,
                     signature: response.razorpay_signature,
                     guestEmail: formData.email.trim(),
                     guestName: formData.fullName.trim(),
                     paymentProvider: 'razorpay',
                     couponCode: formData.coupon || '',
                     company: formData.company,
                     gst: formData.gst
                  }

                  if (validPlanId) {
                     buyPayload.coursePlanId = validPlanId
                  }

                  if (accParam) buyPayload.acc = accParam

                  await dispatch(buyNow(buyPayload)).unwrap()
                  setShowSuccessModal(true)
               } catch (error) {
                  console.error('Enrollment finalization failed', error)
                  alert(error || 'Payment succeeded but enrollment failed. Please contact support.')
               } finally {
                  setPaying(false)
               }
            },
            modal: {
               ondismiss: function () {
                  setPaying(false)
               }
            },
            prefill: {
               name: formData.fullName,
               email: formData.email,
               contact: formData.phone
            },
            notes: {
               courseId: course._id || '',
               planId: selectedPlan.id || ''
            },
            theme: { color: '#2563EB' }
         }

         const rzp = new window.Razorpay(options)
         rzp.open()
      } catch (err) {
         console.error('Order creation failed', err)
         alert(err?.message || 'Order creation failed')
         setPaying(false)
      }
   }

   const handleChange = (e) => {
      const { name, value } = e.target
      setFormData({ ...formData, [name]: value })

      if (name === 'coupon' && value) {
         dispatch(validateCoupon(value))
      } else if (name === 'coupon' && !value) {
         dispatch(clearCoupon())
      }
   }

   const handleApplyCoupon = (codeToApply) => {
      const code = codeToApply || formData.coupon
      if (code) {
         dispatch(validateCoupon(code))
      }
   }

   const handleRemoveCoupon = () => {
      setFormData(prev => ({ ...prev, coupon: '' }))
      dispatch(clearCoupon())
   }

   useEffect(() => {
      const localUser = (() => {
         try {
            return JSON.parse(localStorage.getItem('edrilla_user') || '{}')
         } catch { return {} }
      })()
      const verified = Boolean(
         authUser?.isVerified || authUser?.verified || authUser?.emailVerified ||
         localUser?.isVerified || localUser?.verified || localUser?.emailVerified
      )
      setIsVerified(verified)
   }, [authUser])

   const sendOtp = async () => {
      if (!formData.email) {
         setOtpMessage('Please enter an email address to verify')
         return
      }
      setSendingOtp(true)
      setOtpMessage('')
      try {
         const res = await fetch(`${BASE_API}/sendotp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: formData.email.trim() })
         })
         const data = await res.json()
         if (!res.ok) throw new Error(data?.message || 'Failed to send OTP')

         if (data?.is_verify) {
            setIsVerified(true)
            setOtpMessage('Email is already verified')
            setShowOTPModal(false)
         } else {
            setOtpMessage(data?.message || 'OTP sent! Please check your email inbox.')
            setShowOTPModal(true)
         }
      } catch (err) {
         setOtpMessage(err.message || 'Error sending OTP')
      } finally {
         setSendingOtp(false)
      }
   }

   const verifyOtp = async () => {
      if (!otp.trim()) {
         setOtpMessage('Please enter the OTP')
         return
      }
      setVerifyingOtp(true)
      setOtpMessage('')
      try {
         const res = await fetch(`${BASE_API}/verifyotp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: formData.email.trim(), otp: otp.trim() })
         })
         const data = await res.json()
         if (!res.ok) throw new Error(data?.message || 'OTP verification failed')

         setIsVerified(true)
         if (data?.data?.user) {
            try { localStorage.setItem('edrilla_user', JSON.stringify(data.data.user)) } catch { }
         }
         setOtpMessage('Email verified successfully')
         setShowOTPModal(false)
         setOtp('')
      } catch (err) {
         setOtpMessage(err.message || 'Invalid or expired OTP')
      } finally {
         setVerifyingOtp(false)
      }
   }

   const courseThumbnail = course.thumbnail
      ? (course.thumbnail.startsWith('http') ? course.thumbnail : `${BASE_API}/${course.thumbnail.replace(/^\/+/, '')}`)
      : (course.coverImage ? (course.coverImage.startsWith('http') ? course.coverImage : `${BASE_API}/${course.coverImage.replace(/^\/+/, '')}`) : bannerImg)

   return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-inter">
         {/* Top Header Bar */}
         <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
               <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
               >
                  <svg className="w-5 h-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <path d="m15 18-6-6 6-6" />
                  </svg>
                  <span>Back to Course</span>
               </button>

               <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                  <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                     <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>256-Bit SSL Secure Checkout</span>
               </div>
            </div>
         </header>

         {/* Main Container */}
         <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <div className="mb-8">
               <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Checkout</h1>
               <p className="text-sm text-slate-500 mt-1">Review your order and enter your details to complete your enrollment.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
               {/* Left Column: Form Details */}
               <div className="lg:col-span-7 space-y-6">

                  {/* Section 1: Student Information */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm">
                     <div className="flex items-center gap-3 pb-5 border-b border-slate-100 mb-6">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                           1
                        </div>
                        <div>
                           <h2 className="text-lg font-bold text-slate-900">Student Details</h2>
                           <p className="text-xs text-slate-500">Your enrollment and certificate will be issued under these credentials.</p>
                        </div>
                     </div>

                     <div className="space-y-5">
                        {/* Full Name */}
                        <div>
                           <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                              Full Name <span className="text-red-500">*</span>
                           </label>
                           <input
                              type="text"
                              name="fullName"
                              value={formData.fullName}
                              onChange={handleChange}
                              placeholder="e.g. Rahul Sharma"
                              required
                              className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                           />
                        </div>

                        {/* Email Address with Verify Button */}
                        <div>
                           <div className="flex items-center justify-between mb-2">
                              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                                 Email Address <span className="text-red-500">*</span>
                              </label>
                              {isVerified ? (
                                 <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                       <path d="M20 6 9 17l-5-5" />
                                    </svg>
                                    Verified
                                 </span>
                              ) : (
                                 <button
                                    type="button"
                                    onClick={sendOtp}
                                    disabled={sendingOtp || !formData.email}
                                    className={`text-xs font-semibold text-blue-600 hover:text-blue-700 underline ${
                                       sendingOtp || !formData.email ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                 >
                                    {sendingOtp ? 'Sending OTP...' : 'Verify Email'}
                                 </button>
                              )}
                           </div>
                           <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              disabled={isVerified}
                              placeholder="e.g. rahul@example.com"
                              required
                              className={`w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                                 isVerified ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : ''
                              }`}
                           />
                           {otpMessage && (
                              <p className="mt-1.5 text-xs text-slate-500">{otpMessage}</p>
                           )}
                        </div>

                        {/* Phone Number */}
                        <div>
                           <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                              Phone Number <span className="text-red-500">*</span>
                           </label>
                           <div className="flex">
                              <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-slate-600 font-semibold text-sm">
                                 +91
                              </span>
                              <input
                                 type="tel"
                                 name="phone"
                                 value={formData.phone}
                                 onChange={handleChange}
                                 placeholder="9876543210"
                                 required
                                 className="flex-1 h-12 px-4 rounded-r-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                              />
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Section 2: Business & Tax Details (Optional) */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm">
                     <div className="flex items-center gap-3 pb-5 border-b border-slate-100 mb-6">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm">
                           2
                        </div>
                        <div>
                           <h2 className="text-lg font-bold text-slate-900">Billing & Business (Optional)</h2>
                           <p className="text-xs text-slate-500">Add company details if you need a business tax invoice.</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                           <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                              Company / Organization
                           </label>
                           <input
                              type="text"
                              name="company"
                              value={formData.company}
                              onChange={handleChange}
                              placeholder="e.g. Acme Inc."
                              className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                           />
                        </div>

                        <div>
                           <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                              GST Number (GSTIN)
                           </label>
                           <input
                              type="text"
                              name="gst"
                              value={formData.gst}
                              onChange={handleChange}
                              placeholder="e.g. 29ABCDE1234F1Z5"
                              className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                           />
                        </div>
                     </div>
                  </div>

                  {/* Section 3: Coupon Code */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm">
                     <div className="flex items-center gap-3 pb-5 border-b border-slate-100 mb-5">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">
                           %
                        </div>
                        <div>
                           <h2 className="text-lg font-bold text-slate-900">Discount Coupon</h2>
                           <p className="text-xs text-slate-500">Apply a promotional promo code or select an available coupon.</p>
                        </div>
                     </div>

                     {couponData ? (
                        <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                 <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 6 9 17l-5-5" />
                                 </svg>
                              </div>
                              <div>
                                 <div className="font-bold text-sm text-emerald-900">
                                    Code '{couponData.code}' applied!
                                 </div>
                                 <div className="text-xs text-emerald-700 font-medium">
                                    You save {formatCurrency(discount)} on this purchase.
                                 </div>
                              </div>
                           </div>
                           <button
                              type="button"
                              onClick={handleRemoveCoupon}
                              className="text-xs font-bold text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 transition-colors"
                           >
                              Remove
                           </button>
                        </div>
                     ) : (
                        <div className="space-y-4">
                           <div className="flex gap-2">
                              <input
                                 type="text"
                                 name="coupon"
                                 value={formData.coupon}
                                 onChange={handleChange}
                                 placeholder="Enter coupon code"
                                 className="flex-1 h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 uppercase font-semibold placeholder:font-normal placeholder:normal-case placeholder:text-slate-400 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                              />
                              <button
                                 type="button"
                                 onClick={() => handleApplyCoupon()}
                                 disabled={couponLoading || !formData.coupon.trim()}
                                 className="h-12 px-6 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                              >
                                 {couponLoading ? 'Applying...' : 'Apply'}
                              </button>
                           </div>

                           {/* Available Coupons Dropdown / Quick Select */}
                           {Array.isArray(coupons) && coupons.length > 0 && (
                              <div className="pt-2">
                                 <label className="block text-xs font-semibold text-slate-500 mb-2">Or select from available offers:</label>
                                 <div className="flex flex-wrap gap-2">
                                    {coupons.map((c) => (
                                       <button
                                          key={c._id || c.code}
                                          type="button"
                                          onClick={() => {
                                             setFormData(prev => ({ ...prev, coupon: c.code }))
                                             handleApplyCoupon(c.code)
                                          }}
                                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-dashed border-blue-300 bg-blue-50/50 text-blue-700 hover:bg-blue-100 transition-all flex items-center gap-1.5"
                                       >
                                          <span>🏷️ {c.code}</span>
                                          <span className="text-[10px] text-blue-500 font-normal">
                                             ({c.discountType === 'percentage' ? `${c.discountPercent}% OFF` : `₹${c.discountAmount} OFF`})
                                          </span>
                                       </button>
                                    ))}
                                 </div>
                              </div>
                           )}

                           {couponError && (
                              <p className="text-xs font-semibold text-red-600 mt-1">{couponError}</p>
                           )}
                        </div>
                     )}
                  </div>

               </div>

               {/* Right Column: Sticky Order Summary */}
               <aside className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm">
                     <h2 className="text-lg font-bold text-slate-900 mb-5 pb-3 border-b border-slate-100">
                        Order Summary
                     </h2>

                     {/* Course Snapshot */}
                     <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                        <img
                           src={courseThumbnail}
                           alt={course.title || 'Course'}
                           className="w-20 h-20 object-cover rounded-xl border border-slate-200 bg-slate-100 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                           <span className="inline-block text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md mb-1">
                              {selectedPlan.title || 'Course Plan'}
                           </span>
                           <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                              {course.title || selectedPlan.title || 'Course Enrollment'}
                           </h3>
                           <p className="text-xs text-slate-500 mt-0.5">Instant online access</p>
                        </div>
                     </div>

                     {/* Breakdown Component */}
                     <div className="py-4">
                        <CheckoutBreakdown
                           compact
                           basePrice={basePrice}
                           discount={discount}
                           gstRate={gstRate}
                           couponData={couponData}
                        />
                     </div>

                     {/* Pay Button CTA */}
                     <button
                        type="button"
                        onClick={handlePayment}
                        disabled={paying}
                        className="w-full mt-4 h-14 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-bold text-base rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer"
                     >
                        {paying ? (
                           <>
                              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                              </svg>
                              <span>Processing Order...</span>
                           </>
                        ) : (
                           <>
                              <svg className="w-5 h-5 text-white/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                 <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                 <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                              </svg>
                              <span>Pay {formatCurrency(total)}</span>
                           </>
                        )}
                     </button>

                     {/* Security / Payment method icons */}
                     <div className="mt-6 pt-5 border-t border-slate-100 space-y-3 text-center">
                        <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-500">
                           <span>Secured by</span>
                           <span className="font-bold text-slate-800">Razorpay</span>
                           <span>•</span>
                           <span>UPI, Cards, NetBanking, EMI</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                           By proceeding with the payment, you agree to the Terms of Service & Privacy Policy.
                        </p>
                     </div>
                  </div>

                  {/* Trust Highlights */}
                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                     <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-base">⚡</span>
                        <span className="font-medium">Instant Access</span>
                     </div>
                     <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-base">🔒</span>
                        <span className="font-medium">Encrypted Checkout</span>
                     </div>
                  </div>
               </aside>
            </div>
         </main>

         {/* OTP Verification Modal */}
         {showOTPModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
               <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-slate-200">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                     <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                     </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Verify Your Email</h3>
                  <p className="text-xs text-slate-500 mb-4">
                     We sent a 6-digit one-time passcode to <span className="font-semibold text-slate-800">{formData.email}</span>.
                  </p>
                  <input
                     value={otp}
                     onChange={e => setOtp(e.target.value)}
                     placeholder="Enter 6-digit OTP"
                     autoFocus
                     className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-bold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 mb-3"
                  />
                  {otpMessage && (
                     <p className="text-xs text-slate-600 mb-4 text-center">{otpMessage}</p>
                  )}
                  <div className="flex gap-2">
                     <button
                        type="button"
                        onClick={() => { setShowOTPModal(false); setOtp(''); setOtpMessage('') }}
                        className="flex-1 h-11 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                     >
                        Cancel
                     </button>
                     <button
                        type="button"
                        onClick={verifyOtp}
                        disabled={verifyingOtp}
                        className="flex-1 h-11 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                     >
                        {verifyingOtp ? 'Verifying...' : 'Confirm OTP'}
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Success Modal */}
         {showSuccessModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
               <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5">
                     <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                     </svg>
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Enrollment Confirmed!</h3>
                  <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                     Your payment was successful and access has been unlocked for <span className="font-semibold text-slate-900">{course.title || selectedPlan.title}</span>.
                  </p>
                  <button
                     type="button"
                     onClick={() => navigate('/dashboard/my-courses')}
                     className="w-full h-12 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20"
                  >
                     Go to My Courses
                  </button>
               </div>
            </div>
         )}
      </div>
   )
}

export default Checkout
