import React, { useEffect, useRef, useState } from 'react'
import EmojiPicker from 'emoji-picker-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useDispatch, useSelector } from 'react-redux'
import { fetchThreads, fetchForumTags, likeThread, postReply, createThread } from '../redux/slices/forumSlice'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import CreateTopicModal from '../components/dashboard/CreateTopicModal'
import ForumFilterModal from '../components/dashboard/ForumFilterModal'
import DashboardLoading from '../components/dashboard/DashboardLoading'
import { useLanguage } from '../context/LanguageContext'
import { getImageBaseUrl } from '../utils/apiConfig'

gsap.registerPlugin(ScrollTrigger)

const DashboardForum = () => {
  const containerRef = useRef(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [fullImageUrl, setFullImageUrl] = useState(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const { threads, loading, total, currentPage, totalPages, tags: forumTags } = useSelector((state) => state.forum)
  const user = useSelector((state) => state.auth.user)
  const loaderRef = useRef(null)

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

  const tags = (forumTags.length > 0 ? forumTags : threads.flatMap((thread) => thread.tags || []))
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
  const discourseTags = tags

  useEffect(() => {
    window.scrollTo(0, 0)
    if (!loading && threads.length > 0) {
      const ctx = gsap.context(() => {
        // Sidebar Reveal
        gsap.fromTo('.sidebar-dash-reveal',
          { y: 15, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.5,
            ease: 'power2.out',
            stagger: 0.04,
            force3D: true,
            clearProps: 'transform'
          }
        )

        // Content Card Reveal
        gsap.fromTo('.forum-dash-reveal',
          { y: 25, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.7,
            ease: 'expo.out',
            stagger: 0.05,
            delay: 0.05,
            force3D: true,
            clearProps: 'transform'
          }
        )
      }, containerRef)

      return () => ctx.revert()
    }
  }, [loading, threads])

  const QuestionCard = ({ question }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [likesCount, setLikesCount] = useState(typeof question.likes === 'string' ? parseInt(question.likes.replace('K', '')) * 1000 : (question.likes || 0))
    const [dislikesCount, setDislikesCount] = useState(0)
    const [sentiment, setSentiment] = useState(question.likesArray?.includes(user?._id) ? 'like' : null)
    const [repliesList, setRepliesList] = useState(question.replies)
    const [replyText, setReplyText] = useState('')
    const [showEmoji, setShowEmoji] = useState(false)
    const [attachment, setAttachment] = useState(null)
    const [repliesCount, setRepliesCount] = useState(parseInt(question.repliesCount) || 0)

    const fileInputRef = useRef(null)

    const contentRef = useRef(null)

    useEffect(() => {
      if (isOpen) {
        gsap.to(contentRef.current, { height: 'auto', opacity: 1, duration: 0.8, ease: 'power3.inOut' })
      } else {
        gsap.to(contentRef.current, { height: 0, opacity: 0, duration: 0.6, ease: 'power3.inOut' })
      }
    }, [isOpen])

    const handlePostReply = () => {
      if (!replyText.trim()) return;
      dispatch(postReply({
        threadId: question.id,
        content: replyText,
        attachment: attachment
      }))
        .then((res) => {
          if (res.meta.requestStatus === 'fulfilled') {
            setReplyText('')
            setAttachment(null)
            setShowEmoji(false)
            // Optionally update local replies list if the API returns the new reply
            if (res.payload.data) {
              const newReply = {
                id: res.payload.data._id,
                author: user?.fullName || 'Me',
                role: user?.role?.substring(0, 2)?.toUpperCase() || 'ME',
                profilePicture: user?.profilePicture,
                time: 'Just now',
                content: replyText,
                replies: []
              }
              setRepliesList(prev => [...prev, newReply])
              setRepliesCount(prev => prev + 1)
            }
          }
        })
    }

    const formatCount = (count) => {
      if (count >= 1000) return (count / 1000).toFixed(1) + 'K'
      return count
    }

    return (
      <div className="forum-dash-reveal bg-white border border-slate-200/80 hover:border-amber-400 p-6 md:p-8 mb-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 relative group">
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
              <h2 className="font-inter text-2xl md:text-3xl leading-snug text-slate-900 font-bold group-hover:text-amber-600 transition-colors">
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
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-slate-700">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (sentiment === 'like') return;
                    setSentiment('like');
                    setLikesCount(prev => prev + 1);
                    dispatch(likeThread(question.id));
                  }}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all ${sentiment === 'like' ? 'bg-amber-400 border-amber-400 text-slate-950 font-bold' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-amber-400 hover:text-amber-700'}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={sentiment === 'like' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" /></svg>
                  <span className="font-montserrat text-xs font-bold">{formatCount(likesCount)}</span>
                </button>
                <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600 hover:border-amber-400 hover:text-amber-700 transition-all font-montserrat text-xs font-bold uppercase">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  <span>{repliesCount} REPLIES</span>
                </button>
              </div>
            </div>
            <button onClick={() => setIsOpen(!isOpen)} className={`w-9 h-9 flex items-center justify-center border border-slate-200 bg-slate-50 hover:bg-amber-100 rounded-full text-slate-700 transition-transform duration-500 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 14l-7 7-7-7" /></svg>
            </button>
          </div>
        </div>

        <div ref={contentRef} className="overflow-hidden" style={{ height: 0, opacity: 0 }}>
          <div className="mt-10 pt-10 border-t border-white/10 space-y-8">
            {repliesList.map((reply) => (
              <div key={reply.id} className="flex gap-4">
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
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-jetbrains text-[8px] text-accent/60 shrink-0">
                    {reply.author.substring(0, 2)}
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-montserrat text-[14px] font-bold text-normal tracking-widest uppercase">{reply.author}</span>
                    <span className="font-jetbrains text-[8px] text-description/80 uppercase">{reply.time}</span>
                  </div>
                  <p className="font-jetbrains text-[11px] text-description leading-relaxed">{reply.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Post Reply Form */}
          <div className="mt-10 pt-10 border-t border-white/5 space-y-6">
            <div className="relative">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Contribute to this discourse..."
                className="w-full bg-white/[0.01] border border-white/5 p-6 rounded-sm font-jetbrains text-sm text-normal placeholder:text-description/80 min-h-[120px] focus:border-accent/30 transition-all outline-none resize-none"
              />

              <div className="absolute bottom-4 right-4 flex items-center gap-4">
                <div className="flex items-center gap-3 mr-2">
                  {attachment && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-sm">
                      <span className="font-jetbrains text-[9px] text-accent truncate max-w-[100px]">{attachment.name}</span>
                      <button onClick={() => setAttachment(null)} className="text-description hover:text-white">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                      </button>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => setAttachment(e.target.files[0])}
                    className="hidden"
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`text-description/80 hover:text-accent transition-colors ${attachment ? 'text-accent' : ''}`}
                    title="Add attachment"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>
                  </button>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowEmoji(!showEmoji)}
                    className={`text-description/80 hover:text-accent transition-colors ${showEmoji ? 'text-accent' : ''}`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" /></svg>
                  </button>

                  {showEmoji && (
                    <div className="absolute bottom-full right-0 mb-4 z-50 shadow-2xl scale-75 origin-bottom-right">
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
                  onClick={handlePostReply}
                  disabled={!replyText.trim()}
                  className="bg-accent text-slate-950 font-black px-6 py-2 font-jetbrains text-[10px] uppercase tracking-widest hover:brightness-105 disabled:opacity-50 disabled:grayscale transition-all rounded"
                >
                  {t('publishButton')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-dark relative selection:bg-amber-400/30 overflow-x-clip">
      <DashboardHeader />

      <main className="pt-16 pb-16 px-4">
        <div className="mx-auto">

          {/* Top Stats Protocol */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 forum-dash-reveal opacity-0">
            {stats.map((stat, i) => (
              <div key={stat.label} className="bg-white border border-slate-200 p-8 rounded-2xl flex flex-col gap-2 group hover:border-amber-400 shadow-sm transition-all">
                <span className="font-jetbrains text-[9px] text-slate-500 uppercase tracking-[0.4em] group-hover:text-amber-700 transition-colors">{stat.label}</span>
                <span className="font-inter text-4xl text-slate-900 tracking-tighter">{stat.value}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-20">

            {/* Discussion List Area */}
            <div className="md:col-span-8 lg:col-span-8 flex flex-col gap-2">
              <div className="flex items-center justify-between mb-8 forum-dash-reveal opacity-0">
                <h1 className="font-inter text-4xl text-slate-900 font-extralight tracking-tight uppercase">{t('recentDiscourse')}</h1>
                <div className="hidden md:flex items-center gap-4">
                  <span className="font-jetbrains text-[9px] text-slate-400 tracking-widest uppercase">{t('filterByIntelligence')}</span>
                  <div className="h-[1px] w-12 bg-slate-200" />
                </div>
              </div>
              {questions.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-60 forum-dash-reveal">
                  <div className="w-16 h-16 rounded-full border border-slate-300 flex items-center justify-center mb-6">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  </div>
                  <h3 className="font-inter text-3xl text-slate-900 mb-2">No Discussions Yet</h3>
                  <p className="font-jetbrains text-xs text-slate-500 uppercase tracking-widest">Be the first to start a new topic.</p>
                </div>
              )}
              {questions.map((q) => <QuestionCard key={q.id} question={q} />)}

              {/* Scroll Sentinel */}
              <div ref={loaderRef} className="py-10 flex justify-center w-full">
                {loading && <DashboardLoading />}
              </div>
            </div>

            {/* Action Sidebar - Desktop Only (md+) */}
            <div className="hidden md:block md:col-span-4 lg:col-span-4 space-y-12 h-fit md:sticky md:top-36">
              {/* Create Topic CTA */}
              <div className="sidebar-dash-reveal opacity-0">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full bg-accent text-slate-950 p-8 font-jetbrains text-[11px] font-black uppercase tracking-[0.4em] hover:scale-[1.05] active:scale-95 transition-all shadow-accent-soft flex flex-col items-center gap-4 group rounded-2xl"
                >
                  <div className="w-12 h-12 rounded-full bg-[#4a89ff] flex items-center justify-center text-white shadow-lg group-hover:rotate-90 transition-transform duration-500">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14" /></svg>
                  </div>
                  {t('startNewTopic')}
                  <span className="text-[8px] font-normal tracking-[0.2em] opacity-60 normal-case">{t('contributeCollective')}</span>
                </button>
              </div>

              {/* Tags Protocol */}
              <div className="sidebar-dash-reveal opacity-0 space-y-6">
                <h4 className="font-montserrat text-[14px] font-black text-accent tracking-[0.3em] uppercase underline underline-offset-8 decoration-accent/20">{t('popularTags')}</h4>
                <div className="flex flex-wrap gap-2 pt-2">
                  {tags.map((tag) => (
                    <button key={tag} className="px-4 py-2 border border-white/50 font-jetbrains text-[8px] text-normal hover:text-accent hover:border-accent transition-all uppercase tracking-widest rounded-sm">
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Discourse Protocol */}
              <div className="sidebar-dash-reveal opacity-0 space-y-6">
                <h4 className="font-montserrat text-[14px] font-black text-normal tracking-[0.3em] uppercase opacity-40">{t('intelligenceNetwork')}</h4>
                <p className="font-jetbrains text-[9px] text-description/80 leading-relaxed uppercase tracking-wider">
                  Connected intelligence from 1,254 active carrier units. Share your perspective, upload attachments, and calibrate with the community.
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>

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

      <ForumFilterModal
        stats={stats}
        tags={tags}
        discourseTags={discourseTags}
        onStartTopic={() => setIsModalOpen(true)}
      />
      {/* Lightbox Modal */}
      {fullImageUrl && (
        <div className="fixed inset-0 z-[20000] bg-[#0d0d0d]/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-20">
          <button
            onClick={() => setFullImageUrl(null)}
            className="absolute top-10 left-10 flex items-center gap-4 group z-50"
          >
            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-accent group-hover:border-accent transition-all">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:text-dark transition-colors"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
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
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <div className="text-center">
              <h3 className="font-inter text-2xl">Topic Published</h3>
              <p className="font-jetbrains text-[9px] uppercase tracking-[0.3em] opacity-70">Discourse added to terminal</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardForum;
