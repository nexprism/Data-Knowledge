import React, { useEffect, useRef, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchNews } from '../redux/slices/newsSlice'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import DashboardLoading from '../components/dashboard/DashboardLoading'
import { useLanguage } from '../context/LanguageContext'
import { getMediaUrl } from '../utils/apiConfig'

const calculateReadTime = (text) => {
  if (!text) return 3
  const words = text.trim().split(/\s+/).length
  return Math.max(2, Math.ceil(words / 40))
}

const DashboardNews = () => {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const { newsList, loading, currentPage, totalPages } = useSelector((state) => state.news)
  
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const observerTarget = useRef(null)

  useEffect(() => {
    dispatch(fetchNews({ page: 1, limit: 12, status: 'active' }))
  }, [dispatch])

  // Map API data to a clean, reliable structure
  const formattedArticles = useMemo(() => {
    return (newsList || []).map((n) => {
      const rawCategory = n.categories?.[0] || n.category?.name || n.category || 'General'
      const categoryStr = typeof rawCategory === 'string' ? rawCategory : (rawCategory?.name || 'General')
      
      const cleanDesc = (n.summary || n.excerpt || '')
        .replace(/<[^>]*>?/gm, '')
        .replace(/&nbsp;/g, ' ')
        .replace('[&hellip;]', '...')
        .trim()

      return {
        id: n.slug || n._id,
        category: categoryStr,
        title: n.title || 'Untitled Article',
        description: cleanDesc,
        date: new Date(n.publishedAt || n.createdAt || Date.now()).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        readTime: calculateReadTime(cleanDesc),
        image: getMediaUrl(n.imageUrl || n.coverImage || n.image, 'news', '/news_placeholder.png'),
        author: typeof n.author === 'string' ? n.author : (n.author?.name || 'Data Knowledge')
      }
    })
  }, [newsList])

  // Extract distinct categories
  const categories = useMemo(() => {
    const set = new Set()
    formattedArticles.forEach((a) => {
      if (a.category && a.category.trim()) {
        set.add(a.category.trim())
      }
    })
    return ['All', ...Array.from(set)]
  }, [formattedArticles])

  // Client-side filter for responsive instant search & tag filter
  const filteredArticles = useMemo(() => {
    return formattedArticles.filter((article) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        article.category.toLowerCase() === selectedCategory.toLowerCase()
      const query = search.trim().toLowerCase()
      const matchesSearch =
        !query ||
        article.title.toLowerCase().includes(query) ||
        article.description.toLowerCase().includes(query) ||
        article.category.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [formattedArticles, selectedCategory, search])

  // Infinite Scroll Trigger (when browsing all articles)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !loading &&
          currentPage < totalPages &&
          selectedCategory === 'All' &&
          !search.trim()
        ) {
          dispatch(fetchNews({ page: currentPage + 1, limit: 12, status: 'active' }))
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [dispatch, currentPage, totalPages, loading, selectedCategory, search])

  const showFeaturedHero = selectedCategory === 'All' && !search.trim() && filteredArticles.length > 0
  const featuredArticle = showFeaturedHero ? filteredArticles[0] : null
  const gridArticles = showFeaturedHero ? filteredArticles.slice(1) : filteredArticles

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-500/20 pb-20">
      <DashboardHeader />

      <main className="pt-24 md:pt-28 pb-16 px-4 sm:px-6 lg:px-12 max-w-[1500px] mx-auto">
        {/* Page Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span>{t('knowledgeHub') || 'Knowledge Hub'}</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-200/80">
            <div>
              <h1 className="font-inter text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {t('blogsTitle') || 'Blogs & Articles'}
              </h1>
              <p className="font-inter text-sm sm:text-base text-slate-500 mt-2 max-w-2xl leading-relaxed">
                {t('blogsSubtitle') || 'Practical guides, in-depth tutorials, and career insights in Data Analytics, Data Science, and AI.'}
              </p>
            </div>

            {/* Search Input */}
            <div className="w-full lg:w-80 relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchBlogsPlaceholder') || 'Search articles by topic, keyword...'}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-10 text-sm font-inter text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all"
              />
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          {categories.length > 1 && (
            <div className="flex items-center gap-2 pt-4 overflow-x-auto no-scrollbar pb-1">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold font-inter transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Featured Article Hero Card (Clean split layout - title is beside the image, NOT upon it) */}
        {featuredArticle && (
          <Link
            to={`/news/${featuredArticle.id}`}
            className="block bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300 overflow-hidden group mb-12"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              {/* Image Section */}
              <div className="lg:col-span-7 relative aspect-[16/10] lg:aspect-auto min-h-[260px] lg:min-h-[380px] overflow-hidden bg-slate-100">
                <img
                  src={featuredArticle.image}
                  alt={featuredArticle.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-4 left-4 z-10">
                  <span className="bg-white/95 backdrop-blur-md text-blue-600 font-bold text-xs px-3.5 py-1.5 rounded-full shadow-sm">
                    Featured Article
                  </span>
                </div>
              </div>

              {/* Content Section (Beside the image, NOT on top of it) */}
              <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-white">
                <div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium mb-3">
                    <span className="text-blue-600 font-bold uppercase tracking-wider">{featuredArticle.category}</span>
                    <span>•</span>
                    <span>{featuredArticle.date}</span>
                    <span>•</span>
                    <span>{featuredArticle.readTime} min read</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-inter text-slate-900 group-hover:text-blue-600 transition-colors leading-snug mb-3">
                    {featuredArticle.title}
                  </h2>

                  <p className="text-sm sm:text-base text-slate-600 font-inter leading-relaxed line-clamp-3 mb-6">
                    {featuredArticle.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs uppercase border border-blue-100">
                      DK
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{featuredArticle.author}</p>
                      <p className="text-[11px] text-slate-500">Instructor / Mentor</p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                    Read Article
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Regular Blog Cards Grid */}
        {gridArticles.length > 0 && (
          <div>
            {showFeaturedHero && (
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900">Latest Articles</h3>
                <span className="text-xs font-medium text-slate-500">{filteredArticles.length} articles available</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {gridArticles.map((article) => (
                <Link
                  key={article.id}
                  to={`/news/${article.id}`}
                  className="bg-white rounded-2xl border border-slate-200/80 hover:border-blue-400 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group"
                >
                  {/* Thumbnail (clean image with subtle category badge) */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                    <img
                      src={article.image}
                      alt={article.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-white/95 backdrop-blur-md text-blue-600 font-bold text-[11px] px-3 py-1 rounded-full shadow-sm">
                        {article.category}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex flex-col flex-1 justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-2.5">
                        <span>{article.date}</span>
                        <span>•</span>
                        <span>{article.readTime} min read</span>
                      </div>

                      <h3 className="text-lg font-bold font-inter text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-2.5">
                        {article.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 font-inter line-clamp-3 leading-relaxed">
                        {article.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 mt-5 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-500 truncate max-w-[150px]">
                        {article.author}
                      </span>
                      <span className="font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform shrink-0">
                        Read More
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredArticles.length === 0 && !loading && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center max-w-md mx-auto my-12">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No articles found</h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-6">
              We couldn't find any articles matching "{search || selectedCategory}".
            </p>
            <button
              onClick={() => {
                setSearch('')
                setSelectedCategory('All')
              }}
              className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Infinite Scroll Sentinel */}
        <div ref={observerTarget} className="py-6 flex items-center justify-center">
          {loading && <DashboardLoading />}
        </div>
      </main>
    </div>
  )
}

export default DashboardNews
