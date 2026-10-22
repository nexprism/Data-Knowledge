import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import ChatMessage from '../components/dashboard/ChatMessage';
import { useDispatch, useSelector } from 'react-redux';
import { useLanguage } from '../context/LanguageContext';
import { connectSocket, fetchChatRooms, fetchMessages, sendMessageSocket, setActiveRoom, pinMessage, fetchCourseRooms, fetchMoreMessages, removeCourseParticipant, clearNotification } from '../redux/slices/chat';
import authorizedFetch from '../utils/apiClient';

const DashboardMessages = () => {
    const [activeTab, setActiveTab] = useState('chats');
    const [filterTab, setFilterTab] = useState('all'); // 'all' or 'unread'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedChat, setSelectedChat] = useState(null);
    const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [attachments, setAttachments] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [volumes, setVolumes] = useState(new Array(30).fill(2));
    const [messages, setMessages] = useState({});
    const [supportRoom, setSupportRoom] = useState(null);
    const [supportAdmin, setSupportAdmin] = useState(null);

    const fileInputRef = useRef(null);
    const scrollRef = useRef(null);
    const containerRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationFrameRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const isTypingRef = useRef(false);
    const prevScrollHeightRef = useRef(0);
    const prevLengthRef = useRef(0);

    const dispatch = useDispatch();
    const { t } = useLanguage();
    const chatState = useSelector((s) => s.chat || {});
    const authUser = useSelector((s) => s.auth?.user || null) || JSON.parse(localStorage.getItem('edrilla_user') || 'null');
    const rooms = chatState.rooms || [];
    const courseRooms = chatState.courseRooms || [];
    const messagePagination = chatState.messagePagination || {};
    const selectedRoom = [...rooms, ...courseRooms].find(r => r._id === selectedChat);
    const isCourseGroup = courseRooms.some(r => r._id === selectedChat);

    const getParticipantId = (p) => {
        if (!p) return null;
        if (typeof p === 'string') return p;
        return p._id || p.id || null;
    };

    const getRoomTime = (room) => {
        if (!room) return 0;
        if (room.lastMessage?.createdAt) return new Date(room.lastMessage.createdAt).getTime();
        if (room.updatedAt) return new Date(room.updatedAt).getTime();
        if (room.createdAt) return new Date(room.createdAt).getTime();
        return 0;
    };

    // Preload support room on mount so student side is immediately ready
    useEffect(() => {
        authorizedFetch('/chat/support-room')
            .then(res => res.json())
            .then(data => {
                if (data?.room) {
                    setSupportRoom(data.room);
                    if (data.supportUser) setSupportAdmin(data.supportUser);
                }
            })
            .catch(err => console.error('[CHAT_DEBUG] Preload support room failed:', err));
    }, []);

    let sidebarChats = [];
    const activeRooms = activeTab === 'groups' ? (chatState.courseRooms || []) : (chatState.rooms || []);

    if (activeRooms && activeRooms.length > 0) {
        const mapped = activeRooms.map(r => {
            const participants = r.participants || [];
            const other = participants.find(p => {
                const pid = getParticipantId(p);
                return pid && String(pid) !== String(authUser?._id || authUser?.id);
            }) || participants[0] || { fullName: 'Conversation' };

            const otherRole = typeof other === 'object' ? other.role : '';
            const otherEmail = typeof other === 'object' ? other.email : '';
            const otherId = getParticipantId(other);

            const isSupportParticipant = otherRole === 'admin' || otherRole === 'super_admin' || otherId === '6abb692e25772f64168dbc34' || otherId === '68e38debe4d3380f23ae42a3' || otherEmail === 'admin@dataknowledge.in' || otherEmail === 'sahil@lapaas.com';
            const isSupportRoom = !!r.isSupport || /support/i.test(r.name || '') || isSupportParticipant || (supportRoom?._id && r._id === supportRoom._id);

            let displayName = r.courseId?.title || r.name || other.fullName || other.email || 'Conversation';
            if (isSupportRoom && !r.name) displayName = 'Support Team';

            const initialsBase = other.fullName || displayName || '??';
            const initials = isSupportRoom ? '🛠️' : (initialsBase || '??')
                .split(' ')
                .map(n => n[0] || '')
                .join('')
                .slice(0, 2)
                .toUpperCase() || '??';

            return {
                id: r._id,
                initials,
                name: displayName,
                lastMsg: r.lastMessage?.message || 'No messages yet',
                status: r.online ? 'online' : 'offline',
                unread: r.unreadCount || 0,
                isSupport: isSupportRoom,
                rawRoom: r
            };
        });

        let sorted = [...mapped].sort((a, b) => {
            const timeA = getRoomTime(a.rawRoom);
            const timeB = getRoomTime(b.rawRoom);
            return timeB - timeA;
        });

        if (filterTab === 'unread') {
            sorted = sorted.filter(a => a.unread > 0);
        }

        if (activeTab === 'chats') {
            const existingSupport = sorted.find(m => m.isSupport || (supportRoom?._id && m.id === supportRoom._id));
            if (existingSupport) {
                const withoutSupport = sorted.filter(m => m.id !== existingSupport.id);
                sidebarChats = [existingSupport, ...withoutSupport];
            } else {
                const syntheticSupport = {
                    id: supportRoom?._id || 'support',
                    initials: '🛠️',
                    name: 'Support Team',
                    lastMsg: '👋 Welcome! How can we help you?',
                    status: 'online',
                    unread: 0,
                    isSupport: true
                };
                sidebarChats = [syntheticSupport, ...sorted];
            }
        } else {
            sidebarChats = sorted;
        }
    } else if (activeTab === 'chats') {
        const syntheticSupport = {
            id: supportRoom?._id || 'support',
            initials: '🛠️',
            name: 'Support Team',
            lastMsg: '👋 Welcome! How can we help you?',
            status: 'online',
            unread: 0,
            isSupport: true
        };
        sidebarChats = [syntheticSupport];
    } else {
        sidebarChats = [];
    }

    const filteredChats = sidebarChats.filter(chat => {
        const query = searchQuery.toLowerCase();
        return chat.name.toLowerCase().includes(query) ||
            chat.lastMsg.toLowerCase().includes(query);
    });

    const messagesFromStore = chatState.messages || {};
    const rawMessages = messagesFromStore[selectedChat] || messages[selectedChat] || [];

    // Deduplicate:
    // 1. Drop duplicate message IDs
    // 2. Drop optimistic temp messages if a confirmed message with the same content exists
    const seenIds = new Set();
    const confirmedTexts = new Set();

    rawMessages.forEach(m => {
        const id = m._id || m.id;
        const isTemp = String(id || '').startsWith('temp-');
        if (!isTemp) {
            const txt = (m.message || m.text || m.body || m.content || '').trim();
            if (txt) confirmedTexts.add(txt);
        }
    });

    const deduplicated = rawMessages.filter(m => {
        const id = m._id || m.id;
        if (id && seenIds.has(id)) return false;
        if (id) seenIds.add(id);

        const isTemp = String(id || '').startsWith('temp-');
        if (isTemp) {
            const txt = (m.message || m.text || m.body || m.content || '').trim();
            if (txt && confirmedTexts.has(txt)) return false;
        }
        return true;
    });

    const messagesForSelected = [...deduplicated].sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : (a.id || 0);
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : (b.id || 0);
        return ta - tb;
    });

    const emojis = [
        '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦿', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'
    ];

    useEffect(() => {
        if (activeTab === 'groups') {
            dispatch(fetchCourseRooms());
        }
    }, [activeTab, dispatch]);

    useEffect(() => {
        if (chatState.notification) {
            const t = setTimeout(() => dispatch(clearNotification()), 3000);
            return () => clearTimeout(t);
        }
    }, [chatState.notification, dispatch]);

    useEffect(() => {
        window.scrollTo(0, 0);
        dispatch(connectSocket());
        dispatch(fetchChatRooms());
        const ctx = gsap.context(() => {
            gsap.fromTo('.chat-reveal',
                { x: -10, opacity: 1 },
                { x: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: 'power2.out' }
            );
        }, containerRef);
        return () => {
            ctx.revert();
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [dispatch]);

    useEffect(() => {
        if (!selectedChat && sidebarChats && sidebarChats.length > 0) {
            const target = sidebarChats[0];
            setSelectedChat(target.id);
            dispatch(setActiveRoom(target.id));
            if (/^[0-9a-fA-F]{24}$/.test(target.id)) {
                dispatch(fetchMessages(target.id));
            }
        } else if (selectedChat === 'support' && supportRoom?._id) {
            setSelectedChat(supportRoom._id);
            dispatch(setActiveRoom(supportRoom._id));
            dispatch(fetchMessages(supportRoom._id));
        }
    }, [sidebarChats, selectedChat, supportRoom, dispatch]);

    useEffect(() => {
        if (selectedChat && /^[0-9a-fA-F]{24}$/.test(selectedChat)) {
            dispatch(setActiveRoom(selectedChat));
            dispatch(fetchMessages(selectedChat));
            import('../services/socketService').then(m => {
                if (m.default?.socket) {
                    m.default.socket.emit('joinRoom', { roomId: selectedChat });
                }
            }).catch(() => {});
        }
    }, [selectedChat, dispatch]);

    useEffect(() => {
        let interval;
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } else {
            setRecordingTime(0);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const [replyingTo, setReplyingTo] = useState(null);
    const [showParticipants, setShowParticipants] = useState(false);
    const [participantSearch, setParticipantSearch] = useState('');
    const [showAllParticipants, setShowAllParticipants] = useState(false);

    const performSendMessage = async (text = '', files = []) => {
        if (!text.trim() && files.length === 0) return;

        let roomId = selectedChat;
        let receiverId = null;

        // If support chat or missing room ID, resolve support room
        if (!roomId || roomId === 'support' || (supportRoom?._id && roomId === supportRoom._id)) {
            let activeSupport = supportRoom;
            if (!activeSupport) {
                try {
                    const response = await authorizedFetch('/chat/support-room');
                    const data = await response.json();
                    if (data?.room?._id) {
                        activeSupport = data.room;
                        setSupportRoom(data.room);
                        if (data.supportUser) setSupportAdmin(data.supportUser);
                    }
                } catch (error) {
                    console.error('[CHAT_DEBUG] Support room resolution failed:', error);
                }
            }

            if (activeSupport) {
                roomId = activeSupport._id;
                setSelectedChat(roomId);
                dispatch(setActiveRoom(roomId));

                const myId = authUser?._id || authUser?.id;
                const other = (activeSupport.participants || []).find(p => {
                    const pid = getParticipantId(p);
                    return pid && String(pid) !== String(myId);
                });
                receiverId = getParticipantId(other) || getParticipantId(supportAdmin) || '6abb692e25772f64168dbc34';
            }
        } else {
            const allRooms = [...(chatState.rooms || []), ...(chatState.courseRooms || [])];
            const found = allRooms.find(r => r._id === roomId);
            if (found) {
                const myId = authUser?._id || authUser?.id;
                const other = (found.participants || []).find(p => {
                    const pid = getParticipantId(p);
                    return pid && String(pid) !== String(myId);
                });
                receiverId = getParticipantId(other);
            }
        }

        if (!roomId) {
            console.error('[CHAT_DEBUG] Cannot send without a room ID');
            return;
        }

        const payload = {
            roomId,
            receiverId,
            message: text,
            files: files,
            replyTo: replyingTo?._id
        };

        dispatch(sendMessageSocket(payload));
        dispatch(fetchChatRooms());

        setMessageInput('');
        setAttachments([]);
        setReplyingTo(null);
        setShowEmojiPicker(false);

        try {
            const { default: socketService } = await import('../services/socketService');
            if (socketService.socket) {
                socketService.socket.emit('typing_stop', { roomId: payload.roomId });
            }
        } catch (e) { }
    };

    const handleSendMessage = () => {
        performSendMessage(messageInput, attachments.map(a => a.file).filter(Boolean));
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        const newAttachments = files.map(file => {
            const fileName = file.name.toLowerCase();
            const isImage = file.type.startsWith('image/') ||
                /\.(jpg|jpeg|png|gif|webp|jfif|bmp|svg)$/.test(fileName);
            const isAudio = file.type.startsWith('audio/') || file.type === 'voice' ||
                /\.(mp3|wav|ogg|m4a|webm)$/.test(fileName);
            const previewUrl = (isImage || isAudio) ? URL.createObjectURL(file) : null;

            return {
                file: file,
                name: file.name,
                size: (file.size / 1024).toFixed(1) + ' KB',
                type: file.type,
                preview: previewUrl
            };
        });
        setAttachments(prev => [...prev, ...newAttachments]);
    };

    const insertEmoji = (emoji) => {
        setMessageInput(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setMessageInput(val);

        if (!isTypingRef.current) {
            isTypingRef.current = true;
            import('../services/socketService').then(mod => {
                try { mod.default.socket && mod.default.socket.emit('typing_start', { roomId: selectedChat }); } catch (e) { }
            }).catch(() => { });
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false;
            import('../services/socketService').then(mod => {
                try { mod.default.socket && mod.default.socket.emit('typing_stop', { roomId: selectedChat }); } catch (e) { }
            }).catch(() => { });
        }, 2000);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);

            audioContextRef.current = audioCtx;
            analyserRef.current = analyser;

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const updateWaveform = () => {
                analyser.getByteFrequencyData(dataArray);
                const newVolumes = Array.from(dataArray).slice(0, 30).map(v => Math.max(2, v / 4));
                setVolumes(newVolumes);
                animationFrameRef.current = requestAnimationFrame(updateWaveform);
            };
            updateWaveform();

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], `voice_recording_${Date.now()}.webm`, { type: 'audio/webm' });
                performSendMessage('', [audioFile]);

                stream.getTracks().forEach(track => track.stop());
                if (audioContextRef.current) audioContextRef.current.close();
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Microphone access denied:", err);
            alert("Microphone access is required to record audio.");
        }
    };

    const stopRecording = (save = true) => {
        if (!mediaRecorderRef.current) return;

        if (save) {
            mediaRecorderRef.current.stop();
        } else {
            mediaRecorderRef.current.onstop = null;
            mediaRecorderRef.current.stop();
            const stream = mediaRecorderRef.current.stream;
            stream.getTracks().forEach(track => track.stop());
            if (audioContextRef.current) audioContextRef.current.close();
        }

        setIsRecording(false);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        setVolumes(new Array(30).fill(2));
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const selectChat = async (id) => {
        let realRoomId = id;
        if (id === 'support' || (supportRoom?._id && id === supportRoom._id)) {
            if (supportRoom?._id) {
                realRoomId = supportRoom._id;
            } else {
                try {
                    const res = await authorizedFetch('/chat/support-room');
                    const data = await res.json();
                    if (data?.room?._id) {
                        realRoomId = data.room._id;
                        setSupportRoom(data.room);
                        if (data.supportUser) setSupportAdmin(data.supportUser);
                    }
                } catch (e) {
                    console.error('[CHAT_DEBUG] Error resolving support room in selectChat:', e);
                }
            }
        }
        setSelectedChat(realRoomId);
        setIsMobileChatOpen(true);
        dispatch(setActiveRoom(realRoomId));
        if (/^[0-9a-fA-F]{24}$/.test(realRoomId)) {
            dispatch(fetchMessages(realRoomId));
        }
    };

    const handleMessagesScroll = (e) => {
        const container = e.currentTarget;
        if (container.scrollTop > 80) return;
        const looksLikeObjectId = typeof selectedChat === 'string' && /^[0-9a-fA-F]{24}$/.test(selectedChat);
        if (!looksLikeObjectId) return;
        const pagination = messagePagination[selectedChat];
        if (!pagination) return;
        if (!pagination.hasMore || pagination.loadingMore) return;

        const nextPage = pagination.page + 1;
        prevScrollHeightRef.current = container.scrollHeight;
        dispatch(fetchMoreMessages({ roomId: selectedChat, page: nextPage }));
    };

    useEffect(() => {
        if (!scrollRef.current) return;
        const pagination = messagePagination[selectedChat];
        if (!pagination || !pagination.loadingMore === false) return;
        const prevHeight = prevScrollHeightRef.current;
        if (prevHeight > 0) {
            const newHeight = scrollRef.current.scrollHeight;
            scrollRef.current.scrollTop = newHeight - prevHeight;
            prevScrollHeightRef.current = 0;
        }
    }, [chatState.messages]);

    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        const pagination = messagePagination[selectedChat];
        if (pagination?.loadingMore) return;

        const currentLength = messagesForSelected.length;
        if (currentLength === 0) {
            prevLengthRef.current = 0;
            return;
        }

        const isRoomSwitch = prevLengthRef.current === 0;
        const lastMsg = messagesForSelected[currentLength - 1];
        const isMe = lastMsg && (
            lastMsg.sender === 'me' || 
            lastMsg.senderId === authUser?._id || 
            (typeof lastMsg.sender === 'object' && lastMsg.sender?._id === authUser?._id)
        );
        const isNearBottom = container.scrollHeight - container.clientHeight - container.scrollTop < 250;

        if (isRoomSwitch || isMe || isNearBottom || currentLength <= 10) {
            setTimeout(() => {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: isRoomSwitch ? 'auto' : 'smooth'
                });
            }, 50);
        }

        prevLengthRef.current = currentLength;
    }, [messagesForSelected, selectedChat, authUser]);

    return (
        <div ref={containerRef} className="h-screen bg-slate-50 text-slate-900 flex flex-col overflow-hidden">
            <DashboardHeader />

            <div className="flex-1 pt-20 flex overflow-hidden relative">

                {/* Sidebar (Responsive Toggle) */}
                <aside className={`absolute inset-0 z-20 md:relative md:flex md:inset-auto w-full md:w-80 border-r border-slate-200/80 flex-col bg-white transition-transform duration-500 ease-out-quint
                    ${isMobileChatOpen ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}>

                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h1 className="font-inter text-2xl font-bold text-slate-900">{t('messagesTitle') || 'Messages'}</h1>
                            <div className="font-jetbrains text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t('activeChats') || 'Active chats:'} {rooms.length}</div>
                        </div>

                        {/* Tabs */}
                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                            <button
                                onClick={() => setActiveTab('chats')}
                                className={`flex-1 py-2 rounded-lg font-jetbrains text-xs uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'chats' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}`}
                            >
                                {t('chatsTab') || 'CHATS'}
                            </button>
                            <button
                                onClick={() => setActiveTab('groups')}
                                className={`flex-1 py-2 rounded-lg font-jetbrains text-xs uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'groups' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}`}
                            >
                                {t('groupsTab') || 'GROUPS'}
                            </button>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                            <input
                                type="text"
                                placeholder={t('searchMessages') || 'Search messages...'}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-amber-500 transition-all font-jetbrains text-xs text-slate-900 placeholder:text-slate-400"
                            />
                        </div>

                        {/* Sub-tabs: All / Unread */}
                        <div className="flex border-b border-slate-200 mt-2">
                            <button
                                onClick={() => setFilterTab('all')}
                                className={`flex-1 pb-3 text-center font-jetbrains text-[11px] uppercase tracking-wider transition-all border-b-2 cursor-pointer ${filterTab === 'all' ? 'border-amber-500 text-amber-900 font-black' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
                            >
                                {t('allFilter') || 'ALL'}
                            </button>
                            <button
                                onClick={() => setFilterTab('unread')}
                                className={`flex-1 pb-3 text-center font-jetbrains text-[11px] uppercase tracking-wider transition-all border-b-2 cursor-pointer ${filterTab === 'unread' ? 'border-amber-500 text-amber-900 font-black' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
                            >
                                {t('unreadFilter') || 'UNREAD'} {sidebarChats.filter(c => c.unread > 0).length > 0 && `(${sidebarChats.filter(c => c.unread > 0).length})`}
                            </button>
                        </div>
                    </div>

                    {/* Chat List */}
                    <div className="flex-1 overflow-y-auto no-scrollbar px-3 space-y-1 pb-10" data-lenis-prevent>
                        {chatState.loading && (
                            <div className="flex flex-col items-center justify-center py-10 gap-3 opacity-60">
                                <div className="w-7 h-7 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                                <span className="font-jetbrains text-xs tracking-wider text-slate-600">{t('loadingChats') || 'Loading chats...'}</span>
                            </div>
                        )}

                        {chatState.error && !chatState.loading && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
                                <p className="font-jetbrains text-xs text-red-600 font-bold mb-1">{t('connectionError') || 'Connection Error'}</p>
                                <p className="font-jetbrains text-xs text-red-500/80 leading-relaxed mb-3">{chatState.error}</p>
                                <button
                                    onClick={() => dispatch(fetchChatRooms())}
                                    className="w-full py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-jetbrains text-xs font-bold uppercase tracking-wider transition-all"
                                >
                                    {t('retryBtn') || 'RETRY'}
                                </button>
                            </div>
                        )}

                        {chatState.socketError && !chatState.socketLoading && (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                                <p className="font-jetbrains text-xs text-amber-700 font-bold mb-1">{t('connectionError') || 'Connection Error'}</p>
                                <p className="font-jetbrains text-xs text-amber-600 leading-relaxed mb-3">{chatState.socketError}</p>
                                <button
                                    onClick={() => dispatch(connectSocket())}
                                    className="w-full py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg font-jetbrains text-xs font-bold uppercase tracking-wider transition-all"
                                >
                                    {t('reconnectBtn') || 'RECONNECT'}
                                </button>
                            </div>
                        )}

                        {filteredChats.length === 0 && !chatState.loading && (
                            <div className="flex flex-col items-center justify-center py-10 opacity-50">
                                <p className="font-inter text-sm text-slate-500">{t('noMessagesFound') || 'No messages found'}</p>
                            </div>
                        )}

                        {filteredChats.map((chat) => (
                            <button
                                key={chat.id}
                                onClick={() => selectChat(chat.id)}
                                className={`w-full p-3.5 rounded-xl flex items-center gap-3.5 transition-all group ${selectedChat === chat.id ? 'bg-amber-50 border border-amber-200 shadow-sm' : 'hover:bg-slate-50'}`}
                            >
                                <div className="relative shrink-0">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-jetbrains text-xs font-bold shrink-0 ${chat.isSupport ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-amber-100 text-amber-900 border-amber-300'} border`}>
                                        {chat.initials}
                                    </div>
                                    {chat.status === 'online' && (
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                                    )}
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <h4 className="font-jetbrains text-xs font-bold text-slate-900 truncate">{chat.name}</h4>
                                    <p className="font-jetbrains text-[11px] text-slate-500 truncate mt-0.5">{chat.lastMsg}</p>
                                </div>
                                {chat.unread > 0 && (
                                    <div className="w-5 h-5 bg-amber-400 text-slate-950 text-[9px] font-black rounded-full flex items-center justify-center shrink-0 shadow-sm">
                                        {chat.unread}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Main Chat Area */}
                <main className={`absolute md:relative inset-0 flex-1 flex flex-col bg-slate-50 transition-transform duration-500 ease-out-quint z-30 overflow-x-hidden max-w-full
                    ${isMobileChatOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>

                    {/* Notification Toast */}
                    {chatState.notification && (
                        <div className={`absolute top-0 left-0 right-0 z-50 px-4 py-3 font-jetbrains text-xs font-bold uppercase tracking-wider flex items-center justify-between animate-in slide-in-from-top-2 duration-300 ${chatState.notification.type === 'success' ? 'bg-amber-400 text-slate-950' : 'bg-red-600 text-white'}`}>
                            <span>{chatState.notification.message}</span>
                            <button onClick={() => dispatch(clearNotification())} className="p-1 hover:opacity-70 transition-opacity">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                        </div>
                    )}
                    {/* Header Terminal */}
                    <div className="sticky top-0 z-40 p-4 md:p-5 border-b border-slate-200/80 flex items-center justify-between bg-white backdrop-blur-2xl shadow-sm">
                        <div className="flex items-center gap-4">
                            {/* Mobile Back Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMobileChatOpen(false);
                                }}
                                className="md:hidden w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-amber-400 hover:text-slate-950 transition-all"
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6" /></svg>
                            </button>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-900 border border-amber-300 text-base font-bold shadow-sm">
                                    {sidebarChats.find(c => c.id === selectedChat)?.initials || '🛠️'}
                                </div>
                                <div>
                                    <h3 className="font-inter font-bold text-lg md:text-xl text-slate-900 leading-none mb-1">
                                        {sidebarChats.find(c => c.id === selectedChat)?.name || 'Support Team'}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full animate-pulse ${chatState.socketConnected ? 'bg-green-500' :
                                            chatState.socketLoading ? 'bg-amber-500' : 'bg-red-500'
                                            }`} />
                                        <span className={`font-jetbrains text-[10px] uppercase tracking-wider font-bold ${chatState.socketConnected ? 'text-green-700' :
                                            chatState.socketLoading ? 'text-amber-700' : 'text-red-600'
                                            }`}>
                                            {chatState.socketConnected ? (t('online') || 'Online') :
                                                chatState.socketLoading ? (t('connecting') || 'Connecting...') : (t('offline') || 'Offline')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {isCourseGroup && (
                                <div className="relative">
                                    <button
                                        onClick={() => setShowParticipants(!showParticipants)}
                                        className="flex items-center gap-2 text-slate-700 hover:text-slate-950 transition-colors px-4 py-2 hover:bg-slate-100 rounded-xl border border-slate-200 font-jetbrains text-xs font-bold uppercase tracking-wider"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                        <span className="font-jetbrains text-xs uppercase font-bold tracking-wider">{t('participants') || 'PARTICIPANTS'}</span>
                                    </button>
                                    {showParticipants && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => { setShowParticipants(false); setParticipantSearch(''); setShowAllParticipants(false); }} />
                                            <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl z-50">
                                                <div className="p-3 border-b border-slate-200 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-montserrat text-xs text-accent uppercase tracking-wider font-bold">Participants ({(selectedRoom?.participants || []).length})</span>
                                                    </div>
                                                    <div className="relative">
                                                        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                                                        <input
                                                            type="text"
                                                            value={participantSearch}
                                                            onChange={(e) => { setParticipantSearch(e.target.value); setShowAllParticipants(true); }}
                                                            placeholder="Search participants..."
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-8 pr-2 outline-none font-montserrat text-[11px] text-slate-900 placeholder:text-slate-400"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="max-h-64 overflow-y-auto overflow-x-hidden scrollbar-thin">
                                                    {(selectedRoom?.participants || [])
                                                        .filter(p => {
                                                            const q = participantSearch.toLowerCase();
                                                            if (!q) return true;
                                                            return (p.fullName || p.name || p.email || '').toLowerCase().includes(q);
                                                        })
                                                        .filter((_, i) => showAllParticipants || i < 5)
                                                        .map(p => (
                                                            <div key={p._id} className="flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 group transition-colors cursor-default">
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-900 border border-amber-300 text-xs font-bold shrink-0 shadow-sm">
                                                                        {(p.fullName || p.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                                    </div>
                                                                    <span className="font-montserrat text-xs font-bold text-slate-800 truncate">{p.fullName || p.name || p.email || 'Unknown'}</span>
                                                                </div>
                                                                {p._id !== authUser?._id && (
                                                                    <button
                                                                        onClick={() => {
                                                                            dispatch(removeCourseParticipant({ roomId: selectedChat, participantId: p._id }));
                                                                            setShowParticipants(false);
                                                                            setParticipantSearch('');
                                                                            setShowAllParticipants(false);
                                                                        }}
                                                                        className="p-1.5 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-none opacity-0 group-hover:opacity-100 transition-all"
                                                                        title="Remove participant"
                                                                    >
                                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    {!showAllParticipants && (selectedRoom?.participants || []).length > 5 && (
                                                        <button
                                                            onClick={() => setShowAllParticipants(true)}
                                                            className="w-full py-2.5 text-center font-montserrat text-[11px] text-amber-700 font-bold hover:bg-slate-50 uppercase tracking-wider transition-all border-t border-slate-200 rounded-b-xl"
                                                        >
                                                            Show all ({(selectedRoom?.participants || []).length})
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                            <button className="hidden md:flex items-center gap-2 text-red-500/30 hover:text-red-500 transition-colors group px-4 py-2 hover:bg-red-500/5 rounded-none border border-white/5">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                <span className="font-montserrat text-xs uppercase font-bold tracking-wider">Clear Chat</span>
                            </button>
                        </div>
                    </div>

                    {/* Messages Window */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto no-scrollbar px-3 pb-3 md:px-4 md:pb-4 pt-0 space-y-2 relative"
                        data-lenis-prevent
                        onScroll={handleMessagesScroll}
                    >
                        {/* Load-more spinner at top */}
                        {messagePagination[selectedChat]?.loadingMore && (
                            <div className="flex justify-center py-3">
                                <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                            </div>
                        )}
                        {/* WhatsApp Style Pinned Bar */}
                        {messagesForSelected.filter(m => m.isPinned).length > 0 && (
                            <div className="sticky top-0 left-0 right-0 z-30 mb-2 -mt-4 animate-in slide-in-from-top-2 duration-300">
                                <div
                                    className="bg-black/80 backdrop-blur-xl border-b border-white/10 flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-white/[0.02] transition-all"
                                    onClick={() => {
                                        const pinned = messagesForSelected.filter(m => m.isPinned).pop();
                                        console.debug('Navigate to pinned:', pinned._id);
                                    }}
                                >
                                    <div className="text-accent shrink-0">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 9V4l1 1V2H7v3l1-1v5L6 12v2h5v7l1 1 1-1v-7h5v-2l-2-3z" /></svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-montserrat text-xs text-white/80 truncate">
                                            {messagesForSelected.filter(m => m.isPinned).pop().message || 'Pinned Message'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const latest = messagesForSelected.filter(m => m.isPinned).pop();
                                            dispatch(pinMessage({ messageId: latest._id, isPinned: false }));
                                        }}
                                        className="p-1 hover:bg-white/10 rounded-none text-white/40 hover:text-white transition-all"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="absolute top-10 left-1/2 -translate-x-1/2 opacity-10 pointer-events-none">
                            <svg width="400" height="400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                        </div>

                        {(messagesForSelected || []).length > 0 ? (
                            <div className="pt-3 md:pt-4 space-y-2">
                                {messagesForSelected.map((msg, idx) => {
                                    const getSenderId = (m) => {
                                        if (!m) return null;
                                        const s = m.sender;
                                        if (typeof s === 'object' && s !== null) {
                                            return s._id || s.id;
                                        }
                                        return s || m.senderId;
                                    };
                                    const getAuthUserId = (u) => {
                                        if (!u) return null;
                                        return u._id || u.id;
                                    };
                                    const senderId = getSenderId(msg);
                                    const currentUserId = getAuthUserId(authUser);
                                    const isTemp = String(msg._id || msg.id || '').startsWith('temp-');
                                    const isSent = Boolean(
                                        (currentUserId && senderId && String(senderId) === String(currentUserId)) ||
                                        (isTemp && (senderId === 'me' || !senderId || String(senderId) === String(currentUserId))) ||
                                        senderId === 'me' ||
                                        (typeof senderId === 'string' && senderId.toLowerCase() === 'you')
                                    );
                                    console.debug(`[CHAT_DEBUG] Rendering Message #${idx}:`, { text: msg.message || msg.text, isSent, senderId, currentUserId, id: msg._id });
                                    return (
                                        <ChatMessage
                                            key={msg._id || msg.id || idx}
                                            msg={msg}
                                            isSent={isSent}
                                            onReply={(m) => setReplyingTo(m)}
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-70">
                                <div className="w-16 h-16 bg-white/5 rounded-none flex items-center justify-center mb-4 border border-white/5">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                </div>
                                <p className="font-montserrat text-sm text-normal">
                                    {selectedChat ? "No messages yet. Send a message to start the conversation!" : "Select a conversation to start messaging"}
                                </p>
                                <p className="font-montserrat text-[11px] text-white/50 mt-1.5">Your messages are secure</p>
                            </div>
                        )}
                    </div>

                    {/* Typing Indicator */}
                    <div className="px-6 md:px-10">
                        {(chatState.typingUsers && chatState.typingUsers[selectedChat] && chatState.typingUsers[selectedChat].length > 0) && (
                            <div className="text-[11px] text-accent font-montserrat mb-2">{
                                (() => {
                                    const ids = chatState.typingUsers[selectedChat];
                                    const room = rooms.find(r => r._id === selectedChat) || {};
                                    const names = (room.participants || []).filter(p => ids.includes(p._id)).map(p => p.name).filter(Boolean);
                                    if (names.length === 0) return 'Someone is typing...';
                                    if (names.length === 1) return `${names[0]} is typing...`;
                                    return `${names.slice(0, 2).join(', ')} are typing...`;
                                })()
                            }</div>
                        )}
                    </div>

                    {/* Input Field */}
                    <div className="p-3 md:p-4 border-t border-slate-200/80 bg-white relative">
                        {/* Reply Preview */}
                        {replyingTo && (
                            <div className="absolute -top-12 left-0 right-0 p-2.5 bg-amber-50 border-t border-amber-200 backdrop-blur-md flex items-center justify-between animate-reveal-message z-20 shadow-sm">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-1 bg-amber-500 h-6 rounded-full" />
                                    <div className="min-w-0">
                                        <p className="text-[10px] text-amber-800 font-bold uppercase font-jetbrains">Replying to {replyingTo.senderName || 'Message'}</p>
                                        <p className="text-[11px] text-slate-600 truncate font-jetbrains">{replyingTo.message || replyingTo.text || 'Attachment'}</p>
                                    </div>
                                </div>
                                <button onClick={() => setReplyingTo(null)} className="p-2 hover:bg-slate-200/60 rounded-full text-slate-400 hover:text-slate-700 transition-all">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                </button>
                            </div>
                        )}
                        {/* Attachments Preview */}
                        {attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3 animate-reveal-message">
                                {attachments.map((file, i) => (
                                    <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
                                        <span className="font-jetbrains text-[11px] text-amber-900 font-bold uppercase truncate max-w-[100px]">{file.name}</span>
                                        <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-amber-600 hover:text-red-600 transition-colors">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="relative">
                            {/* Emoji Picker Overlay */}
                            {showEmojiPicker && (
                                <div className="absolute bottom-full mb-4 left-0 bg-white border border-slate-200 rounded-2xl p-3 shadow-2xl w-72 md:w-85 z-50">
                                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
                                        <span className="font-jetbrains text-[11px] text-amber-800 uppercase tracking-wider font-bold">Select Emoji</span>
                                        <button onClick={() => setShowEmojiPicker(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-6 md:grid-cols-8 gap-1 max-h-48 overflow-y-auto no-scrollbar pr-2" data-lenis-prevent>
                                        {emojis.map((emoji, i) => (
                                            <button
                                                key={i}
                                                onClick={() => insertEmoji(emoji)}
                                                className="text-lg hover:scale-125 transition-transform duration-200 p-1.5 bg-slate-50 hover:bg-amber-100 rounded-lg"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {isRecording ? (
                                <div className="bg-slate-50 border border-amber-300 rounded-full p-1.5 flex items-center gap-4 shadow-lg animate-reveal-message h-11 px-4">
                                    <button
                                        onClick={() => stopRecording(false)}
                                        className="text-slate-400 hover:text-red-600 transition-colors"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                    </button>

                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-sm" />
                                        <span className="font-jetbrains text-xs font-bold text-slate-900 min-w-[35px]">{formatTime(recordingTime)}</span>
                                    </div>

                                    {/* Waveform Visualization */}
                                    <div className="flex-1 flex justify-center items-center gap-[2px] h-8 overflow-hidden">
                                        {volumes.map((h, i) => (
                                            <div
                                                key={i}
                                                className="w-[2px] bg-amber-500 rounded-full transition-all duration-75"
                                                style={{ height: `${h * 0.7}px`, opacity: 0.3 + (h / 60) }}
                                            />
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => stopRecording(true)}
                                            className="w-9 h-9 bg-amber-400 text-slate-950 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-sm font-bold"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-100/90 border border-slate-200 rounded-full p-1 pl-2 flex items-center gap-2 md:gap-3 focus-within:border-amber-500 shadow-sm transition-all duration-300 h-11">
                                    <div className="flex items-center gap-0.5 pl-1">
                                        <button
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                            className={`w-8 h-8 flex items-center justify-center transition-colors duration-200 ${showEmojiPicker ? 'text-amber-600' : 'text-slate-400 hover:text-amber-700'}`}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
                                        </button>
                                        <input
                                            type="file"
                                            multiple
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => fileInputRef.current.click()}
                                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-amber-700 transition-colors duration-200"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                        </button>
                                    </div>

                                    <input
                                        type="text"
                                        value={messageInput}
                                        onChange={handleInputChange}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                                clearTimeout(typingTimeoutRef.current);
                                                import('../services/socketService').then(m => {
                                                    try { m.default.socket && m.default.socket.emit('typing_stop', { roomId: selectedChat }); } catch (err) { }
                                                }).catch(() => { });
                                            }
                                        }}
                                        placeholder={t('typeMessage') || 'Type a message...'}
                                        className="flex-1 bg-transparent py-2 outline-none font-jetbrains text-xs text-slate-900 placeholder:text-slate-400"
                                    />

                                    <div className="flex items-center gap-1 md:gap-1.5 pr-1">
                                        <button
                                            onClick={startRecording}
                                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-amber-700 transition-colors duration-200"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></svg>
                                        </button>
                                        <button
                                            onClick={handleSendMessage}
                                            className="w-9 h-9 bg-amber-400 text-slate-950 rounded-full flex items-center justify-center hover:scale-105 active:scale-90 transition-all duration-300 shadow-sm ml-1 font-bold"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardMessages;
