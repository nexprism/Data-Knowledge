import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiBaseUrl } from '../utils/apiConfig.js'

const Testimonials = () => {
  const baseUrl = getApiBaseUrl()
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 })
  const pageSize = 9

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    fetch(`${baseUrl}/testimonials?page=${page}&limit=${pageSize}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data?.message || 'Failed to fetch testimonials')
        return data
      })
      .then((data) => {
        if (cancelled) return
        setTestimonials(Array.isArray(data?.data) ? data.data : [])
        setPagination(data?.pagination || { total: 0, totalPages: 0 })
      })
      .catch((fetchError) => {
        if (!cancelled) setError(fetchError.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [baseUrl, page])

  const mediaUrl = (value) => {
    if (!value) return ''
    if (/^https?:\/\//i.test(value)) return value
    return `${baseUrl}/${String(value).replace(/\\/g, '/').replace(/^\/+/, '')}`
  }

  return (
    <main className="min-h-screen bg-white pt-36 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-xs font-bold uppercase tracking-widest text-[#1b6294]">
          Back to home
        </Link>
        <div className="mt-8 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#3498db]">Student proof</p>
          <h1 className="mt-3 text-4xl md:text-6xl font-black text-slate-900 tracking-tight">
            Learner testimonials
          </h1>
        </div>

        {loading && <p className="mt-16 text-sm text-slate-500">Loading testimonials...</p>}
        {error && <p className="mt-16 text-sm text-red-600">{error}</p>}
        {!loading && !error && testimonials.length === 0 && (
          <p className="mt-16 text-sm text-slate-500">No approved testimonials are available yet.</p>
        )}

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 items-start">
          {testimonials.map((testimonial) => {
            const screenshots = [
              ...(Array.isArray(testimonial.reviewImages) ? testimonial.reviewImages : []),
              testimonial.screenshot,
            ].filter((value, index, list) => value && list.indexOf(value) === index)
            const firstScreenshot = mediaUrl(screenshots[0])
            const avatar = mediaUrl(testimonial.image)

            return (
              <article
                key={testimonial._id}
                className="flex flex-col bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-[0_8px_30px_-18px_rgba(15,23,42,0.35)] hover:shadow-[0_16px_36px_-18px_rgba(15,23,42,0.4)] transition-shadow"
              >
                {firstScreenshot && (
                  <a href={firstScreenshot} target="_blank" rel="noreferrer" className="block bg-gradient-to-br from-slate-100 via-white to-slate-100 p-4">
                    <img
                      src={firstScreenshot}
                      alt={`${testimonial.name} review screenshot`}
                      className="w-full h-[420px] object-contain rounded-2xl bg-slate-50 border border-slate-200 shadow-sm"
                    />
                    <span className="block mt-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      View WhatsApp/review screenshot
                    </span>
                  </a>
                )}
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {avatar ? (
                      <img src={avatar} alt="" className="w-12 h-12 rounded-2xl object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-[#3498db]/10 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="flex gap-1 text-amber-500" aria-label={`${testimonial.rating || 5} stars`}>
                        {'★★★★★'.slice(0, Math.max(1, Math.min(5, Number(testimonial.rating) || 5)))}
                      </div>
                      <h2 className="mt-2 text-lg font-black text-slate-900">{testimonial.name}</h2>
                      {testimonial.role && <p className="text-sm text-slate-500">{testimonial.role}</p>}
                    </div>
                  </div>
                  <p className="mt-5 text-slate-700 leading-7 whitespace-pre-line">{testimonial.message}</p>
                </div>
              </article>
            )
          })}
        </div>

        {!loading && !error && pagination.totalPages > 1 && (
          <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Testimonials pagination">
            <button
              type="button"
              onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:border-[#3498db] hover:text-[#1b6294] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm font-bold text-slate-600">
              Page {page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((currentPage) => Math.min(pagination.totalPages, currentPage + 1))}
              disabled={page === pagination.totalPages}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:border-[#3498db] hover:text-[#1b6294] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </nav>
        )}
      </div>
    </main>
  )
}

export default Testimonials
