import React, { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchNews } from '../redux/slices/newsSlice'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import DashboardLoading from '../components/dashboard/DashboardLoading'
import { useLanguage } from '../context/LanguageContext'

const NewsCard = ({ article, variant = 'standard' }) => {
  const cardRef = useRef(null)

  if (variant === 'featured-main') {
    return (
      <Link 
        to={`/news/${article.id || 'featured'}`}
        ref={cardRef}
        className="news-dash-reveal col-span-12 lg:col-span-8 group cursor-pointer block relative h-[500px] md:h-[600px] overflow-hidden rounded-3xl"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src={article.image} 
            alt={article.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-40 group-hover:opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/20 to-transparent" />
        </div>
        
        <div className="relative z-10 h-full p-8 md:p-14 flex flex-col justify-end">
          <span className="font-jetbrains text-[9px] font-black text-accent tracking-[0.4em] uppercase mb-4 inline-block">
            {article.category}
          </span>
          <h2 className="font-inter text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.85] font-extralight transition-colors group-hover:text-accent mb-8 max-w-[90%] uppercase">
            {article.title}
          </h2>
          <div className="flex items-center gap-8 pt-8 border-t border-white/5 mt-8">
             <span className="font-jetbrains text-[8px] text-description/80 font-medium uppercase tracking-[0.2em]">{article.date}</span>
             <span className="font-jetbrains text-[8px] text-description/80 font-medium uppercase tracking-[0.2em] uppercase">CALIBRATED UPDATE</span>
          </div>
        </div>
      </Link>
    )
  }

  return (
      <Link 
        to={`/news/${article.id}`}
        ref={cardRef}
        className="news-dash-reveal col-span-12 md:col-span-6 lg:col-span-4 group cursor-pointer block bg-white/[0.02] border border-white/5 p-8 hover:bg-white/[0.04] transition-all duration-500"
      >
        <div className="relative aspect-video overflow-hidden mb-8 rounded-xl">
          <img 
            src={article.image} 
            alt={article.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70 group-hover:opacity-100"
          />
        </div>
        <div className="flex flex-col gap-4">
          <span className="font-jetbrains text-[9px] font-black text-accent tracking-[0.3em] uppercase">
            {article.category}
          </span>
          <h3 className="font-inter text-[22px] leading-tight text-normal transition-colors group-hover:text-accent uppercase">
            {article.title}
          </h3>
          <p className="font-montserrat text-[14px] leading-relaxed text-description/80 tracking-wide line-clamp-3">
            {article.description}
          </p>
          <div className="flex items-center justify-between pt-8 border-t border-white/5 mt-6">
            <span className="font-jetbrains text-[8px] text-description/80 font-medium uppercase tracking-[0.2em]">{article.date}</span>
            <span className="font-jetbrains text-[8px] text-accent/40 font-black tracking-widest uppercase flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-accent/40 rounded-full animate-pulse" />
              Intelligence Dossier
            </span>
          </div>
        </div>
      </Link>
  )
}

const DashboardNews = () => {
  const containerRef = useRef(null)
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const { newsList, loading, currentPage, totalPages } = useSelector((state) => state.news)

  useEffect(() => {
    dispatch(fetchNews({ page: 1, limit: 12, status: 'active' }))
  }, [dispatch])

  // Map API data to our existing structure
  const formattedArticles = newsList.map(n => ({
    id: n.slug || n._id,
    category: n.categories?.[0]?.toUpperCase() || 'GENERAL',
    title: n.title,
    description: n.summary?.replace(/<[^>]*>?/gm, '')?.replace('[&hellip;]', '...'),
    date: new Date(n.publishedAt || n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase(),
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
  const gridArticles = formattedArticles.slice(1)

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
    if (loading || formattedArticles.length === 0) return

    window.scrollTo(0, 0)
    const ctx = gsap.context(() => {
      gsap.fromTo('.news-dash-reveal',
        { y: 50, autoAlpha: 0, filter: 'blur(10px)' },
        { y: 0, autoAlpha: 1, filter: 'blur(0px)', duration: 1.2, ease: 'power4.out', stagger: 0.15 }
      )
    }, containerRef)
    return () => ctx.revert()
  }, [loading, formattedArticles.length])

  return (
    <div ref={containerRef} className="min-h-screen bg-dark selection:bg-accent/30 overflow-x-clip">
      <DashboardHeader />
      
      <main className="pt-32 pb-4 px-4">
        <div className="max-w-full mx-auto">
          
          <div className="mb-20 news-dash-reveal opacity-0">
             <span className="font-jetbrains text-[9px] font-black text-accent/50 tracking-[0.8em] uppercase mb-4 block">
               Dispatch Hub
             </span>
             <h1 className="font-inter text-[clamp(3rem,8vw,6.5rem)] leading-[0.75] font-extralight uppercase select-none">
                {t('blogs') || t('news') || 'Blogs'}
             </h1>
          </div>

          <div className="grid grid-cols-12 gap-12 mb-32">
             {featuredMain && <NewsCard article={featuredMain} variant="featured-main" />}
             <div className="col-span-12 lg:col-span-4 flex flex-col gap-10">
                <div className="bg-accent/5 border border-accent/10 p-10 flex flex-col items-center justify-center gap-6 text-center group transition-all news-dash-reveal opacity-0">
                   <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center text-accent animate-pulse group-hover:scale-110 transition-transform">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                   </div>
                   <h4 className="font-montserrat text-[14px] font-black text-accent tracking-[0.4em] uppercase">Intelligence Integrity</h4>
                   <p className="font-jetbrains text-[9px] text-description leading-relaxed uppercase opacity-60">Verified updates for premium dashboard carriers. calibrated daily at 0400 PST.</p>
                </div>
                <div className="bg-white/[0.01] border border-white/5 p-10 h-full flex flex-col justify-end news-dash-reveal opacity-0">
                   <span className="font-jetbrains text-[9px] font-black text-description/20 tracking-[0.4em] uppercase mb-4">Tactical Feed</span>
                   <p className="font-inter text-3xl text-normal leading-tight">Decentralized protocols and the future of creative labor.</p>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-12 gap-12 mb-10">
             {gridArticles.map((article) => (
                <NewsCard key={article.id} article={article} />
             ))}
          </div>

          {/* Scroll Sentinel */}
          <div ref={observerTarget} className="py-20 flex flex-col items-center justify-center gap-4">
              {loading ? (
                  <DashboardLoading />
              ) : currentPage < totalPages ? (
                  <span className="font-jetbrains text-[8px] text-description/20 tracking-[0.4em] uppercase animate-pulse">Scanning Archive...</span>
              ) : (
                  <div className="flex items-center gap-4 opacity-10">
                      <div className="h-[1px] w-10 bg-description" />
                      <span className="font-jetbrains text-[8px] text-description tracking-[0.4em] uppercase">Archive Fully Synched</span>
                      <div className="h-[1px] w-10 bg-description" />
                  </div>
              )}
          </div>

        </div>
      </main>
    </div>
  )
}

export default DashboardNews;
