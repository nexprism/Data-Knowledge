import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { pinMessage, deleteMessage } from '../../redux/slices/chat';

const CustomAudioPlayer = ({ src }) => {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.load();

        const onTimeUpdate = () => setCurrentTime(audio.currentTime);
        const onLoadedMetadata = () => setDuration(audio.duration);
        const onEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('loadedmetadata', onLoadedMetadata);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);

        if (audio.duration) {
            setDuration(audio.duration);
        }

        return () => {
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
        };
    }, [src]);

    const togglePlay = (e) => {
        e.stopPropagation();
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play().catch(err => console.error("Audio play failed:", err));
        }
    };

    const handleSeek = (e) => {
        e.stopPropagation();
        const audio = audioRef.current;
        if (!audio) return;
        const val = parseFloat(e.target.value);
        audio.currentTime = val;
        setCurrentTime(val);
    };

    const formatTime = (time) => {
        if (isNaN(time)) return '0:00';
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className="flex flex-col w-full max-w-[280px] md:max-w-[320px] select-none p-1.5" onClick={e => e.stopPropagation()}>
            <audio ref={audioRef} src={src} preload="auto" />
            
            {/* Top Row: Play/Pause button + Seek line + Mic Badge */}
            <div className="flex items-center gap-3 w-full">
                {/* Play/Pause Button */}
                <button 
                    onClick={togglePlay}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors shrink-0"
                >
                    {isPlaying ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                    ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="7 5 19 12 7 19"/></svg>
                    )}
                </button>

                {/* Seek Bar container to vertically align range track */}
                <div className="flex-1 flex items-center h-8">
                    <input 
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full accent-accent bg-white/10 h-1 rounded-lg appearance-none cursor-pointer outline-none"
                        style={{
                            background: `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${(currentTime / (duration || 100)) * 100}%, rgba(255,255,255,0.1) ${(currentTime / (duration || 100)) * 100}%, rgba(255,255,255,0.1) 100%)`
                        }}
                    />
                </div>
                
                {/* Small microphone badge on the right, matching WhatsApp */}
                <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/></svg>
                </div>
            </div>

            {/* Bottom Row: Timestamp offset to start right under the track slider */}
            <div className="flex justify-between pl-11 pr-9 -mt-1.5">
                <span className="font-montserrat text-[9px] text-white/50 tracking-wider">
                    {formatTime(currentTime)} / {formatTime(duration)}
                </span>
            </div>
        </div>
    );
};

const ChatMessage = ({ msg, isSent, onReply }) => {
    const dispatch = useDispatch();
    const [copied, setCopied] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    const messages = useSelector(state => state.chat.messages[msg.roomId || msg.chatRoomId] || []);
    const replyToId = typeof msg.replyTo === 'object' ? (msg.replyTo?._id || msg.replyTo?.id) : msg.replyTo;
    const repliedMsg = replyToId ? messages.find(m => m._id === replyToId || m.id === replyToId) : null;
    
    // sender can be an object {_id, fullName, email} or a plain string/ID
    const senderObj = msg?.sender;
    const senderName = (typeof senderObj === 'object' && senderObj !== null)
        ? (senderObj.fullName || senderObj.name || senderObj.email || 'User')
        : (senderObj || msg?.senderId || msg?.senderName || 'System');
    const time = msg?.time || (msg?.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
    const text = msg?.text || msg?.message || '';
    let attachments = msg?.attachments || msg?.files || [];
    
    // Fallback: If no files array but a single fileUrl exists, normalize it into attachments
    if (attachments.length === 0 && msg?.fileUrl) {
        attachments = [{
            url: msg.fileUrl,
            name: msg.fileName || 'voice_recording.webm',
            type: msg.fileType || 'voice'
        }];
    }

    const handlePin = (e) => {
        e.stopPropagation();
        const mid = msg._id || msg.id;
        if (mid) {
            dispatch(pinMessage({ messageId: mid, isPinned: !msg.isPinned }));
        }
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        setShowDeleteConfirm(true);
    };

    const handleReply = (e) => {
        e.stopPropagation();
        if (onReply) onReply(msg);
    };

    const handleCopy = (e) => {
        e.stopPropagation();
        const textToCopy = msg?.text || msg?.message || '';
        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
            });
        }
    };

    const getAttachmentUrl = (file) => {
        const rawUrl = file?.url || file?.path || file?.urlPreview || file?.preview;
        if (!rawUrl) return '';
        if (rawUrl.startsWith('http') || rawUrl.startsWith('blob:')) {
            return rawUrl;
        }
        const rawBase = import.meta.env.VITE_IMAGE_URL || import.meta.env.VITE_BASE_URL || import.meta.env.VITE_API_BASE || 'https://api.dataknowledge.in';
        const baseUrl = rawBase.replace(/\/api\/v1\/?$/, '');
        return `${baseUrl}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
    };

    const imageAttachments = attachments.filter(file => {
        const fileName = String(file.name || '').toLowerCase();
        const fileType = String(file.type || '').toLowerCase();
        return fileType.startsWith('image/') || fileType === 'image' || 
               /\.(jpg|jpeg|png|gif|webp|jfif|bmp|svg)$/.test(fileName);
    });

    const otherAttachments = attachments.filter(file => {
        const fileName = String(file.name || '').toLowerCase();
        const fileType = String(file.type || '').toLowerCase();
        return !(fileType.startsWith('image/') || fileType === 'image' || 
                 /\.(jpg|jpeg|png|gif|webp|jfif|bmp|svg)$/.test(fileName));
    });

    const getRepliedContent = () => {
        if (!msg.replyTo) return null;
        if (!repliedMsg) {
            const isObj = typeof msg.replyTo === 'object' && msg.replyTo !== null;
            const name = isObj ? (msg.replyTo.senderName || 'User') : 'User';
            const text = isObj ? (msg.replyTo.message || msg.replyTo.text || 'Attachment') : 'previous message';
            return { name, text };
        }
        
        const sender = repliedMsg.sender;
        const name = (typeof sender === 'object' && sender !== null)
            ? (sender.fullName || sender.name || sender.email || 'User')
            : (sender === 'me' ? 'You' : (sender || repliedMsg.senderId || repliedMsg.senderName || 'User'));
            
        const text = repliedMsg.text || repliedMsg.message || '';
        let files = repliedMsg.attachments || repliedMsg.files || [];
        if (files.length === 0 && repliedMsg.fileUrl) {
            files = [{
                url: repliedMsg.fileUrl,
                name: repliedMsg.fileName || 'attachment',
                type: repliedMsg.fileType || ''
            }];
        }
        
        let mediaText = '';
        let mediaThumbnail = null;
        
        if (files.length > 0) {
            const firstFile = files[0];
            const fileName = String(firstFile.name || '').toLowerCase();
            const fileType = String(firstFile.type || '').toLowerCase();
            const isImage = fileType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|jfif|bmp|svg)$/.test(fileName);
            const isAudio = fileType.startsWith('audio/') || fileType === 'voice' || /\.(mp3|wav|ogg|m4a|webm)$/.test(fileName);
            
            if (isImage) {
                mediaText = files.length > 1 ? `📷 ${files.length} Photos` : '📷 Photo';
                mediaThumbnail = getAttachmentUrl(firstFile);
            } else if (isAudio) {
                mediaText = '🎤 Voice Note';
            } else {
                mediaText = `📄 ${firstFile.name || 'File'}`;
            }
        }
        
        return {
            name,
            text,
            mediaText,
            mediaThumbnail
        };
    };

    const repliedContent = getRepliedContent();

    useEffect(() => {
        if (activeImageIndex === null) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setActiveImageIndex(null);
            if (e.key === 'ArrowLeft' && activeImageIndex > 0) setActiveImageIndex(prev => prev - 1);
            if (e.key === 'ArrowRight' && activeImageIndex < imageAttachments.length - 1) setActiveImageIndex(prev => prev + 1);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeImageIndex, imageAttachments.length]);

    return (
        <div className={`w-full flex flex-col ${isSent ? 'items-end' : 'items-start'} mb-2 group`}>
            {/* Meta Info */}
            <div className="flex items-center gap-3 mb-1 px-1">
                {!isSent && <span className="font-montserrat text-[8.5px] text-amber-700 uppercase font-bold tracking-widest">{senderName}</span>}
                <span className="font-montserrat text-[8.5px] text-slate-500 uppercase tracking-widest">{time}</span>
                {isSent && (
                    <span className="font-montserrat text-[8.5px] text-slate-600 uppercase font-bold tracking-widest">
                        {(msg._id?.startsWith?.('temp-') || msg.id?.startsWith?.('temp-')) && msg.status === 'sending' ? 'Sending...' : 'You'}
                    </span>
                )}
                {msg.isPinned && (
                    <span className="text-amber-600 animate-pulse" title="Pinned Message">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M16 9V4l1 1V2H7v3l1-1v5L6 12v2h5v7l1 1 1-1v-7h5v-2l-2-3z"/></svg>
                    </span>
                )}
            </div>

            {/* Message Bubble */}
            <div className={`relative max-w-[75%] md:max-w-[60%] p-3.5 shadow-sm transition-all duration-300 hover:shadow-md ease-out
                ${isSent ? 'bg-amber-100/90 border border-amber-300 text-slate-950 rounded-2xl rounded-tr-none' : 'bg-white border border-slate-200 text-slate-900 rounded-2xl rounded-tl-none'}`}>
                
                {showDeleteConfirm && createPortal(
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}>
                        <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-[240px] p-5 shadow-2xl animate-reveal-message relative overflow-hidden" onClick={e => e.stopPropagation()}>
                            {/* Title & Icon Header */}
                            <div className="flex items-center gap-2 mb-2.5">
                                <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                </div>
                                <h3 className="font-montserrat font-bold text-xs tracking-wider uppercase text-slate-900">Delete?</h3>
                            </div>
                            
                            {/* Alert Content */}
                            <p className="font-montserrat text-[10px] text-slate-600 leading-relaxed mb-4">
                                Are you sure? This is permanent.
                            </p>
                            
                            {/* Actions Panel */}
                            <div className="flex justify-end gap-2">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
                                    className="px-3 py-1.5 text-[9px] uppercase font-montserrat tracking-widest text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all font-bold cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowDeleteConfirm(false);
                                        const mid = msg._id || msg.id;
                                        if (mid) dispatch(deleteMessage(mid));
                                    }}
                                    className="px-3 py-1.5 text-[9px] uppercase font-montserrat tracking-widest text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all font-black shadow-sm cursor-pointer"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
                
                {/* Actions Overlay */}
                <div className={`absolute -top-4 ${isSent ? 'right-2' : 'left-2'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-lg z-10 shadow-lg`}>
                    <button onClick={handleReply} title="Reply" className="p-1 text-slate-700 hover:text-amber-600 transition-colors"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg></button>
                    <button onClick={handleCopy} title="Copy" className={`p-1 text-slate-700 hover:text-amber-600 transition-colors ${copied ? 'text-amber-600' : ''}`}>
                        {copied ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="0" ry="0"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                        )}
                    </button>
                    <button onClick={handlePin} title={msg.isPinned ? "Unpin" : "Pin"} className={`p-1 text-slate-700 hover:text-amber-600 transition-colors ${msg.isPinned ? 'text-amber-600' : ''}`}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/><path d="M16.5 9.4 7.5 4.21"/><path d="M21 16V8"/><path d="m21 16-9 5.2"/><path d="m12 11.5 9-5.2"/><path d="m12 11.5-9-5.2"/><path d="M3 8v8"/><path d="m3 16 9 5.2"/><path d="M12 22.5V11.5"/><path d="M15 17.5 12 14.5l-3 3"/></svg></button>
                    <button onClick={handleDelete} title="Delete" className="p-1 text-slate-700 hover:text-red-600 transition-colors"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
                </div>
 
                {/* Reply Context */}
                {repliedContent && (
                    <div className="mb-2 p-2 bg-amber-50 border-l-2 border-amber-500 rounded-r-md text-[10px] font-montserrat flex items-center justify-between gap-3 overflow-hidden select-none">
                        <div className="min-w-0 flex-1">
                            <span className="block font-bold text-[8px] uppercase tracking-wider text-amber-800 mb-0.5">
                                {repliedContent.name}
                            </span>
                            <p className="text-[9.5px] text-slate-700 truncate font-montserrat leading-tight">
                                {repliedContent.mediaText && <span className="text-slate-900 font-medium mr-1.5">{repliedContent.mediaText}</span>}
                                {repliedContent.text}
                            </p>
                        </div>
                        {repliedContent.mediaThumbnail && (
                            <div className="w-8 h-8 rounded overflow-hidden bg-white border border-slate-200 shrink-0">
                                <img src={repliedContent.mediaThumbnail} alt="Reply preview" className="w-full h-full object-cover animate-reveal-message" />
                            </div>
                        )}
                    </div>
                )}

                {/* Text Content */}
                {(text || msg.message) && (
                    <p className={`font-montserrat text-[11px] md:text-[12px] leading-normal break-all break-words whitespace-pre-wrap ${isSent ? 'text-slate-950 font-medium' : 'text-slate-900'}`}>
                        {text || msg.message}
                    </p>
                )}

                {/* Image Attachments Grid (WhatsApp style) */}
                {imageAttachments.length > 0 && (
                    <div className={`w-52 md:w-60 max-w-full ${(text || msg.message) ? 'mt-2.5 pt-2.5 border-t border-white/5' : ''}`}>
                        {imageAttachments.length === 1 ? (
                            <div 
                                className={`relative group/img overflow-hidden rounded-xl border ${isSent ? 'border-accent/20' : 'border-white/5'} hover:border-accent/40 transition-all duration-300 w-full bg-white/[0.02] cursor-pointer`}
                                onClick={() => setActiveImageIndex(0)}
                            >
                                <img 
                                    src={getAttachmentUrl(imageAttachments[0])} 
                                    alt={imageAttachments[0].name} 
                                    className="w-full max-h-[160px] md:max-h-[180px] object-cover transition-transform duration-750 group-hover/img:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity p-4 flex flex-col justify-end pointer-events-none">
                                    <p className="font-montserrat text-xs text-white truncate">{imageAttachments[0].name}</p>
                                </div>
                            </div>
                        ) : imageAttachments.length === 2 ? (
                            <div className={`grid grid-cols-2 gap-1 rounded-xl overflow-hidden w-full border ${isSent ? 'border-accent/20' : 'border-white/5'}`}>
                                {imageAttachments.map((img, idx) => {
                                    const url = getAttachmentUrl(img);
                                    return (
                                        <div 
                                            key={idx} 
                                            className="relative group/img overflow-hidden aspect-square bg-white/[0.02] cursor-pointer"
                                            onClick={() => setActiveImageIndex(idx)}
                                        >
                                            <img 
                                                src={url} 
                                                alt={img.name} 
                                                className="w-full h-full object-cover transition-transform duration-750 group-hover/img:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity p-3 flex flex-col justify-end pointer-events-none">
                                                <p className="font-montserrat text-[10px] text-white truncate">{img.name}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : imageAttachments.length === 3 ? (
                            <div className={`grid grid-cols-2 gap-1 rounded-xl overflow-hidden w-full border ${isSent ? 'border-accent/20' : 'border-white/5'}`}>
                                <div 
                                    className="col-span-2 relative group/img overflow-hidden aspect-[2/1] bg-white/[0.02] cursor-pointer"
                                    onClick={() => setActiveImageIndex(0)}
                                >
                                    <img 
                                        src={getAttachmentUrl(imageAttachments[0])} 
                                        alt={imageAttachments[0].name} 
                                        className="w-full h-full object-cover transition-transform duration-750 group-hover/img:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity p-3 flex flex-col justify-end pointer-events-none">
                                        <p className="font-montserrat text-[10px] text-white truncate">{imageAttachments[0].name}</p>
                                    </div>
                                </div>
                                {imageAttachments.slice(1, 3).map((img, idx) => {
                                    const url = getAttachmentUrl(img);
                                    return (
                                        <div 
                                            key={idx} 
                                            className="relative group/img overflow-hidden aspect-square bg-white/[0.02] cursor-pointer"
                                            onClick={() => setActiveImageIndex(idx + 1)}
                                        >
                                            <img 
                                                src={url} 
                                                alt={img.name} 
                                                className="w-full h-full object-cover transition-transform duration-750 group-hover/img:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity p-3 flex flex-col justify-end pointer-events-none">
                                                <p className="font-montserrat text-[10px] text-white truncate">{img.name}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className={`grid grid-cols-2 gap-1 rounded-xl overflow-hidden w-full border ${isSent ? 'border-accent/20' : 'border-white/5'}`}>
                                {imageAttachments.slice(0, 4).map((img, idx) => {
                                    const isLast = idx === 3;
                                    const hasMore = imageAttachments.length > 4;
                                    const url = getAttachmentUrl(img);
                                    return (
                                        <div 
                                            key={idx} 
                                            className="relative group/img overflow-hidden aspect-square bg-white/[0.02] cursor-pointer"
                                            onClick={() => setActiveImageIndex(idx)}
                                        >
                                            <img 
                                                src={url} 
                                                alt={img.name} 
                                                className="w-full h-full object-cover transition-transform duration-750 group-hover/img:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity p-3 flex flex-col justify-end pointer-events-none">
                                                <p className="font-montserrat text-[10px] text-white truncate">{img.name}</p>
                                            </div>
                                            {isLast && hasMore && (
                                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center hover:bg-black/60 transition-colors">
                                                    <span className="font-montserrat text-xl font-bold text-accent">+{imageAttachments.length - 4}</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Other Attachments */}
                {otherAttachments.length > 0 && (
                    <div className={`space-y-2 ${(text || msg.message || imageAttachments.length > 0) ? 'mt-2.5 pt-2.5 border-t border-white/5' : ''}`}>
                        {otherAttachments.map((file, idx) => {
                            const fileName = String(file.name || '').toLowerCase();
                            const fileType = String(file.type || '').toLowerCase();
                            const isAudio = fileType.startsWith('audio/') || fileType === 'voice' || 
                                          /\.(mp3|wav|ogg|m4a|webm)$/.test(fileName);
                                          
                            const fileUrl = getAttachmentUrl(file);
                            
                            if (isAudio) {
                                return (
                                    <CustomAudioPlayer 
                                        key={idx}
                                        src={fileUrl}
                                    />
                                );
                            }
                            
                            return (
                                <div key={idx} className="flex items-center gap-3.5 bg-white/[0.02] border border-white/5 p-2.5 rounded-xl group/file cursor-pointer hover:bg-accent/5 hover:border-accent/20 transition-all duration-300">
                                    <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                                    </div>
                                    <div className="flex-1 min-w-0 pr-2">
                                        <p className="font-montserrat text-[10px] text-white/90 truncate font-bold uppercase tracking-tight">{file.name}</p>
                                        <p className="font-montserrat text-[8px] text-white/40 tracking-wider mt-0.5">{file.size}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Lightbox Modal Overlay */}
            {activeImageIndex !== null && createPortal(
                <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col justify-between select-none animate-in fade-in duration-200" onClick={() => setActiveImageIndex(null)}>
                    {/* Top controls bar */}
                    <div className="w-full flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent z-10" onClick={e => e.stopPropagation()}>
                        <span className="font-montserrat text-xs md:text-sm text-white/70 font-semibold uppercase tracking-wider">
                            Image {activeImageIndex + 1} of {imageAttachments.length}
                        </span>
                        <button 
                            onClick={() => setActiveImageIndex(null)}
                            className="p-2.5 bg-white/5 hover:bg-white/10 hover:text-red-400 text-white rounded-full transition-all duration-300"
                            title="Close preview"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>

                    {/* Main Image Slider Viewport */}
                    <div className="flex-1 flex items-center justify-center relative p-4">
                        <div 
                            className="relative max-w-full max-h-[80vh] flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img 
                                src={getAttachmentUrl(imageAttachments[activeImageIndex])} 
                                alt={imageAttachments[activeImageIndex].name} 
                                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
                            />
                        </div>

                        {/* Navigation Arrows */}
                        {activeImageIndex > 0 && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveImageIndex(prev => prev - 1);
                                }}
                                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-3.5 bg-white/5 hover:bg-white/15 hover:scale-105 active:scale-95 text-white rounded-full transition-all duration-300 border border-white/5 z-10"
                                title="Previous image"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                            </button>
                        )}
                        
                        {activeImageIndex < imageAttachments.length - 1 && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveImageIndex(prev => prev + 1);
                                }}
                                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-3.5 bg-white/5 hover:bg-white/15 hover:scale-105 active:scale-95 text-white rounded-full transition-all duration-300 border border-white/5 z-10"
                                title="Next image"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 12 12 9 6"/></svg>
                            </button>
                        )}
                    </div>

                    {/* Bottom Info bar */}
                    <div className="w-full text-center p-4 bg-gradient-to-t from-black/80 to-transparent z-10" onClick={e => e.stopPropagation()}>
                        <p className="font-montserrat text-xs text-white/50 truncate max-w-xl mx-auto">
                            {imageAttachments[activeImageIndex].name || 'Image Attachment'}
                        </p>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default ChatMessage;
