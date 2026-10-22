import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loginUser, googleLoginUser, clearAuthError, requestPasswordReset } from '../redux/slices/authSlice'
import { useGoogleLogin } from '@react-oauth/google'
import { useLanguage } from '../context/LanguageContext'
import './Login.css'

const Login = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error, token } = useSelector((state) => state.auth)
  const { t } = useLanguage()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [localError, setLocalError] = useState(null)

  // Forgot password modal state
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotError, setForgotError] = useState('')
  const [forgotMessage, setForgotMessage] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (token) navigate('/dashboard', { replace: true })
  }, [token, navigate])

  // Clear error when inputs change
  useEffect(() => {
    if (error) dispatch(clearAuthError())
    if (localError) setLocalError(null)
  }, [email, password])

  useEffect(() => {
    if (!forgotOpen) {
      setForgotError('')
      setForgotMessage('')
      return
    }
    setForgotEmail(email.trim())
  }, [forgotOpen, email])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    const resultAction = await dispatch(loginUser({ email: email.trim(), password }))
    if (loginUser.fulfilled.match(resultAction)) {
      navigate('/dashboard', { replace: true })
    }
  }

  const openForgotModal = () => {
    setForgotEmail(email.trim())
    setForgotError('')
    setForgotMessage('')
    setForgotOpen(true)
  }

  const closeForgotModal = () => {
    if (forgotLoading) return
    setForgotOpen(false)
  }

  const handleForgotSubmit = async (e) => {
    e.preventDefault()
    const targetEmail = forgotEmail.trim()
    if (!targetEmail || !targetEmail.includes('@')) {
      setForgotError('Please enter a valid email address.')
      return
    }

    setForgotLoading(true)
    setForgotError('')
    setForgotMessage('')

    try {
      const response = await dispatch(requestPasswordReset({ email: targetEmail })).unwrap()
      setForgotMessage(response?.message || 'Password reset instructions sent to your email.')
    } catch (err) {
      setForgotError(err || 'Unable to send reset link. Please try again.')
    } finally {
      setForgotLoading(false)
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
        setLocalError(err?.message || 'Google Login failed. Please try standard sign in.')
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
      <div className="auth-card-container">
        
        {/* Left Side: Form Section */}
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
                <span className="auth-brand-badge">Learner Portal</span>
              </div>
            </Link>
          </div>

          <div className="auth-form-content">
            <div className="auth-welcome-block">
              <h1 className="auth-main-title">{t('welcomeBackTitle') || 'Welcome Back'}</h1>
              <p className="auth-main-subtitle">
                {t('loginSubtitle') || 'Sign in to access your courses, projects, and learning track.'}
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
              <span>{t('continueWithGoogle') || 'Continue with Google'}</span>
            </button>

            {/* Divider */}
            <div className="auth-divider-row">
              <span>{t('orEmail') || 'Or continue with email'}</span>
            </div>

            {/* Error Message */}
            {displayError && (
              <div className="auth-alert-error">
                <svg className="alert-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>
                  {displayError === 'Failed to fetch' || (typeof displayError === 'string' && displayError.toLowerCase().includes('failed to fetch'))
                    ? 'Invalid email or password'
                    : displayError}
                </span>
              </div>
            )}

            {/* Form */}
            <form className="auth-actual-form" onSubmit={handleSubmit}>
              <div className="auth-field-group">
                <label className="auth-input-label" htmlFor="login-email">
                  {t('emailAddress') || 'Email Address'}
                </label>
                <div className="auth-input-wrapper">
                  <svg className="auth-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <input
                    id="login-email"
                    type="email"
                    className="auth-text-input"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <div className="auth-label-flex">
                  <label className="auth-input-label" htmlFor="login-password">
                    {t('password') || 'Password'}
                  </label>
                  <button
                    type="button"
                    className="auth-forgot-trigger"
                    onClick={openForgotModal}
                  >
                    {t('forgotPassword') || 'Forgot password?'}
                  </button>
                </div>
                <div className="auth-input-wrapper">
                  <svg className="auth-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-text-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
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

              <div className="auth-remember-row">
                <label className="auth-checkbox-label">
                  <input
                    type="checkbox"
                    className="auth-custom-checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me for 30 days</span>
                </label>
              </div>

              <button
                type="submit"
                className={`auth-primary-submit ${loading ? 'auth-btn-loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="auth-submit-spinner" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>{t('signIn') || 'Sign In to Account'}</span>
                )}
              </button>
            </form>

            {/* Bottom Switch Link */}
            <div className="auth-switch-prompt">
              <span>{t('donthaveAccount') || "Don't have an account?"}</span>
              <Link to="/signup" className="auth-switch-link">
                {t('signUpNow') || 'Create Free Account'}
              </Link>
            </div>
          </div>

          <div className="auth-footer-note">
            © {new Date().getFullYear()} Data Knowledge. All rights reserved.
          </div>
        </div>

        {/* Right Side: Visual Brand Showcase */}
        <div className="auth-visual-side">
          <div className="auth-visual-inner">
            {/* Live Indicator */}
            <div className="auth-live-pill">
              <span className="live-dot-pulse" />
              <span>Interactive Learning Platform</span>
            </div>

            {/* Visual Header */}
            <div className="auth-visual-headline">
              <h2>Master Data Analytics &amp; AI With Industry Mentors</h2>
              <p>
                Access real-world datasets, career-focused projects, live doubt support, and resume reviews tailored to help you get hired.
              </p>
            </div>

            {/* Testimonial Feature Card */}
            <div className="auth-testimonial-box">
              <div className="auth-stars-row">
                {'★★★★★'.split('').map((star, i) => (
                  <span key={i} className="star-gold">{star}</span>
                ))}
                <span className="rating-badge">4.9 / 5.0</span>
              </div>
              <p className="auth-quote-text">
                "The curriculum at Data Knowledge gave me the exact hands-on SQL and PowerBI projects that interviewers asked about during my final hiring round."
              </p>
              <div className="auth-student-profile">
                <div className="student-avatar-badge">RS</div>
                <div>
                  <h4 className="student-name">Rahul Sharma</h4>
                  <p className="student-role">Data Analyst • Placed via Data Knowledge</p>
                </div>
              </div>
            </div>

            {/* Stats Metrics Grid */}
            <div className="auth-stats-grid">
              <div className="auth-stat-col">
                <span className="stat-number">15,000+</span>
                <span className="stat-caption">{t('activeLearners') || 'Active Learners'}</span>
              </div>
              <div className="auth-stat-col">
                <span className="stat-number">94.8%</span>
                <span className="stat-caption">{t('completionRate') || 'Job Ready Rate'}</span>
              </div>
              <div className="auth-stat-col">
                <span className="stat-number">1:1</span>
                <span className="stat-caption">Mentor Support</span>
              </div>
            </div>

            {/* Tech Tags */}
            <div className="auth-tags-strip">
              <span>SQL</span>
              <span>Python</span>
              <span>Power BI</span>
              <span>Tableau</span>
              <span>Machine Learning</span>
              <span>Excel</span>
            </div>
          </div>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="forgot-modal-backdrop" onClick={closeForgotModal}>
          <div className="forgot-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="forgot-modal-header">
              <div>
                <span className="forgot-badge">{t('forgotPassword') || 'Password Recovery'}</span>
                <h3 className="forgot-title">{t('requestResetLink') || 'Reset your password'}</h3>
              </div>
              <button
                type="button"
                className="forgot-close-button"
                onClick={closeForgotModal}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <p className="forgot-description">
              {t('requestResetLinkDesc') || 'Enter your registered email address and we will send you secure instructions to reset your password.'}
            </p>

            {forgotError && (
              <div className="forgot-status-msg forgot-status-error">{forgotError}</div>
            )}
            {forgotMessage && (
              <div className="forgot-status-msg forgot-status-success">{forgotMessage}</div>
            )}

            <form onSubmit={handleForgotSubmit} className="forgot-form-body">
              <div className="auth-field-group">
                <label className="auth-input-label" htmlFor="forgot-email">
                  {t('emailAddress') || 'Email Address'}
                </label>
                <div className="auth-input-wrapper">
                  <svg className="auth-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <input
                    id="forgot-email"
                    type="email"
                    className="auth-text-input"
                    placeholder="name@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="forgot-actions-row">
                <button
                  type="button"
                  className="forgot-btn-secondary"
                  onClick={closeForgotModal}
                  disabled={forgotLoading}
                >
                  {t('cancelBtn') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="forgot-btn-primary"
                  disabled={forgotLoading}
                >
                  {forgotLoading ? (t('sendingBtn') || 'Sending Link...') : (t('sendResetLinkBtn') || 'Send Reset Link')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Login
