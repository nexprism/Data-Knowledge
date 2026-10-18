import React, { useEffect, useRef, useState } from 'react'
import EmojiPicker from 'emoji-picker-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useDispatch, useSelector } from 'react-redux'
import { fetchThreads, createThread, fetchForumTags, likeThread, postReply } from '../redux/slices/forumSlice'
import CreateTopicModal from '../components/dashboard/CreateTopicModal'
import { useLanguage } from '../context/LanguageContext'
import { getImageBaseUrl } from '../utils/apiConfig'

gsap.registerPlugin(ScrollTrigger)

const Forum = () => {
  const containerRef = useRef(null)
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [fullImageUrl, setFullImageUrl] = useState(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const { threads, loading, total, currentPage, totalPages, tags: forumTags } = useSelector((state) => state.forum)
  const user = useSelector((state) => state.auth?.user)
  const loaderRef = useRef(null)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const mobileFilterRef = useRef(null)

  useEffect(() => {
    dispatch(fetchThreads({ page: 1, limit: 10 }))
    dispatch(fetchForumTags())
  }, [dispatch])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading && currentPage < totalPages) {
        dispatch(fetchThreads({ page: currentPage + 1, limit: 10 }))
      }
    }, { threshold: 0.1 })

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current)
      }
    }
  }, [dispatch, loading, currentPage, totalPages])



  useEffect(() => {
    if (isMobileFilterOpen) {
      gsap.to(mobileFilterRef.current, {
        height: 'auto',
        opacity: 1,
        duration: 0.6,
        ease: 'power3.out'
      })
    } else {
      gsap.to(mobileFilterRef.current, {
        height: 0,
        opacity: 0,
        duration: 0.4,
        ease: 'power3.in'
      })
    }
  }, [isMobileFilterOpen])

  if (loading && (!threads || threads.length === 0)) {
    return (
      <div className="min-h-screen bg-dark flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  const timeAgo = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now - date) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const mapReplies = (replies) => {
      if (!replies) return [];
      return replies.map(r => ({
          id: r._id || Math.random().toString(),
          author: r.repliedBy?.fullName || 'Anonymous',
          role: r.repliedBy?.role?.substring(0, 2)?.toUpperCase() || 'US',
          profilePicture: r.repliedBy?.profilePicture,
          time: timeAgo(r.createdAt),
          content: r.content || '',
          replies: mapReplies(r.nestedReplies || [])
      }))
  }

  const questions = (Array.isArray(threads) ? threads : []).map((thread) => ({
      id: thread._id,
      author: thread.createdBy?.fullName || 'Anonymous',
      authorRole: thread.createdBy?.role === 'admin' ? 'ADMIN' : 'OP',
      profilePicture: thread.createdBy?.profilePicture,
      time: timeAgo(thread.createdAt),
      category: thread.tags?.[0] || 'GENERAL',
      allTags: thread.tags || [],
      title: thread.title,
      content: thread.content,
      attachments: thread.attachments || [],
      likes: thread.likeCount || 0,
      likesArray: thread.likes || [],
      repliesCount: thread.replies?.length || 0,
      replies: mapReplies(thread.replies)
  }))

  const dynamicTags = (forumTags.length > 0 ? forumTags : threads.flatMap((thread) => thread.tags || []))
    .map((tag) => String(tag).startsWith('#') ? String(tag) : `#${tag}`)
    .filter((tag, index, allTags) => allTags.indexOf(tag) === index)
    .slice(0, 10)
  const activeUsers = new Set(threads.map((thread) => thread.createdBy?._id || thread.createdBy).filter(Boolean)).size
  const weeklyTopics = threads.filter((thread) => (
    thread.createdAt && Date.now() - new Date(thread.createdAt).getTime() <= 7 * 24 * 60 * 60 * 1000
  )).length
  const stats = [
    { label: 'TOTAL TOPICS', value: total || '0' },
    { label: 'ACTIVE USERS', value: activeUsers },
    { label: 'THIS WEEK', value: weeklyTopics }
  ]
  const tags = dynamicTags
  const discourseTags = dynamicTags

const QuestionCard = ({ question }) => {
    const { t } = useLanguage()
    const [isOpen, setIsOpen] = useState(false)
    const [likesCount, setLikesCount] = useState(typeof question.likes === 'string' ? parseInt(question.likes.replace('K', '')) * 1000 : question.likes)
    const [dislikesCount, setDislikesCount] = useState(0)
    const [sentiment, setSentiment] = useState(question.likesArray?.includes(user?._id) ? 'like' : null) // 'like', 'dislike', or null
    const [replyingTo, setReplyingTo] = useState(null) // { name: string, parentId: number }
    const [repliesList, setRepliesList] = useState(question.replies)
    const [replyText, setReplyText] = useState('')
    const [showEmoji, setShowEmoji] = useState(false)
    const [repliesCount, setRepliesCount] = useState(parseInt(question.repliesCount) || 0)

    const contentRef = useRef(null)
    const replyFormRef = useRef(null)

    useEffect(() => {
      if (isOpen) {
        gsap.to(contentRef.current, {
          height: 'auto',
          opacity: 1,
          duration: 0.8,
          ease: 'power3.inOut'
        })
        gsap.fromTo(gsap.utils.toArray('.discussion-reveal', contentRef.current), 
          { y: 20, opacity: 0, filter: 'blur(10px)' },
          { y: 0, opacity: 1, filter: 'blur(0px)', stagger: 0.05, duration: 1.2, ease: 'expo.out' }
        )
      } else {
        gsap.to(contentRef.current, {
          height: 0,
          opacity: 0,
          duration: 0.6,
          ease: 'power3.inOut'
        })
      }
    }, [isOpen])

    const handleSentiment = async (type) => {
      if (type !== 'like' || !question.id) return
      try {
        const result = await dispatch(likeThread(question.id)).unwrap()
        const updatedThread = result?.data || result
        const updatedLikes = updatedThread?.likeCount
        if (typeof updatedLikes === 'number') setLikesCount(updatedLikes)
        setSentiment(updatedThread?.likes?.includes(user?._id) ? 'like' : null)
      } catch {
        // Keep the server-backed state unchanged when the request fails.
      }
    }

    const handleReplyClick = (author, parentId) => {
      setReplyingTo({ name: author, parentId: parentId })
      setIsOpen(true)
      setTimeout(() => {
        replyFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 500)
    }

    const handlePublish = async () => {
        if (!replyText.trim()) return
        try {
          const result = await dispatch(postReply({
            threadId: question.id,
            content: replyText,
            parentReplyId: replyingTo?.parentId || null
          })).unwrap()
          const reply = result?.data
          const newReply = reply ? mapReplies([reply])[0] : null
          if (!newReply) return
          if (replyingTo?.parentId) {
              setRepliesList(prev => prev.map(comment => comment.id === replyingTo.parentId
                ? { ...comment, replies: [...(comment.replies || []), newReply] }
                : comment))
          } else {
              setRepliesList(prev => [...prev, newReply])
          }
          setRepliesCount(prev => prev + 1)
          setReplyText('')
          setReplyingTo(null)
        } catch {
          // The API error is kept in Redux; do not show an unpersisted reply.
        }
    }

    const formatCount = (count) => {
      if (count >= 1000) return (count / 1000).toFixed(1) + 'K'
      return count
    }

    return (
      <div className="forum-reveal bg-white border border-slate-200/80 hover:border-amber-400 p-6 md:p-8 mb-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 relative group">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            {question.profilePicture && question.profilePicture !== 'default-profile.png' ? (
              <img 
                src={(() => {
                    const pic = question.profilePicture;
                    if (!pic) return '/news_placeholder.png';
                    if (pic.startsWith('http')) return pic;
                    const baseUrl = getImageBaseUrl();
                    return `${baseUrl}/uploads/profiles/${pic}`;
                })()} 
                alt={question.author}
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
            ) : null}
            {(!question.profilePicture || question.profilePicture === 'default-profile.png') && (
              <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 font-montserrat font-black text-sm">
                {question.author?.charAt(0)?.toUpperCase()}
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              <span className="font-montserrat text-xs font-bold text-amber-800 tracking-wider uppercase">{question.authorRole} / {question.author}</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="space-y-3">
              <h2 className="font-inter text-xl md:text-2xl leading-snug text-slate-900 font-bold group-hover:text-[#3498db] transition-colors">
                {question.title}
              </h2>
              {/* Render All Tags */}
              {question.allTags && question.allTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {question.allTags.map((tag, idx) => (
                    <span key={idx} className="px-3 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 font-jetbrains text-[10px] font-black uppercase tracking-wider rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            {question.content && (
              <p className="font-jetbrains text-xs leading-relaxed text-slate-600 font-medium max-w-4xl line-clamp-3">
                {question.content}
              </p>
            )}

            {/* Image Attachments Protocol */}
            {question.attachments && question.attachments.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {question.attachments.filter(att => {
                  const path = typeof att === 'string' ? att : (att.type || '');
                  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(path);
                }).map((att, idx) => {
                  const path = typeof att === 'string' ? att : (att.type || '');
                  const fullUrl = path.startsWith('http') ? path : `${getImageBaseUrl()}/${path.startsWith('uploads/') ? path : `uploads/forum/${path}`}`;
                  
                  return (
                    <div key={idx} className="attachment-item relative aspect-video bg-slate-100 border border-slate-200 rounded-xl overflow-hidden group/img shadow-sm">
                      <img 
                        src={fullUrl} 
                        alt={`Attachment ${idx}`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105"
                        onError={(e) => {
                          e.target.closest('.attachment-item').style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <button 
                          onClick={() => setFullImageUrl(fullUrl)}
                          className="p-3 bg-amber-400 text-slate-950 rounded-full shadow-md"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-6">
              {/* Like / Dislike Sentiment */}
              <div className="flex items-center gap-3">
                 <button 
                     onClick={() => handleSentiment('like')}
                     className={`w-9 h-9 flex items-center justify-center rounded-full transition-all border ${sentiment === 'like' ? 'bg-amber-400 border-amber-400 text-slate-950 shadow-sm' : 'border-slate-200 text-slate-600 hover:border-amber-400 hover:text-amber-700 bg-slate-50'}`}
                 >
                     <svg width="14" height="14" viewBox="0 0 24 24" fill={sentiment === 'like' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5"><path d="M7 11V19H17C17.55 19 18 18.55 18 18V9C18 8.45 17.55 8 17 8H12.67L13.12 4.41C13.19 3.84 12.79 3.32 12.22 3.25C12.15 3.24 12.07 3.24 12 3.24C11.55 3.24 11.13 3.42 10.82 3.73L7 7.56V11H7Z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                 </button>
                 <span className="font-montserrat text-xs font-bold text-slate-900">{formatCount(likesCount)}</span>
                 
                 <button 
                     onClick={() => handleSentiment('dislike')}
                     className={`w-9 h-9 flex items-center justify-center rounded-full transition-all border ${sentiment === 'dislike' ? 'bg-red-500 border-red-500 text-white' : 'border-slate-200 text-slate-600 hover:border-red-400 hover:text-red-600 bg-slate-50'}`}
                 >
                     <svg width="14" height="14" viewBox="0 0 24 24" fill={sentiment === 'dislike' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" className="rotate-180"><path d="M7 11V19H17C17.55 19 18 18.55 18 18V9C18 8.45 17.55 8 17 8H12.67L13.12 4.41C13.19 3.84 12.79 3.32 12.22 3.25C12.15 3.24 12.07 3.24 12 3.24C11.55 3.24 11.13 3.42 10.82 3.73L7 7.56V11H7Z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                 </button>
                 <span className="font-montserrat text-xs font-bold text-slate-900">{formatCount(dislikesCount)}</span>
              </div>

              {/* Replies Toggle Counter */}
              <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-full font-montserrat text-xs font-bold text-slate-700 transition-all"
              >
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                 <span>{repliesCount} REPLIES</span>
              </button>
            </div>
            <div className="flex items-center gap-6">
              <span className="hidden md:inline text-description font-jetbrains text-lg tracking-[0.5em]">...</span>
              <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-10 h-10 border border-accent rounded-full flex items-center justify-center text-accent transition-transform duration-500 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
              >
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 14l-7 7-7-7M12 3v18" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Replies Section Wrapper */}
        <div 
          ref={contentRef} 
          className="overflow-hidden" 
          style={{ height: 0, opacity: 0 }}
        >
          <div className="mt-12 pt-12 border-t border-white/10">
            <h3 className="font-montserrat text-[14px] font-bold tracking-[0.3em] uppercase text-normal mb-10">
              DISCOURSE ON THIS TOPIC
            </h3>

            <div className="flex flex-col gap-12">
              {repliesList.map((reply) => (
                <div key={reply.id} className="discussion-reveal flex flex-col gap-8">
                  {/* Parent Reply */}
                  <div className="flex gap-4 group">
                    {reply.profilePicture && reply.profilePicture !== 'default-profile.png' ? (
                      <img 
                        src={(() => {
                            const pic = reply.profilePicture;
                            if (!pic) return '/news_placeholder.png';
                            if (pic.startsWith('http')) return pic;
                            const baseUrl = getImageBaseUrl();
                            return `${baseUrl}/uploads/profiles/${pic}`;
                        })()} 
                        alt={reply.author}
                        className="flex-shrink-0 w-8 h-8 rounded-full object-cover border border-white/10"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    ) : null}
                    {(!reply.profilePicture || reply.profilePicture === 'default-profile.png') && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-jetbrains text-[9px] text-description/80">
                        {reply.role || '?'}
                      </div>
                    )}
                    <div className="flex flex-col gap-3 flex-grow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="font-montserrat text-[14px] font-bold text-normal tracking-widest">{reply.author}</span>
                            <span className="font-jetbrains text-[9px] text-description/80">{reply.time}</span>
                        </div>
                      </div>
                      <p className="font-jetbrains text-[11px] leading-relaxed text-description tracking-wide max-w-2xl text-balance">
                        {reply.content}
                      </p>
                      <button 
                        onClick={() => handleReplyClick(reply.author, reply.id)}
                        className="self-start font-jetbrains text-[9px] font-bold text-accent tracking-[0.2em] uppercase hover:opacity-70 transition-opacity"
                      >
                        REPLY TO {reply.author.split('_')[0]}
                      </button>
                    </div>
                  </div>

                  {/* Nested Replies */}
                  {reply.replies && reply.replies.length > 0 && (
                    <div className="flex flex-col ml-8 pl-8 border-l border-white/5 gap-12 mt-2">
                      {reply.replies.map((nested) => (
                        <div key={nested.id} className="discussion-reveal flex gap-4 group">
                          {nested.profilePicture && nested.profilePicture !== 'default-profile.png' ? (
                            <img 
                              src={(() => {
                                  const pic = nested.profilePicture;
                                  if (!pic) return '/news_placeholder.png';
                                  if (pic.startsWith('http')) return pic;
                                  const baseUrl = getImageBaseUrl();
                                  return `${baseUrl}/uploads/profiles/${pic}`;
                              })()} 
                              alt={nested.author}
                              className="flex-shrink-0 w-8 h-8 rounded-full object-cover border border-white/10"
                              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            />
                          ) : null}
                          {(!nested.profilePicture || nested.profilePicture === 'default-profile.png') && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-jetbrains text-[9px] text-description/80">
                              {nested.role}
                            </div>
                          )}
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                              <span className="font-montserrat text-[14px] font-bold text-normal tracking-widest">{nested.author}</span>
                              <span className="font-jetbrains text-[9px] text-description/80">{nested.time}</span>
                            </div>
                            <p className="font-jetbrains text-[11px] leading-relaxed text-description tracking-wide max-w-2xl">
                              {nested.content}
                            </p>
                            <button 
                                onClick={() => handleReplyClick(nested.author, reply.id)}
                                className="self-start font-jetbrains text-[9px] font-bold text-accent tracking-[0.2em) uppercase hover:opacity-70 transition-opacity"
                            >
                                REPLY TO {nested.author.split(' ')[0]}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Post Reply Form */}
            <div ref={replyFormRef} className="discussion-reveal mt-20 bg-white/[0.01] border border-white/5 p-8 flex flex-col gap-8 transition-all">
              <div className="flex items-center justify-between">
                <h4 className="font-montserrat text-[14px] font-bold tracking-[0.3em] uppercase text-normal">{t('postReply')}</h4>
                {replyingTo && (
                  <div className="flex items-center gap-3 px-4 py-2 bg-accent/10 border border-accent/20 rounded-full">
                    <span className="font-jetbrains text-[9px] text-accent tracking-widest uppercase">REPLYING TO @{replyingTo.name}</span>
                    <button onClick={() => setReplyingTo(null)} className="text-accent hover:text-white transition-colors">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                )}
              </div>
              <textarea 
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={replyingTo ? `Write your response to ${replyingTo.name}...` : "Share your perspective..."}
                className="w-full bg-transparent border border-slate-200 rounded-xl p-4 outline-none font-inter text-sm text-slate-900 placeholder:text-slate-400 min-h-[120px] resize-none focus:border-[#3498db]"
              />
              <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                  <div className="relative">
                      <button 
                        onClick={() => setShowEmoji(!showEmoji)}
                        className={`text-description/80 hover:text-accent transition-colors ${showEmoji ? 'text-accent' : ''}`}
                      >
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg>
                      </button>

                      {showEmoji && (
                        <div className="absolute bottom-full left-0 mb-4 z-50 shadow-2xl scale-75 origin-bottom-left">
                           <EmojiPicker 
                              theme="light"
                              onEmojiClick={(emojiData) => {
                                setReplyText(prev => prev + emojiData.emoji)
                                setShowEmoji(false)
                              }}
                              lazyLoadEmojis={true}
                              searchDisabled={true}
                              skinTonesDisabled={true}
                              previewConfig={{ showPreview: false }}
                              height={400}
                              width={300}
                           />
                        </div>
                      )}
                  </div>

                  <button 
                    onClick={handlePublish}
                    className="px-8 py-4 bg-accent text-slate-950 font-black font-jetbrains text-[9px] tracking-[0.3em] uppercase hover:brightness-105 transition-all"
                  >
                    PUBLISH
                  </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-dark pt-44 pb-28 px-4 md:px-12 lg:px-20 overflow-x-clip">
      
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
          
          {/* Main Content (Left) - FAQ / Q&A List */}
          <div className="lg:col-span-8">
             
             {/* Mobile Filter Button */}
             <div className="lg:hidden mb-12">
                <button 
                    onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                    className="w-full flex items-center justify-between p-7 border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 flex items-center justify-center border border-white/10 rounded-full group-hover:border-accent group-hover:text-accent transition-all">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16m-7 6h7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                        <span className="font-montserrat text-[14px] font-bold text-accent tracking-[0.3em] uppercase">FILTERS & STATS</span>
                    </div>
                    <div className={`transition-transform duration-500 transform ${isMobileFilterOpen ? 'rotate-180' : ''}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                </button>

                <div ref={mobileFilterRef} className="overflow-hidden h-0 opacity-0 bg-white/[0.01] border-x border-b border-white/5">
                    <div className="p-8 flex flex-col gap-14">
                        {/* Tags */}
                        <div className="flex flex-col gap-6">
                            <h4 className="font-jetbrains text-[9px] font-bold text-description/80 tracking-[0.3em] uppercase underline underline-offset-8 decoration-accent/30">{t('popularTags')}</h4>
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag) => (
                                    <button key={tag} className="px-4 py-2 border border-white/10 font-jetbrains text-[8px] text-description hover:text-accent hover:border-accent transition-all uppercase tracking-widest">
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex flex-col gap-6">
                            <h4 className="font-jetbrains text-[9px] font-bold text-description/80 tracking-[0.3em] uppercase underline underline-offset-8 decoration-accent/30">{t('forumStats')}</h4>
                            <div className="grid grid-cols-1 gap-1 border-t border-white/5">
                                {stats.map((stat) => (
                                    <div key={stat.label} className="flex items-center justify-between py-4 border-b border-white/5">
                                        <span className="font-jetbrains text-[9px] text-description uppercase">{stat.label}</span>
                                        <span className="font-jetbrains text-lg font-bold text-normal">{stat.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Discourse */}
                        <div className="flex flex-col gap-6">
                            <h4 className="font-jetbrains text-[9px] font-bold text-description/80 tracking-[0.3em] uppercase underline underline-offset-8 decoration-accent/30">{t('popularDiscourse')}</h4>
                            <div className="flex flex-wrap gap-2">
                                {discourseTags.map((tag) => (
                                    <button key={tag} className="px-4 py-2 border border-white/5 font-jetbrains text-[8px] text-description hover:text-normal transition-all uppercase tracking-widest">
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
             </div>

             <div className="flex flex-col gap-6">
                {questions.length === 0 && !loading && (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-60 border border-white/5 bg-white/[0.02] rounded-xl">
                    <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center mb-6">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    </div>
                    <h3 className="font-inter font-bold text-2xl text-slate-900 mb-2">No Discussions Yet</h3>
                    <p className="font-jetbrains text-[9px] text-description uppercase tracking-widest">Be the first to start a new topic.</p>
                  </div>
                )}
                {questions.map((q) => (
                  <QuestionCard key={q.id} question={q} />
                ))}

                {/* Scroll Sentinel */}
                <div ref={loaderRef} className="py-10 flex justify-center">
                    {loading && (
                      <div className="flex items-center justify-center py-6">
                        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                </div>
             </div>
          </div>

          {/* Sidebar (Right) - Desktop Only */}
          <div className="hidden lg:flex lg:col-span-4 h-full flex-col gap-20">
            
             <div className="sticky top-36 h-fit">
                {/* Widget: Create Topic CTA */}
                <div className="sidebar-reveal mb-12">
                   <button 
                     onClick={() => setIsModalOpen(true)}
                     className="w-full bg-accent text-slate-950 p-8 font-jetbrains text-[11px] font-black uppercase tracking-[0.4em] hover:scale-[1.05] active:scale-95 transition-all shadow-accent-soft flex flex-col items-center gap-4 group rounded-xl"
                   >
                      <div className="w-12 h-12 rounded-full bg-[#4a89ff] flex items-center justify-center text-white shadow-lg group-hover:rotate-90 transition-transform duration-500">
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
                      </div>
                      {t('startNewTopic')}
                      <span className="text-[9px] font-normal tracking-wider opacity-80 normal-case text-center">{t('contributeCollective') || 'Share insights with the community'}</span>
                   </button>
                </div>

                {/* Widget: Popular Tags */}
              <div className="sidebar-reveal flex flex-col mb-12 gap-8">
                <h4 className="font-montserrat text-[14px] font-bold text-accent tracking-[0.3em] uppercase underline underline-offset-8 decoration-accent/30 mb-2">{t('popularTags')}</h4>
                <div className="flex flex-wrap gap-3">
                    {tags.map((tag) => (
                      <button key={tag} className="px-5 py-3 border border-white/10 font-jetbrains text-[9px] text-description hover:text-accent hover:border-accent transition-all uppercase tracking-widest">
                        {tag}
                      </button>
                    ))}
                </div>
              </div>

              {/* Widget: Stats */}
              <div className="sidebar-reveal flex flex-col mb-12 gap-2">
                <h4 className="font-montserrat text-[14px] font-bold text-accent tracking-[0.3em] uppercase underline underline-offset-8 decoration-accent/30 mb-6">{t('forumStats')}</h4>
                <div className="flex flex-col border-t border-white/5">
                    {stats.map((stat) => (
                      <div key={stat.label} className="flex items-center justify-between py-5 border-b border-white/5 group hover:bg-white/[0.01] transition-colors px-2">
                        <span className="font-montserrat text-[14px] text-description group-hover:text-normal transition-colors uppercase tracking-widest">{stat.label}</span>
                        <span className="font-jetbrains text-lg font-bold text-normal">{stat.value}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Widget: Popular Discourse */}
              <div className="sidebar-reveal flex flex-col mb-12 gap-2">
                <h4 className="font-montserrat text-[14px] font-bold text-accent tracking-[0.3em] uppercase opacity-50 mb-6 underline underline-offset-8 decoration-accent/10">{t('popularDiscourse')}</h4>
                <div className="flex flex-wrap gap-3">
                    {discourseTags.map((tag) => (
                      <button key={tag} className="px-5 py-3 border border-white/5 font-jetbrains text-[9px] text-description hover:text-normal transition-all uppercase tracking-widest">
                        {tag}
                      </button>
                    ))}
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>


      <CreateTopicModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={async (data) => {
          const result = await dispatch(createThread(data))
          if (createThread.fulfilled.match(result)) {
             setShowSuccessMessage(true)
             setTimeout(() => setShowSuccessMessage(false), 3000)
             return true
          }
          return false
        }}
      />

      {/* Lightbox Modal */}
      {fullImageUrl && (
        <div className="fixed inset-0 z-[20000] bg-[#0d0d0d]/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-20">
           <button 
             onClick={() => setFullImageUrl(null)}
             className="absolute top-10 left-10 flex items-center gap-4 group z-50"
           >
              <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-accent group-hover:border-accent transition-all">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:text-dark transition-colors"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              </div>
              <span className="font-jetbrains text-[11px] font-bold text-normal tracking-[0.4em] uppercase group-hover:text-accent transition-colors">{t('backToForum')}</span>
           </button>

           <div className="relative w-full h-full flex items-center justify-center">
              <img 
                src={fullImageUrl} 
                alt="Full Preview" 
                className="max-w-full max-h-full object-contain shadow-2xl"
              />
           </div>
        </div>
      )}
      {/* Global Success Notification */}
      {showSuccessMessage && (
        <div className="fixed inset-0 z-[30000] flex items-center justify-center pointer-events-none">
           <div className="bg-accent text-dark px-12 py-8 rounded-sm shadow-[0_30px_100px_rgba(139, 92, 246,0.3)] flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-dark/10 flex items-center justify-center">
                 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div className="text-center">
                 <h3 className="font-inter font-bold text-xl">Topic Published</h3>
                 <p className="font-inter text-xs uppercase tracking-wider opacity-90">Discourse added to community</p>
              </div>
           </div>
        </div>
      )}
    </div>
  )
}

export default Forum
