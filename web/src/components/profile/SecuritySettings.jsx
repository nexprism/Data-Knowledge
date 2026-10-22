import React, { useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { authorizedFetch, parseApiResponse } from '../../utils/apiClient'

const SecuritySettings = () => {
  const { t } = useLanguage()

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (error) setError(null)
    if (success) setSuccess(null)
  }

  const handleReset = () => {
    setForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError(t('fillAllFields') || 'All password fields are required.')
      return
    }

    if (form.newPassword.length < 6) {
      setError(t('passwordMinLength') || 'New password must be at least 6 characters long.')
      return
    }

    if (form.newPassword !== form.confirmPassword) {
      setError(t('passwordsDoNotMatch') || 'New password and confirm password do not match.')
      return
    }

    if (form.newPassword === form.currentPassword) {
      setError(t('newPasswordSameAsOld') || 'New password must be different from current password.')
      return
    }

    setLoading(true)

    try {
      const res = await authorizedFetch('/change-password', {
        method: 'POST',
        body: JSON.stringify({
          oldPassword: form.currentPassword,
          newPassword: form.newPassword,
          confirmPassword: form.confirmPassword,
        }),
      })

      const data = await parseApiResponse(res)

      if (!res.ok || data.success === false) {
        setError(data?.message || 'Failed to update password. Please check your current password.')
      } else {
        setSuccess(data?.message || 'Password updated successfully!')
        setForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      }
    } catch (err) {
      setError(err?.message || 'Network error while attempting to update password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* -------------------- SECURITY HEADER -------------------- */}
      <div className="flex justify-between items-end border-b border-slate-100 pb-4">
        <h2 className="font-inter text-3xl text-slate-900 font-bold tracking-tight lowercase flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          {t('security') || 'Security'} <span className="text-slate-400 font-normal">Settings</span>
        </h2>
      </div>

      {/* -------------------- NOTIFICATIONS / STATUS -------------------- */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-jetbrains flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0 text-red-600">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-800 text-xs font-bold font-jetbrains uppercase">Dismiss</button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs font-jetbrains flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0 text-amber-700">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-amber-700 hover:text-amber-950 text-xs font-bold font-jetbrains uppercase">Dismiss</button>
        </div>
      )}

      {/* -------------------- CREDENTIAL ROTATION FORM -------------------- */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 border border-slate-200/80 p-6 md:p-8 rounded-2xl relative overflow-hidden group">
        <div className="space-y-2">
          <label className="font-jetbrains text-[10px] text-slate-700 uppercase tracking-[0.3em] font-bold">
            {t('currentPasswordLabel') || 'Current Password'}
          </label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              name="currentPassword"
              value={form.currentPassword}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={loading}
              className="w-full bg-white border border-slate-200 p-3.5 pr-14 font-jetbrains text-xs text-slate-900 focus:border-amber-500 transition-all outline-none rounded-xl disabled:bg-slate-100"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 font-jetbrains text-[10px] text-slate-400 hover:text-slate-700 font-bold uppercase tracking-wider"
            >
              {showCurrent ? 'HIDE' : 'SHOW'}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="font-jetbrains text-[10px] text-slate-700 uppercase tracking-[0.3em] font-bold">
            {t('newPasswordLabel') || 'New Password'}
          </label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={loading}
              className="w-full bg-white border border-slate-200 p-3.5 pr-14 font-jetbrains text-xs text-slate-900 focus:border-amber-500 transition-all outline-none rounded-xl disabled:bg-slate-100"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 font-jetbrains text-[10px] text-slate-400 hover:text-slate-700 font-bold uppercase tracking-wider"
            >
              {showNew ? 'HIDE' : 'SHOW'}
            </button>
          </div>
        </div>

        <div className="col-span-1 md:col-span-2 space-y-2">
          <label className="font-jetbrains text-[10px] text-slate-700 uppercase tracking-[0.3em] font-bold">
            {t('confirmPasswordLabel') || 'Confirm Password'}
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={loading}
              className="w-full bg-white border border-slate-200 p-3.5 pr-14 font-jetbrains text-xs text-slate-900 focus:border-amber-500 transition-all outline-none rounded-xl disabled:bg-slate-100"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 font-jetbrains text-[10px] text-slate-400 hover:text-slate-700 font-bold uppercase tracking-wider"
            >
              {showConfirm ? 'HIDE' : 'SHOW'}
            </button>
          </div>
          <p className="font-jetbrains text-[10px] text-slate-500">Must be at least 6 characters and different from your current password.</p>
        </div>

        <div className="col-span-1 md:col-span-2 flex flex-col sm:flex-row gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-8 py-4 bg-accent text-slate-950 font-jetbrains text-xs font-black uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all rounded-full shadow-accent-soft disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>UPDATING...</span>
              </>
            ) : (
              t('updatePasswordBtn') || 'Update Password'
            )}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="flex-1 px-8 py-4 border border-slate-300 text-slate-700 hover:bg-slate-200/50 font-jetbrains text-xs font-bold uppercase tracking-[0.3em] transition-all rounded-full disabled:opacity-50"
          >
            {t('cancelBtn') || 'Cancel'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default SecuritySettings
