import React, { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchNews } from '../redux/slices/newsSlice'
import { useLanguage } from '../context/LanguageContext'

const NewsCard = ({ article, variant = 'standard' }) => {
  const cardRef = useRef(null)

  if (variant === 'featured-main') {
    return (
      <Link 
        to={`/news/${article.id || 'featured'}`}
        ref={cardRef}
        className="news-reveal col-span-1 lg:col-span-8 group cursor-pointer block relative h-[420px] md:h-[550px] overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-amber-400 transition-all"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src={article.image} 
            alt={article.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent opacity-90" />
        </div>
        
        <div className="relative z-10 h-full p-8 md:p-12 flex flex-col justify-end">
          <span className="font-inter text-xs font-bold text-white bg-[#3498db] tracking-wider uppercase mb-4 px-3.5 py-1 rounded-full w-fit shadow-sm not-">
            {article.category}
          </span>
          <h2 className="font-inter not- text-2xl md:text-4xl font-extrabold leading-tight text-white transition-colors group-hover:text-blue-200 mb-4 max-w-3xl">
            {article.title}
          </h2>
          <p className="font-inter text-xs leading-relaxed text-slate-200 tracking-wide max-w-2xl font-normal line-clamp-2 mb-6 not-">
            {article.description}
          </p>
          <div className="flex items-center gap-6 pt-4 border-t border-white/20">
             <span className="font-jetbrains text-xs text-slate-300 font-medium uppercase tracking-wider">{article.date}</span>
             <span className="font-jetbrains text-xs text-slate-300 font-medium uppercase tracking-wider">12.4K VIEWS</span>
             <span className="font-jetbrains text-xs text-slate-300 font-medium uppercase tracking-wider">842 LIKES</span>
          </div>
        </div>
      </Link>
    )
  }

  if (variant === 'featured-side') {
    return (
      <Link 
        to={`/news/${article.id || 'featured-side'}`}
        ref={cardRef}
        className="news-reveal col-span-1 lg:col-span-4 group cursor-pointer flex flex-col justify-between bg-white border border-slate-200/80 hover:border-amber-400 p-6 md:p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 rounded-xl border border-slate-200/60 mb-6">
          <img 
            src={article.image} 
            alt={article.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-col gap-4">
          <span className="font-inter text-[11px] font-bold text-[#3498db] bg-[#3498db]/10 border border-[#3498db]/30 tracking-wider uppercase px-3 py-1 rounded-full w-fit not-">
            {article.category}
          </span>
          <h2 className="font-inter not- text-xl md:text-2xl leading-snug text-slate-900 font-bold transition-colors group-hover:text-[#3498db]">
            {article.title}
          </h2>
          <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
            <span className="font-jetbrains text-xs text-slate-500 font-medium uppercase tracking-wider">{article.date}</span>
            <span className="font-jetbrains text-xs text-slate-500 font-medium uppercase tracking-wider ml-auto">5.1K VIEWS</span>
          </div>
        </div>
      </Link>
    )
  }

  return (
      <Link 
        to={`/news/${article.id}`}
        ref={cardRef}
        className="news-reveal col-span-1 md:col-span-6 lg:col-span-4 group cursor-pointer block bg-white border border-slate-200/80 hover:border-amber-400 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300"
      >
        <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-100 border border-slate-200/60 mb-5">
          <img 
            src={article.image} 
            alt={article.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-col gap-3">
          <span className="font-inter text-[11px] font-bold text-[#3498db] bg-[#3498db]/10 border border-[#3498db]/30 tracking-wider uppercase px-3 py-1 rounded-full w-fit not-">
            {article.category}
          </span>
          <h3 className="font-inter not- text-lg md:text-xl leading-snug text-slate-900 font-bold transition-colors group-hover:text-[#3498db] line-clamp-2">
            {article.title}
          </h3>
          <p className="font-inter text-xs leading-relaxed text-slate-600 font-normal line-clamp-2 not-">
            {article.description}
          </p>
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-2">
            <span className="font-jetbrains text-xs text-slate-500 font-medium uppercase tracking-wider">{article.date}</span>
            <div className="flex gap-4 text-slate-500">
               <span className="font-jetbrains text-xs font-bold tracking-wider uppercase flex items-center gap-1.5">
                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                 {article.views}
               </span>
               <span className="font-jetbrains text-xs font-bold tracking-wider uppercase flex items-center gap-1.5">
                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78v0z"/></svg>
                 {article.likes}
               </span>
            </div>
          </div>
        </div>
      </Link>
  )
}

const News = () => {
  const containerRef = useRef(null)
  const [search, setSearch] = useState('')
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const { newsList, loading, total, currentPage, totalPages } = useSelector((state) => state.news)

  useEffect(() => {
    dispatch(fetchNews({ page: 1, limit: 12, status: 'active' }))
  }, [dispatch])

  // Map API data to our existing structure
  const formattedArticles = newsList.map(n => ({
    id: n.slug || n._id,
    category: n.categories?.[0]?.toUpperCase() || 'GENERAL',
    title: n.title,
    description: n.summary?.replace(/<[^>]*>?/gm, '')?.replace('[&hellip;]', '...'), // Clean HTML from summary
    date: new Date(n.publishedAt || n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase(),
    views: n.stats?.views >= 1000 ? (n.stats.views / 1000).toFixed(1) + 'K' : n.stats?.views || '0',
    likes: n.stats?.likes || '0',
    image: (() => {
        const url = n.imageUrl || n.coverImage || n.image;
        if (!url) return '/news_placeholder.png';
        const rawBase = import.meta.env.VITE_BASE_URL || import.meta.env.VITE_API_BASE || 'https://api.dataknowledge.in';
        const baseUrl = rawBase.replace(/\/api\/v1\/?$/, '');
        const finalUrl = url.startsWith('http') ? url : `${baseUrl}/uploads/news/${url}`;
        return encodeURI(finalUrl);
    })()
  }))

  const featuredMain = formattedArticles[0]
  const featuredSide = formattedArticles[1]
  const gridArticles = formattedArticles.slice(2)

  // Infinite Scroll Logic
  const observerTarget = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading && currentPage < totalPages) {
          dispatch(fetchNews({ page: currentPage + 1, limit: 12, status: 'active' }))
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [dispatch, currentPage, totalPages, loading])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-50 pt-28 md:pt-36 pb-24 px-4 md:px-12 lg:px-20 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* News Header - Restored Interlocking Editorial Style */}
        <div className="mb-16">
            <span className="font-inter text-xs font-bold text-[#3498db] tracking-[0.3em] uppercase mb-3 block not-">
              {t('archive2024') || 'LATEST UPDATES'}
            </span>
            
            <div className="relative">
              <h1 className="font-inter text-3xl md:text-5xl font-extrabold not- text-slate-900 tracking-tight">
                <span className="block">{t('latestTitle') || 'Data Knowledge'}</span>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-0 mt-2">
                  <div className="relative">
                    <span className="whitespace-nowrap block text-[#3498db]">{t('dispatchesTitle') || 'Articles & News'}</span>
                  </div>
                  
                  {/* Search: Repositioned to bottom-right baseline */}
                  <div className="w-full md:w-[420px] group relative md:mb-2">
                    <input 
                      type="text" 
                      placeholder={t('searchNewsPlaceholder') || 'Search articles...'}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-full py-3 px-6 pr-12 font-inter text-xs text-slate-900 focus:outline-none focus:border-[#3498db] shadow-sm transition-all duration-300 placeholder:text-slate-400 not-"
                    />
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-[#3498db] transition-colors">
                      <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                    </svg>
                  </div>
                </div>
              </h1>
            </div>
        </div>

        {/* Featured Section */}
        {featuredMain && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16 mt-8">
              <NewsCard article={featuredMain} variant="featured-main" />
              {featuredSide && <NewsCard article={featuredSide} variant="featured-side" />}
          </div>
        )}

        {loading && newsList.length === 0 && (
          <div className="py-20 flex justify-center">
             <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Supporting Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-8 mb-16">
            {gridArticles.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
        </div>

        {/* Scroll Sentinel */}
        <div ref={observerTarget} className="py-16 flex flex-col items-center justify-center gap-4 border-t border-slate-200/80">
            {loading ? (
                <div className="flex flex-col items-center gap-4">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : currentPage < totalPages ? (
                <span className="font-jetbrains text-xs text-slate-500 tracking-[0.3em] uppercase font-bold">{t('scrollToUnlock')}</span>
            ) : (
                <span className="font-jetbrains text-xs text-slate-400 tracking-[0.3em] uppercase font-bold">{t('endOfArchive')}</span>
            )}
        </div>

        {/* Pagination / Footer */}
        <div className="news-header-reveal flex flex-col md:flex-row items-center justify-between pt-12 border-t border-slate-200/80 gap-6">
            <button className="flex items-center gap-3 group">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:-translate-x-1 transition-transform duration-300 text-amber-600">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span className="font-jetbrains text-xs font-bold tracking-widest uppercase text-slate-700 group-hover:text-amber-600 transition-colors">{t('prevDispatch')}</span>
            </button>

            <div className="flex items-center gap-4 font-jetbrains text-xs font-bold tracking-wider">
               {[...Array(totalPages)].map((_, i) => (
                 <button 
                  key={i} 
                  onClick={() => dispatch(fetchNews({ page: i + 1 }))}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${currentPage === i + 1 ? 'bg-accent text-slate-950 font-black shadow-accent-soft' : 'bg-white border border-slate-200 text-slate-600 hover:border-amber-400 hover:text-amber-700'}`}
                 >
                   {(i + 1).toString().padStart(2, '0')}
                 </button>
               ))}
            </div>

            <button className="flex items-center gap-3 group text-right">
              <span className="font-jetbrains text-xs font-bold tracking-widest uppercase text-slate-700 group-hover:text-amber-600 transition-colors">{t('nextDispatch')}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-x-1 transition-transform duration-300 text-amber-600">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
        </div>

      </div>
    </div>
  )
}

export default News
