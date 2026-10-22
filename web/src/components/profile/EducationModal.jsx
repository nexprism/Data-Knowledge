import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

const EducationModal = ({ isOpen, onClose, onSave, initialData = null, loading = false }) => {
  const [formData, setFormData] = useState({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
  })
  const [error, setError] = useState(null)

  useEffect(() => {
    if (initialData) {
      setFormData({
        institution: initialData.institution || '',
        degree: initialData.degree || '',
        fieldOfStudy: initialData.fieldOfStudy || '',
        startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().slice(0, 10) : '',
        endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().slice(0, 10) : '',
        isCurrent: !initialData.endDate && !!initialData.startDate,
      })
    } else {
      setFormData({
        institution: '',
        degree: '',
        fieldOfStudy: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
      })
    }
    setError(null)
  }, [initialData, isOpen])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (error) setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.institution.trim()) {
      setError('Institution name is required.')
      return
    }
    if (!formData.degree.trim()) {
      setError('Degree or program name is required.')
      return
    }

    const payload = {
      institution: formData.institution.trim(),
      degree: formData.degree.trim(),
      fieldOfStudy: formData.fieldOfStudy.trim() || 'General',
      startDate: formData.startDate ? formData.startDate : undefined,
      endDate: formData.isCurrent ? undefined : (formData.endDate || undefined),
    }

    if (initialData?._id) {
      payload._id = initialData._id
    }

    await onSave(payload)
  }

  return createPortal(
    <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm bg-slate-900/60 animate-in fade-in duration-300"
        onClick={loading ? undefined : onClose}
      />

      {/* Modal Dialog */}
      <div className="w-full max-w-[540px] bg-white border border-slate-200 p-8 relative overflow-hidden rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col gap-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300/60 flex items-center justify-center text-amber-800">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5l10-5l-10-5z M2 17l10 5l10-5 M2 12l10 5l10-5" />
              </svg>
            </div>
            <div>
              <h3 className="font-inter text-2xl text-slate-900 font-bold tracking-tight">
                {initialData ? 'Edit Education' : 'Add Education'}
              </h3>
              <p className="font-jetbrains text-[10px] text-slate-500 uppercase tracking-widest font-medium">Academic Credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-jetbrains">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="font-jetbrains text-[10px] text-slate-700 uppercase tracking-[0.2em] font-bold">
              Institution / University *
            </label>
            <input
              type="text"
              name="institution"
              value={formData.institution}
              onChange={handleChange}
              placeholder="e.g. Stanford University or Delhi University"
              disabled={loading}
              className="w-full bg-slate-50 border border-slate-200 p-3 font-jetbrains text-xs text-slate-900 focus:border-amber-500 transition-all outline-none rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-jetbrains text-[10px] text-slate-700 uppercase tracking-[0.2em] font-bold">
                Degree / Qualification *
              </label>
              <input
                type="text"
                name="degree"
                value={formData.degree}
                onChange={handleChange}
                placeholder="e.g. B.Tech, M.S., High School"
                disabled={loading}
                className="w-full bg-slate-50 border border-slate-200 p-3 font-jetbrains text-xs text-slate-900 focus:border-amber-500 transition-all outline-none rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-jetbrains text-[10px] text-slate-700 uppercase tracking-[0.2em] font-bold">
                Field of Study
              </label>
              <input
                type="text"
                name="fieldOfStudy"
                value={formData.fieldOfStudy}
                onChange={handleChange}
                placeholder="e.g. Computer Science, Business"
                disabled={loading}
                className="w-full bg-slate-50 border border-slate-200 p-3 font-jetbrains text-xs text-slate-900 focus:border-amber-500 transition-all outline-none rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-jetbrains text-[10px] text-slate-700 uppercase tracking-[0.2em] font-bold">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                disabled={loading}
                className="w-full bg-slate-50 border border-slate-200 p-3 font-jetbrains text-xs text-slate-900 focus:border-amber-500 transition-all outline-none rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-jetbrains text-[10px] text-slate-700 uppercase tracking-[0.2em] font-bold">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                disabled={loading || formData.isCurrent}
                className="w-full bg-slate-50 border border-slate-200 p-3 font-jetbrains text-xs text-slate-900 focus:border-amber-500 transition-all outline-none rounded-xl disabled:bg-slate-100 disabled:opacity-60"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              name="isCurrent"
              checked={formData.isCurrent}
              onChange={handleChange}
              disabled={loading}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
            <span className="font-jetbrains text-xs text-slate-700 font-medium">I am currently studying here</span>
          </label>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3.5 bg-accent text-slate-950 font-jetbrains text-xs font-black uppercase tracking-[0.25em] hover:brightness-105 active:scale-[0.98] transition-all rounded-full shadow-accent-soft disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>SAVING...</span>
                </>
              ) : (
                'SAVE RECORD'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3.5 border border-slate-200 text-slate-700 font-jetbrains text-xs font-bold uppercase tracking-[0.2em] hover:bg-slate-100 transition-all rounded-full"
            >
              CANCEL
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default EducationModal
