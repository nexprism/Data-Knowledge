import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import sanitizeDisplay from '../utils/textSanitize'
import LessonTrackItem from '../components/dashboard/LessonTrackItem';
import MobileExclusiveModal from '../components/dashboard/MobileExclusiveModal';
import LockedModal from '../components/dashboard/LockedModal';
import authorizedFetch from '../utils/apiClient';
import { useTracker } from '../components/ActivityTracker';

const courseCurriculum = [
    {
        _id: 'm1',
        title: 'Architectural Foundations',
        lessons: [
            { _id: 'l1', title: 'Spatial Geometry & Theory', type: 'video', progress: 100 },
            { _id: 'l2', title: 'Material Resistance Protocol', type: 'video', progress: 45 },
            { _id: 'l3', title: 'Structure Validation Quiz', type: 'quiz', progress: 0 },
        ]
    },
    {
        _id: 'm2',
        title: 'Advanced System Integration',
        lessons: [
            { _id: 'l4', title: 'Dynamic Loading States', type: 'video', progress: 0 },
            { _id: 'l5', title: 'Security Perimeter Setup', type: 'video', progress: 0 },
        ]
    }
];

import { useDispatch, useSelector } from 'react-redux';
import { fetchCourseDetail } from '../redux/slices/courseSlice';
import { fetchLessonsStatus, setLessonStatus } from '../redux/slices/dripSlice';
import socketService from '../services/socketService';

const DashboardCoursePlayer = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { currentCourse, detailLoading, error } = useSelector((state) => state.courses);
    const { user } = useSelector((state) => state.auth);
    const dripStatuses = useSelector((state) => state.drip?.statuses || {});
    const dripLoading = useSelector((state) => state.drip?.loading);
    const dripError = useSelector((state) => state.drip?.error);
    const [activeAccordion, setActiveAccordion] = useState(null);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
    const [lockedModalOpen, setLockedModalOpen] = useState(false);
    const [lockedModalMessage, setLockedModalMessage] = useState('');
    const [isObscured, setIsObscured] = useState(false);
    const [securityWarning, setSecurityWarning] = useState('');
    const containerRef = useRef(null);
    const { trackEvent } = useTracker();

    // Video Progress & Socket.IO State
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(300);
    const [isPlaying, setIsPlaying] = useState(false);
    const [socketConnected, setSocketConnected] = useState(false);
    const [currentLessonProgress, setCurrentLessonProgress] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false);
    const videoRef = useRef(null);
    const iframeRef = useRef(null);
    const playerWrapperRef = useRef(null);
    const lastEmitTimeRef = useRef(0);

    // Prevent developer tool shortcuts and right clicks to deter link extraction
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) ||
                (e.ctrlKey && ['U', 'u', 'S', 's'].includes(e.key))
            ) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const formatTime = (seconds) => {
        const s = Math.max(0, Math.floor(seconds || 0));
        const mins = Math.floor(s / 60);
        const remSecs = s % 60;
        return `${mins < 10 ? '0' : ''}${mins}:${remSecs < 10 ? '0' : ''}${remSecs}`;
    };

    // Emit video progress via Socket.io
    const emitProgress = (targetTime, targetDuration) => {
        if (!selectedLesson) return;
        const videoId = selectedLesson.videoLessons?.[0]?._id ||
            selectedLesson.videoLessons?.[0]?.videoId ||
            selectedLesson.videoLessonId ||
            selectedLesson.videoId ||
            selectedLesson._id;
        const lessonId = selectedLesson._id || selectedLesson.id;
        const courseId = currentCourse?._id || id;
        const userId = user?._id || user?.id;

        const curTime = Math.round(targetTime);
        const dur = Math.max(1, Math.round(targetDuration || duration));

        setIsSyncing(true);
        socketService.emit('video-progress', {
            videoId,
            lessonId,
            courseId,
            userId,
            currentTime: curTime,
            duration: dur
        });
    };

    // Mark as complete via Socket.io
    const handleMarkComplete = () => {
        if (!selectedLesson) return;
        const videoId = selectedLesson.videoLessons?.[0]?._id ||
            selectedLesson.videoLessons?.[0]?.videoId ||
            selectedLesson.videoLessonId ||
            selectedLesson.videoId ||
            selectedLesson._id;
        const lessonId = selectedLesson._id || selectedLesson.id;
        const courseId = currentCourse?._id || id;
        const userId = user?._id || user?.id;

        setIsSyncing(true);
        socketService.emit('video-complete', {
            videoId,
            lessonId,
            courseId,
            userId,
            duration
        });

        // Optimistic UI update
        setCurrentLessonProgress(100);
        setCurrentTime(duration);
        dispatch(setLessonStatus({
            lessonId,
            status: {
                progress: 100,
                unlocked: true,
                completed: true
            }
        }));
    };

    // Connect to Socket.IO and listen for progress updates
    useEffect(() => {
        const token = localStorage.getItem('edrilla_token') || localStorage.getItem('token');
        socketService.connect(token).then(() => {
            setSocketConnected(true);
        }).catch((err) => {
            console.warn('Socket connection error in course player:', err);
        });

        const handleProgressUpdated = (data) => {
            setIsSyncing(false);
            if (data?.lessonId) {
                const prog = Math.round(data.progressPercentage || 0);
                dispatch(setLessonStatus({
                    lessonId: data.lessonId,
                    status: {
                        progress: prog,
                        unlocked: true,
                        completed: data.completed || prog >= 80,
                    }
                }));
                const currentLid = selectedLesson?._id || selectedLesson?.id;
                if (currentLid === data.lessonId) {
                    setCurrentLessonProgress(prog);
                }
            }
        };

        const handleVideoCompleted = (data) => {
            setIsSyncing(false);
            if (data?.lessonId) {
                dispatch(setLessonStatus({
                    lessonId: data.lessonId,
                    status: {
                        progress: 100,
                        unlocked: true,
                        completed: true,
                    }
                }));
                const currentLid = selectedLesson?._id || selectedLesson?.id;
                if (currentLid === data.lessonId) {
                    setCurrentLessonProgress(100);
                }
            }
        };

        socketService.on('progress-updated', handleProgressUpdated);
        socketService.on('video-completed', handleVideoCompleted);

        return () => {
            socketService.off('progress-updated', handleProgressUpdated);
            socketService.off('video-completed', handleVideoCompleted);
        };
    }, [dispatch, selectedLesson]);

    // Update progress state when selectedLesson changes
    useEffect(() => {
        if (!selectedLesson) return;
        const lid = selectedLesson._id || selectedLesson.id;
        const initialProgress = dripStatuses[lid]?.progress ?? selectedLesson.progress ?? 0;
        setCurrentLessonProgress(initialProgress);

        let d = 300;
        const vDuration = selectedLesson.videoLessons?.[0]?.duration;
        if (vDuration && typeof vDuration === 'number') {
            d = vDuration > 30 ? vDuration : vDuration * 60;
        } else if (selectedLesson.duration && typeof selectedLesson.duration === 'number') {
            d = selectedLesson.duration > 30 ? selectedLesson.duration : selectedLesson.duration * 60;
        }
        setDuration(d);
        const startingTime = (initialProgress / 100) * d;
        setCurrentTime(startingTime);
        // DO NOT auto-play or start ticker before video is actually played
        setIsPlaying(false);
    }, [selectedLesson]);

    // Listen to iframe postMessage events (YouTube and VdoCipher)
    useEffect(() => {
        const handleMessage = (event) => {
            if (!event.data) return;

            try {
                let data = event.data;
                if (typeof data === 'string') {
                    try {
                        data = JSON.parse(data);
                    } catch (_) {
                        return;
                    }
                }

                // 1. YouTube Player API events
                if (data.event === 'onStateChange') {
                    // -1: unstarted, 0: ended, 1: playing, 2: paused, 3: buffering, 5: cued
                    if (data.info === 1) {
                        setIsPlaying(true);
                    } else if (data.info === 2 || data.info === -1 || data.info === 5) {
                        setIsPlaying(false);
                    } else if (data.info === 0) {
                        setIsPlaying(false);
                        handleMarkComplete();
                    }
                }

                if (data.event === 'infoDelivery' && data.info) {
                    if (typeof data.info.playerState === 'number') {
                        if (data.info.playerState === 1) {
                            setIsPlaying(true);
                        } else if (data.info.playerState === 2 || data.info.playerState === 0) {
                            setIsPlaying(false);
                        }
                    }

                    if (typeof data.info.currentTime === 'number') {
                        const cur = data.info.currentTime;
                        const dur = (typeof data.info.duration === 'number' && data.info.duration > 0)
                            ? data.info.duration
                            : duration;

                        setCurrentTime(cur);
                        if (dur && dur > 0 && dur !== duration) {
                            setDuration(dur);
                        }
                        const p = dur > 0 ? Math.min(100, Math.round((cur / dur) * 100)) : 0;
                        setCurrentLessonProgress(p);

                        const now = Date.now();
                        if (now - lastEmitTimeRef.current >= 3000) {
                            lastEmitTimeRef.current = now;
                            emitProgress(cur, dur);
                        }
                    }
                }

                // 2. VdoCipher Player API events
                if (data.event === 'playing' || data.type === 'play' || data.event === 'play') {
                    setIsPlaying(true);
                } else if (data.event === 'pause' || data.type === 'pause') {
                    setIsPlaying(false);
                } else if (data.event === 'ended' || data.type === 'ended') {
                    setIsPlaying(false);
                    handleMarkComplete();
                } else if (data.event === 'timeupdate' || data.type === 'timeupdate') {
                    const cur = data.currentTime ?? data.data?.currentTime;
                    const dur = data.duration ?? data.data?.duration ?? duration;
                    if (typeof cur === 'number') {
                        setCurrentTime(cur);
                        if (dur && dur > 0 && dur !== duration) {
                            setDuration(dur);
                        }
                        const p = dur > 0 ? Math.min(100, Math.round((cur / dur) * 100)) : 0;
                        setCurrentLessonProgress(p);

                        const now = Date.now();
                        if (now - lastEmitTimeRef.current >= 3000) {
                            lastEmitTimeRef.current = now;
                            emitProgress(cur, dur);
                        }
                    }
                }
            } catch (_) {}
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [duration, selectedLesson]);

    // Handle manual seek from the progress scrubber
    const handleSeek = (percentage) => {
        const clamped = Math.max(0, Math.min(100, percentage));
        const newTime = (clamped / 100) * duration;
        setCurrentTime(newTime);
        setCurrentLessonProgress(Math.round(clamped));
        if (videoRef.current) {
            videoRef.current.currentTime = newTime;
        } else if (iframeRef.current && iframeRef.current.contentWindow) {
            try {
                iframeRef.current.contentWindow.postMessage(
                    JSON.stringify({ event: 'command', func: 'seekTo', args: [newTime, true] }),
                    '*'
                );
            } catch (_) {}
        }
        emitProgress(newTime, duration);
    };

    // Toggle Play/Pause on the active video/iframe
    const handleTogglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play().catch(() => {});
            }
        } else if (iframeRef.current && iframeRef.current.contentWindow) {
            try {
                const cmd = isPlaying ? 'pauseVideo' : 'playVideo';
                iframeRef.current.contentWindow.postMessage(
                    JSON.stringify({ event: 'command', func: cmd, args: [] }),
                    '*'
                );
                iframeRef.current.contentWindow.postMessage(
                    JSON.stringify({ event: 'listening' }),
                    '*'
                );
            } catch (_) {}
            setIsPlaying((prev) => !prev);
        } else {
            setIsPlaying((prev) => !prev);
        }
    };

    const handleToggleMute = () => {
        const nextMuted = !isMuted;
        setIsMuted(nextMuted);
        if (videoRef.current) {
            videoRef.current.muted = nextMuted;
        } else if (iframeRef.current && iframeRef.current.contentWindow) {
            try {
                const cmd = nextMuted ? 'mute' : 'unMute';
                iframeRef.current.contentWindow.postMessage(
                    JSON.stringify({ event: 'command', func: cmd, args: [] }),
                    '*'
                );
            } catch (_) {}
        }
    };

    const handleToggleFullscreen = () => {
        const elem = playerWrapperRef.current;
        if (!elem) return;

        const isNativeFs = Boolean(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        );

        if (isPseudoFullscreen) {
            setIsPseudoFullscreen(false);
            try { document.body.style.overflow = ''; } catch (_) {}
            return;
        }

        if (isNativeFs) {
            try {
                if (document.exitFullscreen) {
                    document.exitFullscreen().catch(() => {});
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
            } catch (_) {}
            return;
        }

        // Try standard or prefixed element fullscreen
        const requestFs =
            elem.requestFullscreen ||
            elem.webkitRequestFullscreen ||
            elem.mozRequestFullScreen ||
            elem.msRequestFullscreen;

        if (typeof requestFs === 'function') {
            try {
                const res = requestFs.call(elem);
                if (res && typeof res.catch === 'function') {
                    res.catch(() => {
                        // Fallback to CSS pseudo-fullscreen on mobile browsers (like iOS Safari)
                        setIsPseudoFullscreen(true);
                        try { document.body.style.overflow = 'hidden'; } catch (_) {}
                    });
                }
            } catch (_) {
                setIsPseudoFullscreen(true);
                try { document.body.style.overflow = 'hidden'; } catch (_) {}
            }
        } else {
            // Element fullscreen unsupported (e.g., iPhone / iOS Safari)
            setIsPseudoFullscreen(true);
            try { document.body.style.overflow = 'hidden'; } catch (_) {}
        }
    };

    // Listen to native fullscreen changes and Escape key to sync pseudo-fullscreen
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isNativeFs = Boolean(
                document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement
            );
            if (!isNativeFs && isPseudoFullscreen) {
                setIsPseudoFullscreen(false);
                try { document.body.style.overflow = ''; } catch (_) {}
            }
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isPseudoFullscreen) {
                setIsPseudoFullscreen(false);
                try { document.body.style.overflow = ''; } catch (_) {}
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            window.removeEventListener('keydown', handleKeyDown);
            try { document.body.style.overflow = ''; } catch (_) {}
        };
    }, [isPseudoFullscreen]);

    console.log('Current Course Data:', currentCourse);
    console.log('Selected Lesson:', selectedLesson);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (id) {
            dispatch(fetchCourseDetail(id));
        }
    }, [id, dispatch]);

    const reportIncidentRef = useRef(null);
    // Updated on every render so the latest selectedLesson and currentCourse are always available
    reportIncidentRef.current = async (incidentType, extraDetails = {}) => {
        if (!currentCourse || !user) return;
        try {
            const videoId = selectedLesson?.videoLessons?.[0]?._id || selectedLesson?.videoLessons?.[0]?.id || selectedLesson?.videoLessonId || selectedLesson?.videoId || null;
            const body = JSON.stringify({
                incidentType: incidentType,
                courseId: currentCourse._id || id,
                videoId: videoId || null,
                lessonId: selectedLesson?._id || null,
                details: {
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString(),
                    videoType: selectedLesson?.videoLessons?.[0]?.sourcePlatform || "unknown",
                    sessionId: "sess_" + Math.random().toString(36).substr(2, 9),
                    ...extraDetails
                }
            });
            await authorizedFetch('/security/incidents', { method: 'POST', body });
        } catch (e) {
            console.warn("Failed to report security incident:", e);
        }
    };

    // Anti-Piracy / Security Logic
    useEffect(() => {
        const preventDevTools = (e) => {
            if (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) ||
                (e.ctrlKey && ['U', 'u'].includes(e.key)) ||
                (e.metaKey && e.altKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) // Mac specific
            ) {
                e.preventDefault();
                setSecurityWarning('Unauthorized action detected. Continued violations will result in account suspension.');
                if (reportIncidentRef.current) reportIncidentRef.current('DEV_TOOLS_OPEN_ATTEMPT', { key: e.key });
                return false;
            }
        };

        const preventRightClick = (e) => {
            e.preventDefault();
            setSecurityWarning('Unauthorized action detected. Inspecting or copying content is strictly prohibited.');
            if (reportIncidentRef.current) reportIncidentRef.current('RIGHT_CLICK_ATTEMPT');
            return false;
        };

        const preventCopyPaste = (e) => {
            e.preventDefault();
            setSecurityWarning('Unauthorized action detected. Copying course content is strictly prohibited.');
            return false;
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setIsObscured(true);
                if (reportIncidentRef.current) reportIncidentRef.current('SCREEN_OBSCURED', { reason: 'visibility_hidden' });
            } else {
                setIsObscured(false);
            }
        };

        const handleBlur = () => {
            setTimeout(() => {
                if (document.activeElement?.tagName === 'IFRAME') {
                    // User clicked inside the video player iframe; do not obscure
                    return;
                }
                setIsObscured(true);
                if (reportIncidentRef.current) reportIncidentRef.current('SCREEN_OBSCURED', { reason: 'window_blur' });
            }, 50);
        };
        const handleFocus = () => setIsObscured(false);

        // Add event listeners
        window.addEventListener('keydown', preventDevTools);
        document.addEventListener('contextmenu', preventRightClick);
        document.addEventListener('copy', preventCopyPaste);
        document.addEventListener('cut', preventCopyPaste);
        document.addEventListener('paste', preventCopyPaste);
        document.addEventListener('dragstart', preventCopyPaste);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);

        return () => {
            // Cleanup
            window.removeEventListener('keydown', preventDevTools);
            document.removeEventListener('contextmenu', preventRightClick);
            document.removeEventListener('copy', preventCopyPaste);
            document.removeEventListener('cut', preventCopyPaste);
            document.removeEventListener('paste', preventCopyPaste);
            document.removeEventListener('dragstart', preventCopyPaste);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    useEffect(() => {
        if (currentCourse && !detailLoading) {
            const ctx = gsap.context(() => {
                gsap.fromTo('.player-reveal',
                    { y: 20, opacity: 0 },
                    {
                        y: 0,
                        opacity: 1,
                        duration: 0.8,
                        stagger: 0.1,
                        ease: 'power3.out'
                    }
                );
            }, containerRef);
            return () => ctx.revert();
        }
    }, [currentCourse, detailLoading]);

    // Flatten all lessons across all modules for sequential navigation
    const allCourseLessons = React.useMemo(() => {
        if (!currentCourse?.modules) return [];
        const list = [];
        currentCourse.modules.forEach((mod, modIdx) => {
            (mod.lessons || []).forEach((les, lesIdx) => {
                list.push({
                    ...les,
                    moduleId: mod._id || modIdx,
                    moduleTitle: mod.title,
                    moduleNumber: modIdx + 1,
                    lessonIndex: lesIdx + 1,
                });
            });
        });
        return list;
    }, [currentCourse]);

    const currentLessonIndex = React.useMemo(() => {
        if (!selectedLesson || allCourseLessons.length === 0) return -1;
        const selId = selectedLesson._id || selectedLesson.id;
        return allCourseLessons.findIndex((l) => (l._id || l.id) === selId);
    }, [selectedLesson, allCourseLessons]);

    const prevLesson = currentLessonIndex > 0 ? allCourseLessons[currentLessonIndex - 1] : null;
    const nextLesson = currentLessonIndex >= 0 && currentLessonIndex < allCourseLessons.length - 1
        ? allCourseLessons[currentLessonIndex + 1]
        : null;

    const completedLessonsCount = React.useMemo(() => {
        if (!allCourseLessons.length) return 0;
        return allCourseLessons.filter((l) => {
            const st = dripStatuses[l._id || l.id];
            return (st?.progress ?? l.progress ?? 0) >= 100;
        }).length;
    }, [allCourseLessons, dripStatuses]);

    const overallProgress = React.useMemo(() => {
        if (!allCourseLessons.length) return 0;
        return Math.round((completedLessonsCount / allCourseLessons.length) * 100);
    }, [completedLessonsCount, allCourseLessons.length]);

    // Automatically open first module accordion and auto-load initial lesson so player is ready at the top
    useEffect(() => {
        if (currentCourse && !selectedLesson && !detailLoading && allCourseLessons.length > 0) {
            const firstPlayable = allCourseLessons.find((l) => {
                const s = dripStatuses[l._id || l.id];
                return s ? s.unlocked !== false : true;
            }) || allCourseLessons[0];

            if (firstPlayable) {
                if (firstPlayable.moduleId !== undefined) {
                    setActiveAccordion(firstPlayable.moduleId);
                }
                if (!firstPlayable.type || firstPlayable.type === 'video') {
                    setSelectedLesson(firstPlayable);
                }
            }
        }
    }, [currentCourse, selectedLesson, detailLoading, allCourseLessons, dripStatuses]);

    // Fetch unlock/progress statuses for lessons in currentCourse with bounded concurrency
    useEffect(() => {
        if (!currentCourse || !user) return;

        const lessons = [];
        (currentCourse.modules || []).forEach((m) => {
            (m.lessons || []).forEach((l) => {
                lessons.push({ ...(l || {}), courseId: currentCourse._id || id });
            });
        });

        if (lessons.length > 0) {
            dispatch(fetchLessonsStatus({ userId: user._id || user.id || user?.userId, lessons }));
        }
    }, [currentCourse, user, id, dispatch]);


    const refreshStatuses = () => {
        if (!currentCourse || !user) return;
        const lessons = [];
        (currentCourse.modules || []).forEach((m) => {
            (m.lessons || []).forEach((l) => lessons.push({ ...(l || {}), courseId: currentCourse._id || id }));
        });
        if (lessons.length > 0) dispatch(fetchLessonsStatus({ userId: user._id || user.id || user?.userId, lessons }));
    };

    const handleLessonPlay = async (lesson) => {
        // If lesson is a quiz, navigate to the quiz flow instead of video player
        const lid = lesson._id || lesson.id;
        const lessonStatus = dripStatuses[lid];
        if (lessonStatus && lessonStatus.unlocked === false) {
            setLockedModalMessage('This lesson is currently locked. Complete prerequisites to unlock it.');
            setLockedModalOpen(true);
            return;
        }
        // Check if OTP needs refresh (TTL is usually 300s / 5m)
        const video = lesson.videoLessons?.[0];
        const isVdoCipher = video?.sourcePlatform === 'videocypher';

        if (isVdoCipher && video.vdoCipherPlayback) {
            const fetchedAt = new Date(video.vdoCipherPlayback.fetchedAt).getTime();
            const now = new Date().getTime();
            const ageInSeconds = (now - fetchedAt) / 1000;

            // If OTP is older than 4 minutes (240s), refresh the whole course detail to get new tokens
            if (ageInSeconds > 240) {
                await dispatch(fetchCourseDetail(id));
                // After refresh, the lesson object in 'currentCourse' will have new tokens
                // We need to find the updated lesson object
                return; // The useEffect or a subsequent click will handle it, or we can find it now
            }
        }

        // Log lesson play event
        trackEvent('play_lesson', {
            lessonId: lesson._id || lesson.id,
            title: lesson.title,
            type: lesson.type || 'video',
            courseId: currentCourse?._id || id,
        });

        // notify server about last played video (include tokens)
        try {
            const videoId = lesson.videoLessons?.[0]?._id || lesson.videoLessons?.[0]?.id || lesson.videoLessonId || lesson.videoId || null;
            if (videoId) {
                const body = JSON.stringify({ courseId: currentCourse._id || id, videoLessonId: videoId });
                const r = await authorizedFetch('/course-completion/update-last-video', { method: 'POST', body });
                if (r.status === 401) {
                    console.warn('update-last-video returned 401');
                }
            } else {
                console.warn('update-last-video skipped: no video id available for lesson', lesson._id || lesson.id);
            }
        } catch (e) {
            console.warn('update-last-video error', e);
        }

        if (lesson?.type === 'assignment') {
            navigate(`/dashboard/assignment/${id}/${lesson._id || lesson.id}`);
            return;
        }

        if (lesson?.type === 'text') {
            navigate(`/dashboard/reading/${id}/${lesson._id || lesson.id}`);
            return;
        }

        if (lesson?.type === 'quiz') {
            navigate(`/dashboard/quiz/${id}/${lesson._id || lesson.id}`);
            return;
        }

        setSelectedLesson(lesson);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleNextLesson = () => {
        if (!nextLesson) return;
        if (nextLesson.moduleId !== undefined) {
            setActiveAccordion(nextLesson.moduleId);
        }
        handleLessonPlay(nextLesson);
    };

    const handlePrevLesson = () => {
        if (!prevLesson) return;
        if (prevLesson.moduleId !== undefined) {
            setActiveAccordion(prevLesson.moduleId);
        }
        handleLessonPlay(prevLesson);
    };

    const extractYouTubeId = (url) => {
        if (!url || typeof url !== 'string') return '';
        const trimmed = url.trim();
        const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
        if (match) return match[1];
        if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
        return '';
    };

    const buildYouTubeEmbedUrl = (ytId) => {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        return `https://www.youtube-nocookie.com/embed/${ytId}?enablejsapi=1&origin=${encodeURIComponent(origin)}&controls=0&rel=0&modestbranding=1&disablekb=1&iv_load_policy=3&fs=0&playsinline=1&showinfo=0`;
    };

    const getVideoSrc = (lesson) => {
        if (!lesson) return '';

        // Handle case where videoLessons is an array
        if (Array.isArray(lesson.videoLessons) && lesson.videoLessons.length > 0) {
            const video = lesson.videoLessons[0];

            let decVideoId = video.videoId;
            let decSecureUrl = video.secureUrl;
            let decVideoUrl = video.videoUrl;
            if (video.isEncrypted) {
                const dec = (s) => s?.startsWith('ENC_') ? atob(s.replace('ENC_', '')).split('').reverse().join('') : s;
                decVideoId = dec(video.videoId);
                decSecureUrl = dec(video.secureUrl);
                decVideoUrl = dec(video.videoUrl);
            }

            if (video.sourcePlatform === 'videocypher' && video.vdoCipherPlayback) {
                return `https://player.vdocipher.com/v2/?otp=${video.vdoCipherPlayback.otp}&playbackInfo=${video.vdoCipherPlayback.playbackInfo}`;
            }

            const ytId = extractYouTubeId(decVideoUrl) ||
                extractYouTubeId(decSecureUrl) ||
                (video.sourcePlatform === 'youtube' ? extractYouTubeId(decVideoId) : '');

            if (ytId) {
                return buildYouTubeEmbedUrl(ytId);
            }

            if (decVideoUrl) return decVideoUrl;
            if (decSecureUrl) return decSecureUrl;
        }

        // Handle legacy schema
        if (lesson.video && lesson.video.url) {
            const ytId = extractYouTubeId(lesson.video.url);
            if (ytId) {
                return buildYouTubeEmbedUrl(ytId);
            }
            return lesson.video.url;
        }

        return '';
    };

    const videoSrc = getVideoSrc(selectedLesson);
    const isYouTube = Boolean(
        selectedLesson?.videoLessons?.[0]?.sourcePlatform === 'youtube' ||
        (videoSrc && (videoSrc.includes('youtube.com') || videoSrc.includes('youtu.be') || videoSrc.includes('youtube-nocookie.com')))
    );

    if (detailLoading) {
        return (
            <div className="min-h-screen bg-dark flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-dark flex flex-col items-center justify-center p-8 space-y-6">
                <div className="bg-red-500/10 border border-red-500/20 p-10 sm:p-12 text-center space-y-4 max-w-xl rounded-2xl">
                    <p className="font-jetbrains text-[10px] text-red-500 uppercase tracking-[0.4em] font-black">Course Unavailable</p>
                    <p className="font-inter text-xl sm:text-2xl text-red-400 font-semibold">{error}</p>
                    <p className="font-inter text-xs text-slate-400">This course is currently in draft mode, scheduled for future release, or has been removed.</p>
                    <div className="flex flex-wrap gap-4 justify-center pt-4">
                        <button
                            onClick={() => navigate('/dashboard/my-courses')}
                            className="px-8 py-3.5 bg-accent text-slate-950 font-jetbrains text-xs font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-accent-soft"
                        >
                            Back to My Courses
                        </button>
                        <button
                            onClick={() => dispatch(fetchCourseDetail(id))}
                            className="px-8 py-3.5 bg-red-500/20 text-red-400 font-jetbrains text-xs font-black uppercase tracking-widest rounded-xl hover:bg-red-500/30 transition-all"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentCourse) return null;

    return (
        <div ref={containerRef} className="min-h-screen bg-dark text-white selection:bg-accent/40 relative overflow-x-hidden">
            <DashboardHeader />

            <main className="pt-20 pb-28 sm:pb-36 px-4">
                <div className="space-y-12">
                    {/* Header Section */}
                    <div className="space-y-4 player-reveal opacity-0">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                            <Link to="/dashboard/my-courses" className="inline-flex items-center gap-1.5 hover:text-blue-600 transition-colors font-semibold">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6" /></svg>
                                My Courses
                            </Link>
                            <span className="text-slate-300">/</span>
                            <span className="text-slate-700 font-medium truncate max-w-xs sm:max-w-md">
                                {sanitizeDisplay(currentCourse.title)}
                            </span>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                            <div>
                                <h1 className="font-inter text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                                    {sanitizeDisplay(currentCourse.title)}
                                </h1>
                                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600 font-medium">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                                        {currentCourse.modules?.length || 0} Modules
                                    </span>
                                    <span>•</span>
                                    <span>{allCourseLessons.length} Lessons</span>
                                    {completedLessonsCount > 0 && (
                                        <>
                                            <span>•</span>
                                            <span className="text-emerald-700 font-semibold">
                                                {completedLessonsCount} of {allCourseLessons.length} Completed ({overallProgress}%)
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Overall progress bar */}
                            <div className="w-full md:w-64 space-y-1.5">
                                <div className="flex justify-between items-center text-xs font-semibold">
                                    <span className="text-slate-600">Course Progress</span>
                                    <span className="text-blue-600">{overallProgress}%</span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-700"
                                        style={{ width: `${overallProgress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dashboard Video Area */}
                    {selectedLesson && (
                        <div className="space-y-4 mb-8">
                            <div
                                ref={playerWrapperRef}
                                className={`animate-in fade-in duration-700 w-full aspect-video bg-[#0d0d0d] border border-white/5 relative overflow-hidden flex items-center justify-center group shadow-2xl rounded-2xl select-none ${
                                    isPseudoFullscreen
                                        ? '!fixed !inset-0 !z-[999999] !w-screen !h-screen !max-w-none !max-h-none !rounded-none !border-0 !aspect-auto bg-black'
                                        : ''
                                }`}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    return false;
                                }}
                            >
                                {isPseudoFullscreen && (
                                    <button
                                        type="button"
                                        onClick={handleToggleFullscreen}
                                        className="absolute top-4 right-4 z-[9999999] p-2.5 rounded-full bg-black/80 text-white/90 hover:bg-black border border-white/20 shadow-2xl transition-all"
                                        title="Exit Fullscreen"
                                        aria-label="Exit Fullscreen"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </button>
                                )}
                                <div className="w-full h-full bg-black relative flex items-center justify-center overflow-hidden">
                                    {selectedLesson.type === 'video' || (selectedLesson.videoLessons?.length > 0) ? (
                                        videoSrc ? (
                                            videoSrc.endsWith('.mp4') || videoSrc.endsWith('.webm') || videoSrc.includes('/uploads/') ? (
                                                <video
                                                    ref={videoRef}
                                                    src={videoSrc}
                                                    controls
                                                    className={`w-full h-full object-contain absolute inset-0 z-0 transition-all duration-300 ${isObscured ? 'opacity-0 pointer-events-none filter blur-xl' : 'opacity-100'}`}
                                                    onPlay={() => setIsPlaying(true)}
                                                    onPause={() => setIsPlaying(false)}
                                                    onTimeUpdate={(e) => {
                                                        const cur = e.target.currentTime;
                                                        const dur = e.target.duration || duration;
                                                        setCurrentTime(cur);
                                                        if (dur) setDuration(dur);
                                                        const p = Math.min(100, Math.round((cur / dur) * 100));
                                                        setCurrentLessonProgress(p);
                                                    }}
                                                    onEnded={() => {
                                                        setIsPlaying(false);
                                                        handleMarkComplete();
                                                    }}
                                                />
                                            ) : (
                                                <div className="relative w-full h-full overflow-hidden bg-black select-none">
                                                    <iframe
                                                        ref={iframeRef}
                                                        id="course-video-iframe"
                                                        src={videoSrc}
                                                        className={`w-full h-full border-0 absolute inset-0 z-0 transition-all duration-300 pointer-events-none ${
                                                            isObscured ? 'opacity-0 filter blur-xl' : 'opacity-100'
                                                        }`}
                                                        allowFullScreen
                                                        allow="autoplay; encrypted-media; fullscreen"
                                                        title={selectedLesson.title}
                                                        onLoad={() => {
                                                            if (iframeRef.current?.contentWindow) {
                                                                try {
                                                                    iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'listening' }), '*');
                                                                } catch (_) {}
                                                            }
                                                        }}
                                                        onError={() => {
                                                            if (reportIncidentRef.current) {
                                                                reportIncidentRef.current('VDOCIPHER_PLAYER_ERROR', { error: 'Failed to initialize VdoPlayer' });
                                                            }
                                                        }}
                                                    />

                                                    {/* Top Anti-Share Shield Bar - Masks and blocks YouTube Share & Title */}
                                                    <div
                                                        className="absolute top-0 left-0 right-0 h-14 z-20 pointer-events-auto bg-gradient-to-b from-[#090d16] via-[#090d16]/95 to-transparent flex items-center justify-between px-5 select-none"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleTogglePlay();
                                                        }}
                                                        onContextMenu={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-2 max-w-[70%]">
                                                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                                            <span className="font-jetbrains text-[11px] font-bold text-white/90 truncate tracking-wide">
                                                                {selectedLesson.title}
                                                            </span>
                                                        </div>
                                                        <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                                            SECURE FEED
                                                        </span>
                                                    </div>

                                                    {/* Bottom Anti-Share Shield Bar - Masks YouTube Copy Link & YouTube Logo on Mobile */}
                                                    {isYouTube && (
                                                        <div
                                                            className="absolute bottom-0 left-0 right-0 h-14 z-20 pointer-events-auto bg-gradient-to-t from-[#090d16] via-[#090d16]/90 to-transparent flex items-center justify-between px-5 select-none cursor-pointer"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleTogglePlay();
                                                            }}
                                                            onContextMenu={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                            }}
                                                        />
                                                    )}

                                                    {/* Full Interactive Play/Pause Shield Overlay - Covers entire video so user only has play and pause options */}
                                                    <div
                                                        className="absolute inset-0 z-10 cursor-pointer flex items-center justify-center select-none group/video-overlay"
                                                        onClick={handleTogglePlay}
                                                        onContextMenu={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                        }}
                                                    >
                                                        {!isPlaying ? (
                                                            <div className="flex flex-col items-center gap-3">
                                                                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-[0_0_35px_rgba(59,130,246,0.7)] transform group-hover/video-overlay:scale-110 transition-all duration-300">
                                                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="ml-1">
                                                                        <path d="M5 3l14 9-14 9V3z" />
                                                                    </svg>
                                                                </div>
                                                                <span className="font-jetbrains text-[10px] uppercase tracking-widest text-white/90 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                                                                    Click to Play
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md text-white/90 border border-white/10 flex items-center justify-center opacity-0 group-hover/video-overlay:opacity-100 transform group-hover/video-overlay:scale-105 transition-all duration-200 shadow-2xl">
                                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                                    <rect x="6" y="4" width="4" height="16" rx="1" />
                                                                    <rect x="14" y="4" width="4" height="16" rx="1" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        ) : (
                                            <div className="text-center space-y-4 z-10 relative">
                                                <div className="w-16 h-16 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                                </div>
                                                <p className="font-jetbrains text-[10px] text-red-500/80 uppercase tracking-widest">Media Source Not Found</p>
                                            </div>
                                        )
                                    ) : (
                                        <div className="text-center space-y-4 z-10 relative">
                                            <div className="w-16 h-16 bg-accent/10 text-accent border border-accent/20 rounded-full flex items-center justify-center mx-auto">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zM12 6v6l4 2" /></svg>
                                            </div>
                                            <p className="font-jetbrains text-[10px] text-accent/80 uppercase tracking-widest">Protocol Type Unrecognized</p>
                                        </div>
                                    )}

                                    {/* Obscured Overlay for Screen Sharing Prevention */}
                                    {isObscured && (
                                        <div className="absolute inset-0 bg-black z-[100] flex flex-col items-center justify-center pointer-events-none">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-white/20 mb-4">
                                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M8 11h8" /><path d="M12 15V7" />
                                            </svg>
                                            <p className="font-jetbrains text-[10px] text-white/50 uppercase tracking-[0.4em]">Content Protected</p>
                                        </div>
                                    )}

                                    {/* Security Watermark */}
                                    {user?.email && (
                                        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-50">
                                            <div className="absolute animate-float-slow opacity-[0.03] md:opacity-[0.05] whitespace-nowrap">
                                                <p className="font-jetbrains text-[10px] md:text-[14px] text-white tracking-[0.2em] font-black uppercase">
                                                    {user.email} • {user.email} • {user.email}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Modern LMS Player Control & Navigation HUD */}
                            <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm space-y-4">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M5 3l14 9-14 9V3z" />
                                            </svg>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                {selectedLesson.moduleTitle && (
                                                    <span className="text-xs font-semibold text-blue-600 truncate max-w-xs">
                                                        Module {selectedLesson.moduleNumber || 1}: {selectedLesson.moduleTitle}
                                                    </span>
                                                )}
                                                <span className="text-slate-300">•</span>
                                                <span className="text-xs text-slate-500 font-medium">
                                                    Lesson {currentLessonIndex >= 0 ? currentLessonIndex + 1 : 1} of {allCourseLessons.length}
                                                </span>
                                            </div>
                                            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate max-w-xl">
                                                {selectedLesson.title}
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Action Buttons: Prev, Play/Pause, Next, Mark Complete */}
                                    <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                                        <button
                                            type="button"
                                            onClick={handlePrevLesson}
                                            disabled={!prevLesson}
                                            title={prevLesson ? `Previous: ${prevLesson.title}` : 'First lesson'}
                                            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 transition-all flex items-center gap-1.5"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                                            <span>Previous</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleTogglePlay}
                                            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border shadow-xs ${
                                                isPlaying
                                                    ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                                    : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                                            }`}
                                        >
                                            {isPlaying ? (
                                                <>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                                                    <span>Pause</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z" /></svg>
                                                    <span>Play</span>
                                                </>
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleToggleMute}
                                            title={isMuted ? 'Unmute' : 'Mute'}
                                            className="p-2 rounded-xl text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all flex items-center justify-center"
                                        >
                                            {isMuted ? (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <line x1="1" y1="1" x2="23" y2="23" />
                                                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                                                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                                                </svg>
                                            ) : (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                                                </svg>
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleToggleFullscreen}
                                            title="Toggle Fullscreen"
                                            className="p-2 rounded-xl text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all flex items-center justify-center"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                                            </svg>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleMarkComplete}
                                            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-all flex items-center gap-1.5 shadow-xs"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                            <span>Mark Complete</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleNextLesson}
                                            disabled={!nextLesson}
                                            title={nextLesson ? `Next: ${nextLesson.title}` : 'Last lesson'}
                                            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow-xs"
                                        >
                                            <span>Next Lesson</span>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Scrubber track */}
                                <div className="space-y-1.5 pt-1">
                                    <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                                        <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                                        <span className="text-blue-600 font-semibold">{Math.round(currentLessonProgress)}% Completed</span>
                                    </div>
                                    <div
                                        onClick={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const clickX = e.clientX - rect.left;
                                            const perc = (clickX / rect.width) * 100;
                                            handleSeek(perc);
                                        }}
                                        className="h-2.5 bg-slate-100 rounded-full relative overflow-hidden cursor-pointer group/bar border border-slate-200 hover:border-blue-400 transition-colors"
                                        title="Click to seek"
                                    >
                                        <div
                                            className="absolute top-0 left-0 h-full bg-blue-600 rounded-full transition-all duration-300"
                                            style={{ width: `${Math.min(100, Math.max(0, currentLessonProgress))}%` }}
                                        />
                                    </div>
                                </div>

                                {nextLesson && (
                                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                                        <span className="truncate max-w-md">
                                            <strong className="text-slate-800">Next Up:</strong> {nextLesson.title}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleNextLesson}
                                            className="text-blue-600 hover:text-blue-800 font-semibold shrink-0 flex items-center gap-1"
                                        >
                                            Continue to Next <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* DRM Troubleshooting Note */}
                    {selectedLesson?.videoLessons?.[0]?.sourcePlatform === 'videocypher' && (
                        <div className="player-reveal opacity-0 p-4 rounded-xl bg-blue-50 border border-blue-200 text-slate-700 text-xs">
                            <p>
                                <strong>Playback Note:</strong> If video feed fails to load, ensure Incognito Mode is disabled and Protected Content playback is enabled in your browser settings.
                            </p>
                        </div>
                    )}

                    {/* Course Content Accordion */}
                    <div className="player-reveal opacity-0 space-y-4 pt-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Course Content</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Browse all modules and lessons in this course</p>
                            </div>
                            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                                {currentCourse.modules?.length || 0} Modules • {allCourseLessons.length} Total Lessons
                            </span>
                        </div>

                        <div className="flex flex-col gap-3">
                            {currentCourse.modules?.map((module, i) => (
                                <div
                                    key={module._id || i}
                                    className={`group border rounded-2xl transition-all duration-300 overflow-hidden bg-white
                                        ${activeAccordion === (module._id || i) ? 'border-blue-400 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}
                                >
                                    <button
                                        onClick={() => setActiveAccordion(activeAccordion === (module._id || i) ? null : (module._id || i))}
                                        className="w-full flex items-center justify-between p-5 sm:p-6 text-left hover:bg-slate-50/70 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all
                                                ${activeAccordion === (module._id || i) ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'}`}>
                                                {String(i + 1).padStart(2, '0')}
                                            </div>
                                            <div>
                                                <h3 className="font-inter font-semibold text-base sm:text-lg text-slate-900 tracking-tight">
                                                    {sanitizeDisplay(module.title)}
                                                </h3>
                                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                                    {module.lessons?.length || 0} Lessons
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`transition-transform duration-300 ${activeAccordion === (module._id || i) ? 'rotate-180 text-blue-600' : 'text-slate-400'}`}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
                                        </div>
                                    </button>

                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateRows: activeAccordion === (module._id || i) ? '1fr' : '0fr',
                                            transition: 'grid-template-rows 0.3s ease-in-out, opacity 0.3s ease-in-out',
                                            opacity: activeAccordion === (module._id || i) ? 1 : 0
                                        }}
                                    >
                                        <div className="overflow-hidden">
                                            <div className="border-t border-slate-100 divide-y divide-slate-100">
                                                {module.lessons?.map((lesson, li) => {
                                                    const lid = lesson._id || lesson.id || li;
                                                    const status = dripStatuses[lid] || {};
                                                    const progress = status.progress ?? lesson.progress ?? 0;
                                                    const unlocked = typeof status.unlocked === 'boolean' ? status.unlocked : true;
                                                    return (
                                                        <LessonTrackItem
                                                            key={lesson._id || li}
                                                            title={lesson.title}
                                                            type={lesson.type}
                                                            progress={progress}
                                                            unlocked={unlocked}
                                                            isActive={selectedLesson?._id === lesson._id}
                                                            onPlay={() => handleLessonPlay(lesson)}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* Modals */}
            <MobileExclusiveModal
                isOpen={isMobileModalOpen}
                onClose={() => setIsMobileModalOpen(false)}
            />
            <LockedModal isOpen={lockedModalOpen} onClose={() => setLockedModalOpen(false)} message={lockedModalMessage} />

            {/* SECURITY WARNING MODAL */}
            {securityWarning && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md px-4">
                    <div className="bg-dark border border-red-500/30 p-8 md:p-12 max-w-lg w-full relative overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.2)] group">
                        {/* Decorative background */}
                        <div className="absolute top-0 left-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />

                        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30 relative">
                                <div className="absolute inset-0 rounded-full border border-red-500 animate-ping opacity-20" />
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-red-500 stroke-red-500">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <line x1="12" y1="9" x2="12" y2="13" strokeWidth="2.5" strokeLinecap="round" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5" strokeLinecap="round" />
                                </svg>
                            </div>

                            <div className="space-y-2">
                                <p className="font-jetbrains text-[10px] text-red-500 uppercase tracking-[0.4em] font-black">Security Violation</p>
                                <h3 className="font-inter text-3xl md:text-4xl text-normal tracking-tight">Warning Issued.</h3>
                                <p className="font-jetbrains text-[11px] text-normal/70 uppercase tracking-widest mt-4 leading-relaxed">
                                    {securityWarning}
                                </p>
                            </div>

                            <button
                                onClick={() => setSecurityWarning('')}
                                className="mt-4 w-full bg-red-500/20 text-red-500 py-5 font-jetbrains text-xs font-black uppercase tracking-[0.4em] hover:bg-red-500/30 transition-all duration-300 border border-red-500/30"
                            >
                                Acknowledge
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardCoursePlayer;
