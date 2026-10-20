import React, { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import authorizedFetch, { parseApiResponse } from '../utils/apiClient'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import DashboardLoading from '../components/dashboard/DashboardLoading'
import { gsap } from 'gsap'
import { useLanguage } from '../context/LanguageContext'

// The @zoom/meetingsdk NPM package fundamentally conflicts with React 19.
// The ONLY reliable approach is to inject the Zoom Web SDK as a CDN script tag.
// This loads a self-contained bundle with its own React that never conflicts.

const ZOOM_VERSION = '3.13.2' // Latest stable Web SDK version

const loadCdnScript = (src) => new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script')
    s.src = src
    s.async = false
    s.onload = resolve
    s.onerror = () => reject(new Error(`Failed to load: ${src}`))
    document.body.appendChild(s)
})

const loadCdnStyle = (href) => {
    if (document.querySelector(`link[href="${href}"]`)) return
    const l = document.createElement('link')
    l.rel = 'stylesheet'
    l.href = href
    document.head.appendChild(l)
}

const DashboardLiveClasses = () => {
    const { user } = useSelector(state => state.auth)
    const { t } = useLanguage()
    const [meetings, setMeetings] = useState([])
    const [loading, setLoading] = useState(true)
    const [joining, setJoining] = useState(false)
    const [error, setError] = useState(null)
    const [activeMeeting, setActiveMeeting] = useState(null)
    const [disconnectedMeeting, setDisconnectedMeeting] = useState(null) // tracks last left meeting
    const inMeetingRef = useRef(false) // tracks whether Zoom SDK is currently in a session

    useEffect(() => {
        // Check if we just returned from a Zoom meeting via the leaveUrl redirect
        const params = new URLSearchParams(window.location.search)
        const leftMeetingId = params.get('left')
        if (leftMeetingId) {
            // Restore the meeting info from sessionStorage snapshot
            try {
                const saved = sessionStorage.getItem(`zoom_meeting_${leftMeetingId}`)
                if (saved) {
                    setDisconnectedMeeting(JSON.parse(saved))
                    sessionStorage.removeItem(`zoom_meeting_${leftMeetingId}`)
                } else {
                    // Fallback: we know the ID but not the topic
                    setDisconnectedMeeting({ id: leftMeetingId, topic: 'Live Class' })
                }
            } catch (e) {
                setDisconnectedMeeting({ id: leftMeetingId, topic: 'Live Class' })
            }
            // Clean the ?left= param from the URL without a reload
            const cleanUrl = window.location.pathname
            window.history.replaceState({}, '', cleanUrl)
            inMeetingRef.current = false
            document.body.classList.remove('zoom-active')
            // Animate-in the banner after a short delay
            setTimeout(() => {
                gsap.from('.disconnected-banner', { y: -20, opacity: 0, duration: 0.6, ease: 'power3.out' })
            }, 200)
        }

        fetchMeetings()
        const timer = setTimeout(() => {
            gsap.from('.live-reveal', { y: 30, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' })
        }, 800)
        return () => clearTimeout(timer)
    }, [])

    const fetchMeetings = async () => {
        try {
            setLoading(true)
            const response = await authorizedFetch('/zoom/meetings?type=upcoming')
            const data = await parseApiResponse(response)
            if (!response.ok) throw new Error(data?.message || 'Sync failure')
            if (data.success && data.meetings?.meetings) {
                const fetchedMeetings = data.meetings.meetings
                setMeetings(fetchedMeetings)
                const now = new Date()
                const nearest = fetchedMeetings
                    .filter(m => new Date(m.start_time) > new Date(now.getTime() - 60 * 60000))
                    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))[0] || fetchedMeetings[0]
                setActiveMeeting(nearest || null)
            } else {
                setMeetings([])
                setActiveMeeting(null)
            }
        } catch (err) {
            console.error("Meeting fetch failed:", err)
            setError("Unable to sync live class schedule.")
        } finally {
            setLoading(false)
        }
    }

    const startStreaming = async (meeting) => {
        if (!meeting || joining) return

        // If meeting is an external link (e.g. Google Meet, Microsoft Teams) or has non-numeric Zoom ID
        const joinUrl = meeting.join_url || ''
        const meetingIdStr = String(meeting.id || '').trim()
        const isExternal = joinUrl.includes('meet.google.com') ||
            joinUrl.includes('teams.microsoft.com') ||
            joinUrl.includes('teams.live.com') ||
            !/^\d+$/.test(meetingIdStr.replace(/\s+/g, ''))

        if (isExternal && joinUrl) {
            window.open(joinUrl, '_blank', 'noopener,noreferrer')
            return
        }

        try {
            setJoining(true)
            setError(null)
            setDisconnectedMeeting(null) // clear any previous disconnected state

            // Step 1: Get signature + sdkKey from backend
            const sigRes = await authorizedFetch('/zoom/signature', {
                method: 'POST',
                body: JSON.stringify({ meetingNumber: meeting.id, role: 0 })
            })
            const sigData = await sigRes.json()
            const { signature, sdkKey } = sigData || {}
            if (!signature || !sdkKey) {
                if (joinUrl) {
                    window.open(joinUrl, '_blank', 'noopener,noreferrer')
                    setJoining(false)
                    return
                }
                throw new Error('No signature or sdkKey returned from server.')
            }

            // Step 2: Load Zoom Web SDK from CDN (self-contained, no React conflict)
            loadCdnStyle(`https://source.zoom.us/${ZOOM_VERSION}/css/bootstrap.css`)
            loadCdnStyle(`https://source.zoom.us/${ZOOM_VERSION}/css/react-select.css`)

            // Using pinned, compatible versions to avoid "legacy_createStore" errors
            await loadCdnScript('https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js')
            await loadCdnScript('https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js')
            await loadCdnScript('https://cdnjs.cloudflare.com/ajax/libs/redux/4.2.1/redux.min.js')
            await loadCdnScript('https://cdnjs.cloudflare.com/ajax/libs/redux-thunk/2.4.2/redux-thunk.min.js')
            await loadCdnScript('https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js')
            await loadCdnScript(`https://source.zoom.us/zoom-meeting-${ZOOM_VERSION}.min.js`)

            const ZoomMtg = window.ZoomMtg
            if (!ZoomMtg) throw new Error('Zoom SDK failed to load from CDN.')

            // ⚠️ If already in a meeting, leave it first before joining a new one.
            // Calling init() while the SDK is already active will cause errors.
            if (inMeetingRef.current) {
                console.log('[Zoom] Already in a session — calling leaveMeeting() before joining new one.')
                await new Promise((resolve) => {
                    ZoomMtg.leaveMeeting({
                        success: resolve,
                        error: resolve // resolve anyway to unblock the flow
                    })
                })
                inMeetingRef.current = false
                document.body.classList.remove('zoom-active')
                // Brief pause to let the SDK fully tear down its internal state
                await new Promise((r) => setTimeout(r, 800))
            }

            ZoomMtg.setZoomJSLib(`https://source.zoom.us/${ZOOM_VERSION}/lib`, '/av')
            ZoomMtg.preLoadWasm()
            ZoomMtg.prepareWebSDK()

            // Step 3: Snapshot meeting info so we can restore it after the leaveUrl redirect
            // Zoom redirects to leaveUrl when the user clicks "Leave" in the SDK UI.
            // We add ?left=<meetingId> so the page knows a meeting just ended on mount.
            try {
                sessionStorage.setItem(`zoom_meeting_${meeting.id}`, JSON.stringify(meeting))
            } catch (e) { }

            const leaveUrl = `${window.location.pathname}?left=${meeting.id}`

            // Step 4: Initialize and Join
            document.body.classList.add('zoom-active')
            ZoomMtg.init({
                leaveUrl,
                // Suppress Zoom's own login UI — we join as a named guest via signature
                disableInvite: true,
                isSupportNonverbal: false,
                isSupportBreakout: false,
                screenShare: true,
                success: () => {
                    ZoomMtg.join({
                        signature,
                        sdkKey, // from backend ZOOM_SDK_KEY — never use the OAuth Client ID here
                        meetingNumber: String(meeting.id),
                        userName: user?.fullName || user?.name || 'Student',
                        userEmail: user?.email || '',
                        passWord: meeting.password || '',
                        success: () => {
                            setJoining(false)
                            inMeetingRef.current = true // mark that we are now in a meeting
                            console.log('[Zoom] Successfully joined meeting:', meeting.id)
                        },
                        error: (err) => {
                            console.error('Join error:', err)
                            setJoining(false)
                            inMeetingRef.current = false
                            document.body.classList.remove('zoom-active')
                            // Clean up snapshot since we never entered
                            try { sessionStorage.removeItem(`zoom_meeting_${meeting.id}`) } catch (e) { }
                            setError(`Join failed (${err.errorCode}): ${err.errorMessage}`)
                        }
                    })
                },
                error: (err) => {
                    console.error('Init error:', err)
                    setJoining(false)
                    inMeetingRef.current = false
                    document.body.classList.remove('zoom-active')
                    try { sessionStorage.removeItem(`zoom_meeting_${meeting.id}`) } catch (e) { }
                    setError(`SDK init error: ${JSON.stringify(err)}`)
                }
            })
        } catch (err) {
            console.error('startStreaming error:', err)
            setJoining(false)
            inMeetingRef.current = false
            document.body.classList.remove('zoom-active')
            setError(`Error: ${err.message}`)
        }
    }

    if (loading) return <DashboardLoading />

    return (
        <div className="min-h-screen bg-dark text-normal">
            <DashboardHeader />
            <main className="pt-28 pb-20 px-4 sm:px-6 max-w-6xl mx-auto">
                <div className="space-y-8">
                    <div className="space-y-3 live-reveal">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                            <span className="font-jetbrains text-[10px] text-accent tracking-[0.4em] uppercase">{t('liveSignal') || 'LIVE SIGNAL'}</span>
                        </div>
                        <h1 className="font-inter text-3xl sm:text-4xl md:text-5xl text-normal tracking-tight">
                            {t('liveClasses') || 'Live Classes'}
                        </h1>
                        <p className="font-inter text-sm text-description/70 max-w-xl">
                            Join upcoming sessions, learn with your cohort, and get live guidance from your instructors.
                        </p>
                    </div>

                    {/* ── Meeting Disconnected Banner ── */}
                    {disconnectedMeeting && (
                        <div className="disconnected-banner live-reveal p-8 border border-yellow-500/20 bg-yellow-500/5 relative overflow-hidden">
                            {/* Subtle gradient overlay */}
                            <div className="absolute inset-0 pointer-events-none" style={{
                                background: 'linear-gradient(135deg, rgba(234,179,8,0.04) 0%, transparent 60%)'
                            }} />
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-start gap-5">
                                    {/* Disconnected icon */}
                                    <div className="flex-shrink-0 mt-1">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-yellow-400">
                                            <path d="M9.172 14.828L4.343 19.657M14.828 9.172l4.829-4.829M9.172 9.172L4.343 4.343M14.828 14.828l4.829 4.829M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-black/5 p-4">
                                        <p className="font-jetbrains text-[10px] text-yellow-400 uppercase tracking-[0.3em] font-bold">
                                            {t('meetingDisconnected') || 'Meeting Disconnected'}
                                        </p>
                                        <p className="font-inter text-xl text-normal">
                                            {disconnectedMeeting.topic}
                                        </p>
                                        <p className="font-jetbrains text-[9px] text-description/50 uppercase tracking-widest">
                                            {t('disconnectedDesc') || 'You have left or been disconnected from this session.'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 flex-shrink-0">
                                    <button
                                        onClick={() => startStreaming(disconnectedMeeting)}
                                        disabled={joining}
                                        className="px-8 py-3 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-jetbrains text-[9px] font-bold tracking-[0.3em] uppercase hover:bg-yellow-500/20 transition-all disabled:opacity-40 disabled:cursor-wait"
                                    >
                                        {joining ? (t('reconnecting') || 'RECONNECTING...') : `↩ ${t('rejoin') || 'REJOIN'}`}
                                    </button>
                                    <button
                                        onClick={() => setDisconnectedMeeting(null)}
                                        className="px-6 py-3 border border-white/10 text-description font-jetbrains text-[9px] tracking-[0.2em] uppercase hover:bg-white/5 transition-all"
                                    >
                                        {t('dismiss') || 'DISMISS'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="live-reveal p-6 border border-red-500/20 bg-red-500/5 flex items-start gap-4">
                            <div className="w-1.5 h-1.5 mt-1 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
                            <p className="font-jetbrains text-[9px] text-red-400/80 uppercase tracking-[0.15em]">{error}</p>
                        </div>
                    )}

                    {activeMeeting ? (
                        <div className="live-reveal rounded-3xl p-6 sm:p-8 border border-white/10 bg-white/[0.04] relative overflow-hidden shadow-xl shadow-black/5">
                            <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-accent/10 blur-2xl" />
                            <div className="absolute top-6 right-6 opacity-30 hidden sm:block">
                                <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-accent">
                                    <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div className="space-y-6 relative z-10">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="px-3 py-1 rounded-full bg-accent/15 text-accent font-jetbrains text-[9px] font-bold tracking-[0.2em] uppercase">Upcoming session</span>
                                    <span className="font-jetbrains text-[9px] text-description/60 uppercase tracking-widest">{new Date(activeMeeting.start_time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                </div>
                                <h2 className="font-inter text-3xl sm:text-4xl md:text-5xl leading-tight text-normal max-w-3xl">{activeMeeting.topic}</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl">
                                    <div className="rounded-2xl border border-white/10 bg-black/5 p-4">
                                        <p className="font-jetbrains text-[8px] text-description/40 uppercase tracking-widest">Protocol</p>
                                        <p className="font-inter text-base text-normal mt-1">
                                            {activeMeeting.join_url?.includes('meet.google.com')
                                                ? 'Google Meet'
                                                : activeMeeting.join_url?.includes('teams')
                                                ? 'MS Teams'
                                                : (t('secureBroadcast') || 'Zoom Live Session')}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-black/5 p-4">
                                        <p className="font-jetbrains text-[8px] text-description/40 uppercase tracking-widest">Schedule</p>
                                        <p className="font-inter text-base text-normal mt-1">
                                            {new Date(activeMeeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-jetbrains text-[8px] text-description/40 uppercase tracking-widest">ID / Passcode</p>
                                        <p className="font-inter text-sm text-normal mt-1 break-all">
                                            {activeMeeting.id || 'Live'} {activeMeeting.password ? `/ ${activeMeeting.password}` : ''}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => startStreaming(activeMeeting)}
                                    disabled={joining}
                                    className="rounded-xl px-7 py-3.5 bg-accent text-dark font-jetbrains text-[10px] font-black tracking-[0.25em] uppercase hover:brightness-105 transition-all disabled:opacity-40 disabled:cursor-wait"
                                >
                                    {joining ? 'ESTABLISHING...' : t('joinClass')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="live-reveal rounded-3xl p-12 border border-white/10 bg-white/[0.03] text-center text-description/60 font-inter text-lg">
                            {t('noClassesActive') || 'No classes currently active.'}
                        </div>
                    )}

                    {/* Always show ALL remaining meetings below the hero card */}
                    {meetings.filter(m => (m._id || m.id) !== (activeMeeting?._id || activeMeeting?.id)).length > 0 && (
                        <div className="space-y-4">
                            <p className="font-jetbrains text-[9px] text-description/40 uppercase tracking-[0.3em]">{t('allScheduledClasses') || 'All Scheduled Classes'}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {meetings.filter(m => (m._id || m.id) !== (activeMeeting?._id || activeMeeting?.id)).map((m, i) => (
                                    <div key={m._id || m.id || i} className="live-reveal rounded-2xl p-5 border border-white/10 bg-white/[0.03] space-y-4">
                                        <h3 className="font-inter text-xl text-normal leading-snug">{m.topic}</h3>
                                        <p className="font-jetbrains text-[8px] text-description/50 uppercase tracking-widest leading-relaxed">
                                            {new Date(m.start_time).toLocaleString()} {m.password ? `· Passcode: ${m.password}` : ''}
                                        </p>
                                        <button
                                            onClick={() => startStreaming(m)}
                                            disabled={joining}
                                            className="rounded-lg px-5 py-2.5 border border-white/15 text-normal font-jetbrains text-[9px] tracking-[0.25em] uppercase hover:bg-white/5 transition-all disabled:opacity-40"
                                        >
                                            {joining ? 'ESTABLISHING...' : 'JOIN'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <style dangerouslySetInnerHTML={{
                __html: `
                #zmmtg-root { display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 999999; background: #000; }
                .zoom-active #zmmtg-root { display: block !important; }
                .zoom-active body > *:not(#zmmtg-root) { display: none !important; }
            `}} />
        </div>
    )
}

export default DashboardLiveClasses
