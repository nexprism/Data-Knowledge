import React, { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchNewsBySlug } from '../redux/slices/newsSlice'
import { gsap } from 'gsap'
import { useLanguage } from '../context/LanguageContext'

const NewsDetail = () => {
  const { id: slug } = useParams()
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const { currentNews: articleData, loading } = useSelector((state) => state.news)
  const containerRef = useRef(null)
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState([])

  const handlePostComment = () => {
    if (!comment.trim()) return
    
    const newComment = {
      id: Date.now(),
      text: comment,
      author: "USER PROFILER",
      date: "JUST NOW"
    }
    
    setComments([newComment, ...comments])
    setComment('')
  }

  useEffect(() => {
    if (slug) {
      dispatch(fetchNewsBySlug(slug))
    }
  }, [dispatch, slug])

  // Scroll to top on data load
  useEffect(() => {
    window.scrollTo(0, 0)
    
    if (articleData) {
      const ctx = gsap.context(() => {
        gsap.fromTo('.detail-reveal', 
          { y: 40, opacity: 0, filter: 'blur(10px)' },
          { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.2, ease: 'expo.out', stagger: 0.1 }
        )

        gsap.fromTo('.detail-hero-img',
          { scale: 1.1, opacity: 0 },
          { scale: 1, opacity: 1, duration: 1.5, ease: 'power3.out' }
        )
      }, containerRef)

      return () => ctx.revert()
    }
  }, [articleData])

  if (loading && !articleData) {
    return <div className="min-h-screen bg-dark" />
  }

  if (!articleData) return null

  // Map API data
  const article = {
    category: articleData.categories?.[0]?.toUpperCase() || "NEWS",
    title: articleData.title,
    date: new Date(articleData.publishedAt || articleData.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase(),
    time: new Date(articleData.publishedAt || articleData.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }).toUpperCase(),
    views: articleData.stats?.views >= 1000 ? (articleData.stats.views / 1000).toFixed(1) + 'K' : articleData.stats?.views || '0',
    commentsCount: articleData.comments?.length || 0,
    image: (() => {
        const url = articleData.imageUrl || articleData.coverImage || articleData.image;
        if (!url) return '/news_placeholder.png';
        const rawBase = import.meta.env.VITE_BASE_URL || import.meta.env.VITE_API_BASE || 'https://api.dataknowledge.in';
        const baseUrl = rawBase.replace(/\/api\/v1\/?$/, '');
        return encodeURI(url.startsWith('http') ? url : `${baseUrl}/uploads/news/${url}`);
    })(),
    intro: articleData.summary?.replace(/<[^>]*>?/gm, '')?.replace('[&hellip;]', '...'),
    content: articleData.content
  }

  const shareButtons = [
    { label: 'Facebook', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg> },
    { label: 'Twitter', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg> },
    { label: 'LinkedIn', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg> },
    { label: 'Copy Link', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg> }
  ]

  return (
    <div ref={containerRef} className="min-h-screen bg-dark pt-32 pb-24 px-4 md:px-12 lg:px-20">
      <div className="max-w-4xl mx-auto">
        
        {/* 1. Header Section */}
        <div className="flex flex-col gap-8 mb-16">
            <div className="detail-reveal opacity-0">
                <span className="px-3 py-1 bg-accent/20 border border-accent/30 text-accent font-jetbrains text-[9px] font-bold tracking-[0.2em] uppercase">
                    {article.category}
                </span>
            </div>

            <h1 className="detail-reveal opacity-0 font-inter font-extrabold not- text-3xl md:text-5xl text-normal leading-[1.2] selection:bg-accent selection:text-white">
                {article.title}
            </h1>

            <div className="detail-reveal opacity-0 flex flex-wrap items-center justify-between gap-6 border-b border-white/5 pb-8 mt-4">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-description/80"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        <span className="font-montserrat text-[14px] text-description/80 tracking-wider uppercase">{article.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-description/80"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span className="font-montserrat text-[14px] text-description/80 tracking-wider uppercase">{article.time}</span>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-4 text-description/80 font-montserrat text-[14px] tracking-wider uppercase">
                         <span className="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> {article.views} VIEWS</span>
                         <span className="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg> {article.commentsCount}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="font-jetbrains text-[9px] text-description/30 tracking-widest uppercase mr-2">Share</span>
                        {shareButtons.map((btn) => (
                            <button key={btn.label} className="w-8 h-8 flex items-center justify-center border border-white/5 text-description hover:text-accent hover:border-accent transition-all group">
                                {btn.icon}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* 2. Hero Image Section */}
        <div className="detail-reveal opacity-0 w-full aspect-[16/9] overflow-hidden mb-16 border border-white/5 group">
            <img 
                src={article.image} 
                referrerPolicy="no-referrer"
                className="detail-hero-img w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" 
                alt="Article Hero"
            />
        </div>

        {/* 3. Content Section */}
        <div className="flex flex-col gap-12">
            {/* Intro Block */}
            <div className="detail-reveal opacity-0 bg-[#3498db]/5 border-l-4 border-[#3498db] p-6 md:p-8 rounded-r-xl">
                <p className="font-inter not- text-base md:text-lg leading-relaxed text-slate-800 font-medium">
                    {article.intro}
                </p>
            </div>

            {/* Main Text Content */}
            <div className="flex flex-col gap-16">
                <div 
                    className="detail-reveal opacity-0 font-jetbrains text-xs md:text-[13px] leading-[1.8] text-description tracking-wide selection:bg-accent selection:text-dark news-content-html"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                />
            </div>
        </div>

        {/* 4. Comments Section */}
        <div className="detail-reveal opacity-0 mt-32 pt-20 border-t border-white/5 group">
            <div className="flex items-center gap-4 mb-16">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                <h3 className="font-jetbrains text-[11px] font-bold tracking-[0.3em] uppercase text-normal">Comments ({comments.length})</h3>
            </div>

            {/* Dynamic Comments Thread - Now at the Top */}
            <div className="flex flex-col gap-12 mb-20">
                {comments.map((c) => (
                    <div key={c.id} className="detail-reveal flex flex-col gap-4 border-b border-white/5 pb-10">
                        <div className="flex items-center justify-between">
                            <span className="font-jetbrains text-[9px] font-bold text-accent tracking-[0.2em] uppercase">{c.author}</span>
                            <span className="font-jetbrains text-[8px] text-description/30 tracking-widest uppercase">{c.date}</span>
                        </div>
                        <p className="font-inter not- text-sm text-slate-700 leading-relaxed font-normal">
                            {c.text}
                        </p>
                    </div>
                ))}
                {comments.length === 0 && (
                    <div className="text-center py-10 border border-white/5 bg-white/[0.01]">
                        <span className="font-jetbrains text-[9px] text-description tracking-[0.2em] uppercase">No perspectives shared yet. Be the first.</span>
                    </div>
                )}
            </div>

            {/* Comment Input Area - Now at the Bottom */}
            <div className="bg-white/[0.02] border border-white/5 p-8 flex flex-col gap-8 group-focus-within:border-accent/30 transition-all">
                <textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your perspective..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-4 outline-none font-inter not- text-sm text-slate-900 placeholder:text-slate-400 min-h-[120px] resize-none focus:border-[#3498db]"
                />
                <div className="pt-6 border-t border-white/5 flex justify-end">
                    <button 
                        onClick={handlePostComment}
                        className="px-10 py-5 bg-accent text-dark font-jetbrains text-[9px] font-bold tracking-[0.3em] uppercase hover:brightness-110 active:scale-95 transition-all"
                    >
                        POST COMMENT
                    </button>
                </div>
            </div>
        </div>

        {/* 5. Back Button */}
        <div className="detail-reveal opacity-0 mt-20 flex justify-center">
            <Link 
                to="/blogs"
                className="flex items-center gap-4 px-8 py-4 bg-accent/10 border border-accent/20 hover:bg-accent hover:text-dark transition-all group"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:-translate-x-1 transition-transform">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span className="font-jetbrains text-[9px] font-bold tracking-[0.3em] uppercase">{t('backToBlogs') || t('backToNews') || 'BACK TO BLOGS'}</span>
            </Link>
        </div>

      </div>
    </div>
  )
}

export default NewsDetail
