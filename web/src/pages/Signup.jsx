import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { registerUser, googleLoginUser, clearAuthError, sendOtp, verifyOtp } from '../redux/slices/authSlice'
import { useGoogleLogin } from '@react-oauth/google'
import { useLanguage } from '../context/LanguageContext'
import './Signup.css'

const Signup = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { loading, error, token, otpVerified: otpVerifiedStore } = useSelector((state) => state.auth)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [localError, setLocalError] = useState(null)
  const [termsAgreed, setTermsAgreed] = useState(true)

  // OTP states
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [otpSuccessMessage, setOtpSuccessMessage] = useState('')

  // Redirect if already logged in
  useEffect(() => {
    if (token) navigate('/dashboard', { replace: true })
  }, [token, navigate])

  // Clear errors on any field change
  useEffect(() => {
    if (error) dispatch(clearAuthError())
    if (localError) setLocalError(null)
  }, [name, email, phone, password, confirm])

  useEffect(() => {
    // Reset OTP state when email changes
    setOtpSent(false)
    setOtpCode('')
    setOtpSuccessMessage('')
  }, [email])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password.trim()) return
    if (!phone.trim()) {
      setLocalError('Phone number is required')
      return
    }
    if (!/^\+?[0-9]{10,15}$/.test(phone.trim())) {
      setLocalError('Please enter a valid phone number (10-15 digits)')
      return
    }
    if (!termsAgreed) {
      setLocalError('Please agree to the Terms of Service & Privacy Policy')
      return
    }
    if (password !== confirm) {
      setLocalError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters')
      return
    }
    const resultAction = await dispatch(registerUser({
      name: name.trim(),
      fullName: name.trim(),
      email: email.trim(),
      password,
      phone: phone.trim(),
      is_verify: !!otpVerifiedStore
    }))
    if (registerUser.fulfilled.match(resultAction)) {
      navigate('/dashboard', { replace: true })
    }
  }

  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) {
      setLocalError('Please enter a valid email address to send verification code')
      return
    }
    setSendingOtp(true)
    setLocalError(null)
    try {
      await dispatch(sendOtp({ email: email.trim() })).unwrap()
      setOtpSent(true)
      setOtpSuccessMessage('Verification code sent to your email.')
    } catch (err) {
      setLocalError(err || 'Failed to send OTP')
    } finally {
      setSendingOtp(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.trim().length < 4) {
      setLocalError('Please enter the 4-6 digit OTP sent to your email')
      return
    }
    setVerifyingOtp(true)
    setLocalError(null)
    try {
      await dispatch(verifyOtp({ email: email.trim(), otp: otpCode.trim() })).unwrap()
      setOtpSuccessMessage('Email verified successfully! ✓')
      setLocalError(null)
    } catch (err) {
      setLocalError(err || 'OTP verification failed. Please try again.')
    } finally {
      setVerifyingOtp(false)
    }
  }

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const resultAction = await dispatch(googleLoginUser({
          googleAccessToken: tokenResponse.access_token,
          deviceId: 'browser',
          platform: 'web'
        }))
        if (googleLoginUser.fulfilled.match(resultAction)) {
          navigate('/dashboard', { replace: true })
        }
      } catch (err) {
        setLocalError(err?.message || 'Google Login failed. Please try standard registration.')
      }
    },
    onError: (error) => {
      console.warn('Google Sign-in popup closed or failed:', error)
      setLocalError('Google Sign-In was cancelled or could not be initialized.')
    },
  })

  const displayError = localError || error

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card-container auth-card-container--signup">
        
        {/* Left Side: Signup Form */}
        <div className="auth-form-side">
          {/* Logo Header */}
          <div className="auth-header-top">
            <Link to="/" className="auth-brand-logo">
              <img
                src="/data_knowlege/logo/logo.png"
                alt="Data Knowledge"
                className="auth-logo-img"
              />
              <div className="auth-brand-text">
                <span className="auth-brand-name">Data Knowledge</span>
                <span className="auth-brand-badge">Create Account</span>
              </div>
            </Link>
          </div>

          <div className="auth-form-content">
            <div className="auth-welcome-block">
              <h1 className="auth-main-title">{t('joinTheCircleTitle') || 'Start Learning Today'}</h1>
              <p className="auth-main-subtitle">
                {t('signupSubtitle') || 'Create your free account to access industry courses and live mentorship.'}
              </p>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              className="auth-google-button"
              onClick={() => handleGoogleLogin()}
            >
              <svg className="google-icon-svg" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.85 0-5.27-1.92-6.13-4.51H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.87 14.13c-.22-.67-.35-1.38-.35-2.13s.13-1.46.35-2.13V7.03H2.18C1.43 8.53 1 10.21 1 12s.43 3.47 1.18 4.97l3.69-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.03l3.69 2.84c.86-2.59 3.28-4.51 6.13-4.51z" fill="#EA4335" />
              </svg>
              <span>{t('joinWithGoogle') || 'Sign up with Google'}</span>
            </button>

            {/* Divider */}
            <div className="auth-divider-row">
              <span>{t('orCreateAccount') || 'Or register with email'}</span>
            </div>

            {/* Error Message */}
            {displayError && (
              <div className="auth-alert-error">
                <svg className="alert-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{displayError}</span>
              </div>
            )}

            {/* Success Message for OTP */}
            {otpSuccessMessage && !displayError && (
              <div className="auth-alert-success">
                <span>{otpSuccessMessage}</span>
              </div>
            )}

            {/* Form */}
            <form className="auth-actual-form" onSubmit={handleSubmit}>
              
              {/* Full Name */}
              <div className="auth-field-group">
                <label className="auth-input-label" htmlFor="signup-name">
                  {t('fullName') || 'Full Name'}
                </label>
                <div className="auth-input-wrapper">
                  <svg className="auth-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="8" r="5" />
                    <path d="M20 21a8 8 0 0 0-16 0" />
                  </svg>
                  <input
                    id="signup-name"
                    type="text"
                    className="auth-text-input"
                    placeholder="e.g. Aman Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* Email + OTP Row */}
              <div className="auth-field-group">
                <div className="auth-label-flex">
                  <label className="auth-input-label" htmlFor="signup-email">
                    {t('emailAddress') || 'Email Address'}
                  </label>
                  {otpVerifiedStore ? (
                    <span className="auth-verified-badge">✓ Verified</span>
                  ) : (
                    <button
                      type="button"
                      className="auth-otp-trigger-btn"
                      onClick={handleSendOtp}
                      disabled={sendingOtp || !email.includes('@')}
                    >
                      {sendingOtp ? 'Sending code...' : (otpSent ? 'Resend Code' : 'Verify with OTP')}
                    </button>
                  )}
                </div>
                <div className="auth-input-wrapper">
                  <svg className="auth-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <input
                    id="signup-email"
                    type="email"
                    className="auth-text-input"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                {/* Inline OTP Input Box if sent */}
                {otpSent && !otpVerifiedStore && (
                  <div className="auth-otp-box">
                    <input
                      type="text"
                      className="auth-otp-input"
                      placeholder="Enter verification code"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      maxLength={6}
                    />
                    <button
                      type="button"
                      className="auth-otp-verify-btn"
                      onClick={handleVerifyOtp}
                      disabled={verifyingOtp || otpCode.trim().length < 4}
                    >
                      {verifyingOtp ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                )}
              </div>

              {/* Phone */}
              <div className="auth-field-group">
                <label className="auth-input-label" htmlFor="signup-phone">
                  Phone Number
                </label>
                <div className="auth-input-wrapper">
                  <svg className="auth-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <input
                    id="signup-phone"
                    type="tel"
                    className="auth-text-input"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="auth-field-group">
                <label className="auth-input-label" htmlFor="signup-password">
                  {t('password') || 'Password'}
                </label>
                <div className="auth-input-wrapper">
                  <svg className="auth-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-text-input"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-eye-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="auth-field-group">
                <label className="auth-input-label" htmlFor="signup-confirm">
                  {t('confirmPassword') || 'Confirm Password'}
                </label>
                <div className="auth-input-wrapper">
                  <svg className="auth-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    id="signup-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    className={`auth-text-input ${confirm && password !== confirm ? 'auth-input-mismatch' : ''}`}
                    placeholder="Re-enter password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-eye-toggle"
                    onClick={() => setShowConfirm((prev) => !prev)}
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirm ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {confirm && (
                  <span className={`auth-match-hint ${password === confirm ? 'hint-match-ok' : 'hint-match-err'}`}>
                    {password === confirm ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </span>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="auth-remember-row">
                <label className="auth-checkbox-label">
                  <input
                    type="checkbox"
                    className="auth-custom-checkbox"
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                  />
                  <span>
                    I agree to the <Link to="/terms" className="auth-inline-link">Terms</Link> and <Link to="/privacy-policy" className="auth-inline-link">Privacy Policy</Link>
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className={`auth-primary-submit ${loading ? 'auth-btn-loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="auth-submit-spinner" />
                    <span>Creating your account...</span>
                  </>
                ) : (
                  <span>{t('createAccount') || 'Create Free Account'}</span>
                )}
              </button>
            </form>

            {/* Bottom Switch Link */}
            <div className="auth-switch-prompt">
              <span>{t('alreadyHaveAccount') || 'Already have an account?'}</span>
              <Link to="/login" className="auth-switch-link">
                {t('signIn') || 'Sign In'}
              </Link>
            </div>
          </div>

          <div className="auth-footer-note">
            © {new Date().getFullYear()} Data Knowledge. All rights reserved.
          </div>
        </div>

        {/* Right Side: Brand Visual Showcase for Signup */}
        <div className="auth-visual-side">
          <div className="auth-visual-inner">
            {/* Live Indicator */}
            <div className="auth-live-pill">
              <span className="live-dot-pulse" />
              <span>Free Community &amp; Starter Access</span>
            </div>

            {/* Visual Header */}
            <div className="auth-visual-headline">
              <h2>Accelerate Your Career in Modern Data Engineering &amp; AI</h2>
              <p>
                Join thousands of students and working professionals mastering in-demand tech stacks through project-driven learning.
              </p>
            </div>

            {/* Feature Perks Box */}
            <div className="auth-testimonial-box auth-perks-box">
              <h4 className="perks-title">What You Get With Data Knowledge:</h4>
              <ul className="perks-list">
                <li>
                  <span className="perk-check">✓</span>
                  <span><strong>Industry-Grade Projects:</strong> Build production ETL pipelines, dashboards &amp; models.</span>
                </li>
                <li>
                  <span className="perk-check">✓</span>
                  <span><strong>Dedicated Doubt Clearance:</strong> Direct mentor access on Discord and live sessions.</span>
                </li>
                <li>
                  <span className="perk-check">✓</span>
                  <span><strong>Placement Support:</strong> Mock interviews, resume screening &amp; job referrals.</span>
                </li>
              </ul>
            </div>

            {/* Stats Metrics Grid */}
            <div className="auth-stats-grid">
              <div className="auth-stat-col">
                <span className="stat-number">84,000+</span>
                <span className="stat-caption">{t('studentsEnrolled') || 'Enrolled Students'}</span>
              </div>
              <div className="auth-stat-col">
                <span className="stat-number">100+</span>
                <span className="stat-caption">Hiring Partners</span>
              </div>
              <div className="auth-stat-col">
                <span className="stat-number">4.9 ★</span>
                <span className="stat-caption">Student Rating</span>
              </div>
            </div>

            {/* Tech Tags */}
            <div className="auth-tags-strip">
              <span>Python</span>
              <span>SQL</span>
              <span>PowerBI</span>
              <span>Snowflake</span>
              <span>Databricks</span>
              <span>Tableau</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Signup
