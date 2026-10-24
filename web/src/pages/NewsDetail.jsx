import React, { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchNewsBySlug } from '../redux/slices/newsSlice'
import { gsap } from 'gsap'
import { useLanguage } from '../context/LanguageContext'
import { getMediaUrl } from '../utils/apiConfig'

// Escape plain text for safe embedding into generated HTML
const escapeHtml = (text = '') =>
  String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const getContentImageUrl = (path) => getMediaUrl(path, '', '')

// Render EditorJS blocks into plain HTML
const renderEditorJSBlocks = (blocks) => {
  if (!Array.isArray(blocks)) return ''

  return blocks
    .map((block) => {
      switch (block.type) {
        case 'paragraph':
          return `<p class="mb-4 text-slate-700 leading-relaxed">${block.data?.text || ''}</p>`
        case 'header': {
          const level = block.data?.level || 2
          return `<h${level} class="mb-4 mt-6 font-bold text-slate-900 text-xl md:text-2xl">${block.data?.text || ''}</h${level}>`
        }
        case 'list': {
          const items = Array.isArray(block.data?.items) ? block.data.items : []
          const listTag = block.data?.style === 'ordered' ? 'ol' : 'ul'
          const listClass = listTag === 'ol' ? 'list-decimal ml-6 mb-4 space-y-1' : 'list-disc ml-6 mb-4 space-y-1'
          
          const renderList = (listArr) => {
            return listArr.map((item) => {
              const text = typeof item === 'object' && item !== null
                ? (item.content ?? item.text ?? item.title ?? item.value ?? '')
                : String(item ?? '')
              const nestedHtml = (item && typeof item === 'object' && Array.isArray(item.items) && item.items.length > 0)
                ? `<${listTag} class="${listClass} mt-2">${renderList(item.items)}</${listTag}>`
                : ''
              return `<li class="mb-2 text-slate-700">${text}${nestedHtml}</li>`
            }).join('')
          }

          return `<${listTag} class="${listClass}">${renderList(items)}</${listTag}>`
        }
        case 'checklist': {
          const items = Array.isArray(block.data?.items) ? block.data.items : []
          const listItems = items.map(item => {
            const text = typeof item === 'object' && item !== null
              ? (item.text || item.content || '')
              : String(item || '')
            const checked = Boolean(item?.checked)
            return `<li class="mb-2 flex items-center gap-2 text-slate-700">
              <input type="checkbox" disabled ${checked ? 'checked' : ''} class="rounded text-[#3498db]" />
              <span>${text}</span>
            </li>`
          }).join('')
          return `<ul class="list-none ml-2 mb-4 space-y-1">${listItems}</ul>`
        }
        case 'table': {
          const content = Array.isArray(block.data?.content) ? block.data.content : []
          if (content.length === 0) return ''
          const rows = content.map((row) => {
            const cells = Array.isArray(row) 
              ? row.map(c => {
                  const cellText = typeof c === 'object' && c !== null ? (c.content || c.text || '') : String(c || '')
                  return `<td class="border border-slate-200 px-3 py-2 text-sm text-slate-700">${cellText}</td>`
                }).join('') 
              : ''
            return `<tr>${cells}</tr>`
          }).join('')
          return `<div class="overflow-x-auto my-4"><table class="min-w-full border-collapse border border-slate-200"><tbody>${rows}</tbody></table></div>`
        }
        case 'code': {
          const code = block.data?.code || ''
          return `<pre class="bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto my-4 text-sm font-mono"><code>${escapeHtml(code)}</code></pre>`
        }
        case 'delimiter': {
          return `<hr class="my-6 border-slate-200" />`
        }
        case 'quote': {
          const caption = block.data?.caption
          return `<blockquote class="border-l-4 border-[#3498db] pl-4 py-2 my-4 italic text-slate-700 bg-[#3498db]/5 rounded-r-xl"><p class="mb-2">${block.data?.text || ''}</p>${caption ? `<cite class="text-sm text-slate-500 not-italic">— ${escapeHtml(caption)}</cite>` : ''}</blockquote>`
        }
        case 'image': {
          const url = getContentImageUrl(block.data?.file?.url || block.data?.url)
          if (!url) return ''
          const caption = block.data?.caption || ''
          return `<figure class="my-6"><img src="${url}" alt="${escapeHtml(caption || 'Image')}" class="w-full h-auto rounded-xl shadow-lg" loading="lazy" />${caption ? `<figcaption class="mt-2 text-sm text-center text-slate-500 italic">${escapeHtml(caption)}</figcaption>` : ''}</figure>`
        }
        case 'video': {
          const url = getContentImageUrl(block.data?.url || block.data?.file?.url)
          if (!url) return ''
          return `<div class="my-6 relative w-full" style="padding-bottom: 56.25%;"><video src="${url}" controls class="absolute top-0 left-0 w-full h-full rounded-xl"></video></div>`
        }
        case 'youtube': {
          const videoId = block.data?.videoId
          if (!videoId) return ''
          return `<div class="my-6 relative w-full" style="padding-bottom: 56.25%;"><iframe src="https://www.youtube.com/embed/${escapeHtml(videoId)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="absolute top-0 left-0 w-full h-full rounded-xl"></iframe></div>`
        }
        case 'twitter':
        case 'facebook': {
          const embedUrl = block.data?.url
          if (!embedUrl) return ''
          return `<div class="my-6"><iframe src="${escapeHtml(embedUrl)}" class="w-full min-h-[400px] rounded-xl" frameborder="0"></iframe></div>`
        }
        default:
          return ''
      }
    })
    .join('')
}

// Convert blog content (HTML string, EditorJS JSON string, object, or block array) to HTML
const renderContentToHtml = (content) => {
  if (!content) return ''

  if (typeof content === 'object') {
    if (Array.isArray(content)) {
      if (content.length > 0 && content[0]?.type) return renderEditorJSBlocks(content)
      return content.map(renderContentToHtml).join('')
    }
    if (Array.isArray(content.blocks)) return renderEditorJSBlocks(content.blocks)
    return ''
  }

  const trimmed = content.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return renderContentToHtml(JSON.parse(trimmed))
    } catch {
      // Not valid JSON — treat as plain HTML string
    }
  }
  return content
}

const NewsDetail = () => {
  const { id: slug } = useParams()
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const { currentNews: articleData, loading } = useSelector((state) => state.news)
  const authUser = useSelector((state) => state.auth?.user)
  const containerRef = useRef(null)
  
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState([])
  const [copied, setCopied] = useState(false)

  const handlePostComment = () => {
    if (!comment.trim()) return
    
    const newComment = {
      id: Date.now(),
      text: comment.trim(),
      author: authUser?.name || authUser?.fullName || "Learner",
      date: "Just now"
    }
    
    setComments([newComment, ...comments])
    setComment('')
  }

  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
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
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.08 }
        )
      }, containerRef)

      return () => ctx.revert()
    }
  }, [articleData])

  if (loading && !articleData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pt-28">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#3498db]/30 border-t-[#3498db] rounded-full animate-spin" />
          <p className="font-inter text-xs text-slate-500 font-medium">Loading article...</p>
        </div>
      </div>
    )
  }

  if (!articleData) return null

  // Calculate read time
  const rawText = typeof articleData.content === 'string' ? articleData.content.replace(/<[^>]*>?/gm, '') : ''
  const words = rawText.trim().split(/\s+/).filter(Boolean).length
  const readTime = Math.max(1, Math.ceil(words / 180)) + ' min read'

  // Map API data
  const article = {
    category: (typeof articleData.categories?.[0] === 'string' ? articleData.categories[0] : '') || "Data Analytics",
    title: articleData.title,
    date: new Date(articleData.publishedAt || articleData.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    time: new Date(articleData.publishedAt || articleData.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    views: articleData.stats?.views >= 1000 ? (articleData.stats.views / 1000).toFixed(1) + 'K' : (articleData.stats?.views || '0'),
    commentsCount: articleData.comments?.length || 0,
    image: getMediaUrl(articleData.imageUrl || articleData.coverImage || articleData.image, 'news', ''),
    intro: articleData.summary?.replace(/<[^>]*>?/gm, '')?.replace('[&hellip;]', '...')?.trim(),
    content: renderContentToHtml(articleData.content)
  }

  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 pt-28 md:pt-36 pb-24 px-4 sm:px-6 lg:px-8 font-inter">
      <div className="max-w-3xl mx-auto">
        
        {/* 1. Breadcrumbs */}
        <nav className="detail-reveal flex items-center gap-2 text-xs text-slate-500 mb-6 font-medium">
          <Link to="/" className="hover:text-[#3498db] transition-colors">Home</Link>
          <span className="text-slate-300">/</span>
          <Link to="/blogs" className="hover:text-[#3498db] transition-colors">Blogs</Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 font-semibold truncate max-w-[220px] sm:max-w-sm">{article.title}</span>
        </nav>

        {/* 2. Article Header */}
        <header className="flex flex-col gap-5 mb-8">
          <div className="detail-reveal">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3498db]/10 border border-[#3498db]/20 text-[#2980b9] text-xs font-bold uppercase tracking-wider">
              {article.category}
            </span>
          </div>

          <h1 className="detail-reveal font-inter font-extrabold text-2xl sm:text-4xl md:text-5xl text-slate-900 leading-[1.25] tracking-tight">
            {article.title}
          </h1>

          {/* Author & Metadata Bar */}
          <div className="detail-reveal flex flex-wrap items-center justify-between gap-4 py-4 border-y border-slate-200/90 mt-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#3498db] to-[#1f6696] text-white font-bold flex items-center justify-center text-xs shadow-sm">
                DK
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Data Knowledge Editorial</p>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <span>{article.date}</span>
                  <span>•</span>
                  <span>{readTime}</span>
                  <span>•</span>
                  <span>{article.views} reads</span>
                </div>
              </div>
            </div>

            {/* Social Share Pills */}
            <div className="flex items-center gap-1.5">
              {/* WhatsApp */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(article.title + ' ' + currentUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Share on WhatsApp"
                className="w-8 h-8 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-colors border border-emerald-200"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.52 3.48A11.85 11.85 0 0 0 12.05 0C5.46 0 .1 5.36.1 11.95c0 2.1.55 4.15 1.6 5.96L0 24l6.26-1.64a11.9 11.9 0 0 0 5.79 1.48h.01c6.59 0 11.95-5.36 11.95-11.95 0-3.19-1.24-6.19-3.49-8.41zm-8.47 18.36h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.72.97.99-3.62-.23-.37a9.89 9.89 0 0 1-1.52-5.28c0-5.46 4.45-9.91 9.92-9.91 2.65 0 5.14 1.03 7.01 2.9a9.85 9.85 0 0 1 2.9 7.01c0 5.46-4.45 9.89-9.94 9.89z"/>
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Share on LinkedIn"
                className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center justify-center transition-colors border border-blue-200"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/>
                </svg>
              </a>

              {/* Twitter / X */}
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(article.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Share on X"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center transition-colors border border-slate-200"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              {/* Copy Link */}
              <button
                type="button"
                onClick={handleCopyLink}
                title="Copy Article Link"
                className="relative inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors border border-slate-200 cursor-pointer"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                </svg>
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* 3. Hero Image (if available) */}
        {article.image && (
          <div className="detail-reveal w-full rounded-2xl sm:rounded-3xl overflow-hidden mb-10 border border-slate-200/80 shadow-md">
            <img 
              src={article.image} 
              referrerPolicy="no-referrer"
              className="w-full h-auto max-h-[460px] object-cover" 
              alt={article.title}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* 4. Executive Summary / Key Takeaways Box */}
        {article.intro && (
          <div className="detail-reveal mb-10 bg-gradient-to-r from-blue-50/90 via-sky-50/60 to-blue-50/90 border border-blue-200/80 rounded-2xl p-6 sm:p-7 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#3498db] flex items-center justify-center shrink-0 border border-blue-200">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <div className="space-y-1">
              <h2 className="font-inter text-xs font-bold uppercase tracking-wider text-[#2980b9]">Key Summary</h2>
              <p className="font-inter text-base sm:text-lg text-slate-800 leading-relaxed font-medium">
                {article.intro}
              </p>
            </div>
          </div>
        )}

        {/* 5. Article Prose Content */}
        <article className="detail-reveal bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 md:p-12 shadow-sm mb-12">
          <div 
            className="news-content-html text-slate-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </article>

        {/* 6. Discussion / Comments Card */}
        <section className="detail-reveal bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-sm mb-12">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-[#3498db] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </div>
            <h2 className="font-inter text-lg sm:text-xl font-bold text-slate-900">
              Discussion & Perspectives ({comments.length})
            </h2>
          </div>

          {/* Comment input area */}
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 mt-1">
                {authUser?.name ? authUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex-1 space-y-3">
                <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts, ask a question, or add your perspective on this topic..."
                  rows="3"
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl p-4 font-inter text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#3498db] focus:ring-4 focus:ring-[#3498db]/10 transition-all outline-none resize-none shadow-sm"
                />
                <div className="flex justify-end">
                  <button 
                    type="button"
                    onClick={handlePostComment}
                    disabled={!comment.trim()}
                    className="px-6 py-2.5 bg-[#3498db] hover:bg-[#2980b9] disabled:opacity-50 disabled:cursor-not-allowed text-white font-inter text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-2"
                  >
                    <span>Post Comment</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-[#3498db] font-bold text-xs flex items-center justify-center shrink-0">
                  {c.author.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 text-xs sm:text-sm">{c.author}</span>
                    <span className="text-[11px] text-slate-400">{c.date}</span>
                  </div>
                  <p className="font-inter text-sm text-slate-700 leading-relaxed">
                    {c.text}
                  </p>
                </div>
              </div>
            ))}

            {comments.length === 0 && (
              <div className="text-center py-8 px-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                <p className="font-inter text-xs sm:text-sm text-slate-500">
                  No comments yet. Be the first to share your perspective!
                </p>
              </div>
            )}
          </div>
        </section>

        {/* 7. Bottom Navigation */}
        <div className="detail-reveal flex items-center justify-center pt-4">
          <Link 
            to="/blogs"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-[#3498db] hover:border-[#3498db]/40 shadow-sm transition-all font-inter text-xs font-bold uppercase tracking-wider group"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:-translate-x-1 transition-transform">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>{t('backToBlogs') || t('backToNews') || 'Back to all blogs'}</span>
          </Link>
        </div>

      </div>
    </div>
  )
}

export default NewsDetail
