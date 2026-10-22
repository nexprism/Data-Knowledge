import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { selectCurrentUser, selectToken } from "../../store/slices/authslice";
import { chatService } from "../../services/chatService";
import { useAppDispatch } from "../../hooks/redux";
import { fetchAllStudents } from "../../store/slices/students";
import {
  Search,
  Send,
  Paperclip,
  Mic,
  MoreVertical,
  User,
  BookOpen,
  Image as ImageIcon,
  File as FileIcon,
  X,
  Phone,
  Video,
  Info,
  MessageCircle,
  Bot,
  CheckCheck,
  Reply,
  Copy
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../../services/axiosConfig";
import PageMeta from "../../components/common/PageMeta";

interface Message {
  _id: string;
  sender: string;
  receiverId?: string;
  groupId?: string;
  courseId?: string;
  content: string;
  file?: string;
  fileType: 'text' | 'image' | 'voice' | 'file';
  createdAt: string;
  senderInfo?: {
    fullName: string;
    profilePicture?: string;
  };
  replyTo?: any;
}

interface Chat {
  id: string;
  type: 'direct' | 'course';
  name: string;
  image?: string;
  lastMessage?: string;
  unreadCount: number;
  participantId?: string;
  updatedAt?: string;
}

const formatMessageTime = (dateString?: string) => {
  if (!dateString || dateString === new Date(0).toISOString()) return "";
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + (date.getFullYear() !== now.getFullYear() ? `, ${date.getFullYear()}` : '');
};

const ChatPage: React.FC = () => {
  console.log("ChatPage rendering...");
  const reduxUser = useSelector(selectCurrentUser);
  const currentUser = reduxUser || (() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch (_) {
      return null;
    }
  })();
  const reduxToken = useSelector(selectToken);
  const token = reduxToken || localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('admin_token') || "";

  const resolveMediaUrl = (path: string | undefined) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;

    let baseUrl = import.meta.env.VITE_IMAGE_URL || `${import.meta.env.VITE_BASE_URL}/uploads`;

    // Auto-detect local development
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      baseUrl = `${import.meta.env.VITE_BASE_URL}/uploads`;
    }

    // If the path already starts with /uploads, and the baseUrl also ends with /uploads, fix it
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;

    let resolvedUrl = "";
    if (cleanPath.startsWith("uploads/") && baseUrl.endsWith("/uploads")) {
      resolvedUrl = `${baseUrl.replace(/\/uploads$/, "")}/${cleanPath}`;
    } else {
      resolvedUrl = `${baseUrl}/${cleanPath}`;
    }

    // console.log(`Resolving media: ${path} -> ${resolvedUrl}`);
    return resolvedUrl;
  };

  const { students } = useSelector((state: any) => state.students);
  const dispatch = useAppDispatch();

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [subFilter, setSubFilter] = useState<'all' | 'unread'>('unread');

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    fetchChatRooms();
    dispatch(fetchAllStudents({ page: 1, limit: 100 }));
  }, [dispatch, currentUser?.id]);

  const fetchChatRooms = async () => {
    try {
      console.log("Fetching chat rooms...");
      const results = await Promise.allSettled([
        axiosInstance.get("/chat/rooms"),
        axiosInstance.get("/chat/course/rooms")
      ]);

      const directRes = results[0].status === 'fulfilled' ? (results[0] as PromiseFulfilledResult<any>).value : { data: { rooms: [] } };
      const courseRes = results[1].status === 'fulfilled' ? (results[1] as PromiseFulfilledResult<any>).value : { data: { courseChatRooms: [] } };

      console.log("Direct rooms response:", directRes.data);
      console.log("Course rooms response:", courseRes.data);

      const directRooms = (directRes.data.rooms || []).map((r: any) => {
        const currentUserId = currentUser?._id || (currentUser as any)?.id;
        const otherParticipant = r.participants.find((p: any) => (p._id || p.id) !== currentUserId);
        return {
          id: r._id,
          type: 'direct' as const,
          name: otherParticipant?.fullName || otherParticipant?.email || "Unknown User",
          unreadCount: r.unreadCount || 0,
          lastMessage: r.lastMessage?.message || (r.lastMessage?.fileUrl ? "Sent a file" : ""),
          participantId: otherParticipant?._id,
          image: otherParticipant?.profilePicture ? `${import.meta.env.VITE_IMAGE_URL}/${otherParticipant.profilePicture}` : undefined,
          updatedAt: r.lastMessage?.createdAt || r.updatedAt || new Date(0).toISOString()
        };
      });

      const courseRooms = (courseRes.data.courseChatRooms || []).map((r: any) => ({
        id: r._id,
        type: 'course' as const,
        name: r.courseId?.title || "Course Chat",
        unreadCount: r.unreadCount || 0,
        lastMessage: r.lastMessage?.message || "Course Chat",
        image: r.courseId?.thumbnail ? `${import.meta.env.VITE_IMAGE_URL}/${r.courseId.thumbnail}` : undefined,
        updatedAt: r.lastMessage?.createdAt || r.updatedAt || new Date(0).toISOString()
      }));

      const allRooms = [...directRooms, ...courseRooms];
      console.log("Mapped all rooms:", allRooms);

      setChats(prev => {
        const roomIds = new Set(allRooms.map((r: any) => r.id));
        const directParticipantIds = new Set(
          allRooms
            .filter((r: any) => r.type === 'direct' && r.participantId)
            .map((r: any) => String(r.participantId))
        );

        // Keep prev chats ONLY if not already in roomIds and direct participant is not already in allRooms
        const filteredPrev = prev.filter(p => {
          if (roomIds.has(p.id)) return false;
          if (p.type === 'direct' && p.participantId && directParticipantIds.has(String(p.participantId))) {
            return false;
          }
          return true;
        });

        // Deduplicate direct chats by participantId
        const seenParticipants = new Set<string>();
        const merged = [...allRooms, ...filteredPrev];
        const uniqueChats: any[] = [];

        for (const chat of merged) {
          if (chat.type === 'direct' && chat.participantId) {
            const pId = String(chat.participantId);
            if (seenParticipants.has(pId)) continue;
            seenParticipants.add(pId);
          }
          uniqueChats.push(chat);
        }

        return uniqueChats;
      });
    } catch (err) {
      console.error("Failed to fetch chat rooms", err);
    }
  };

  const fetchMessages = async (roomId: string) => {
    try {
      let endpoint = `/chat/messages/${roomId}`;
      if (selectedChat?.type === 'group') endpoint = `/chat/group/messages/${roomId}`;
      if (selectedChat?.type === 'course') endpoint = `/chat/course/messages/${roomId}`;

      const res = await axiosInstance.get(endpoint);
      const formattedMessages = res.data.messages.map((m: any) => ({
        _id: m._id,
        sender: m.sender?._id || m.sender,
        content: m.message,
        file: m.fileUrl,
        fileType: m.fileType || 'text',
        createdAt: m.createdAt,
        senderInfo: m.sender,
        replyTo: m.replyTo
      })).reverse(); // Backend returns latest first
      setMessages(formattedMessages);

      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);

      let readEndpoint = "/chat/message/read";
      let payload: any = { roomId, senderId: selectedChat?.participantId };

      if (selectedChat?.type === 'course') {
        readEndpoint = "/chat/course/message/read";
        payload = { courseChatRoomId: roomId };
      }

      axiosInstance.patch(readEndpoint, payload);

      setChats(prev => prev.map(chat =>
        chat.id === roomId ? { ...chat, unreadCount: 0 } : chat
      ));
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  useEffect(() => {
    if (students && students.length > 0) {
      setChats(prev => {
        const existingParticipantIds = new Set(
          prev
            .filter(p => p.type === 'direct')
            .map(p => String(p.participantId || p.id))
        );

        const newStudents: Chat[] = [];
        for (const s of students) {
          const sId = String(s._id || s.id);
          if (!existingParticipantIds.has(sId)) {
            existingParticipantIds.add(sId);
            newStudents.push({
              id: sId,
              type: 'direct',
              name: s.fullName || s.name,
              image: s.profilePicture ? `${import.meta.env.VITE_IMAGE_URL}/${s.profilePicture}` : undefined,
              unreadCount: 0,
              participantId: sId,
              updatedAt: new Date(0).toISOString()
            });
          }
        }

        return [...prev, ...newStudents];
      });
    }
  }, [students]);

  const [isTypingRemote, setIsTypingRemote] = useState(false);

  useEffect(() => {
    if (selectedChat && selectedChat.id) {
      // If it looks like a participantId (studentId), create/get room
      // If it's already a roomId, just fetch messages
      const isRoomId = selectedChat.id !== selectedChat.participantId;

      if (isRoomId) {
        fetchMessages(selectedChat.id);
        chatService.joinRoom(selectedChat.id);
      } else {
        axiosInstance.post("/chat/room", { receiverId: selectedChat.participantId })
          .then(res => {
            const roomId = res.data.roomId;
            setSelectedChat(prev => prev ? { ...prev, id: roomId } : null);
            chatService.joinRoom(roomId);
          });
      }
    }
  }, [selectedChat?.id]);

  useEffect(() => {
    if (token && currentUser) {
      const socket = chatService.connect(token);

      socket.on("typing", ({ userId, roomId }: { userId: string, roomId: string }) => {
        if (roomId === selectedChat?.id && userId !== currentUser.id) {
          setIsTypingRemote(true);
        }
      });

      socket.on("stopTyping", ({ userId, roomId }: { userId: string, roomId: string }) => {
        if (roomId === selectedChat?.id) {
          setIsTypingRemote(false);
        }
      });

      return () => {
        socket.off("typing");
        socket.off("stopTyping");
      };
    }
  }, [selectedChat?.id, currentUser?.id]);

  const handleTyping = () => {
    if (selectedChat?.id && currentUser?.id) {
      const socket = chatService.getSocket();
      socket?.emit("typing", { userId: currentUser.id, roomId: selectedChat.id });

      // Stop typing after 2 seconds of inactivity
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        socket?.emit("stopTyping", { userId: currentUser.id, roomId: selectedChat.id });
      }, 2000);
    }
  };

  useEffect(() => {
    if (token && currentUser) {
      const socket = chatService.connect(token);
      chatService.joinPersonalRoom(currentUser.id || (currentUser as any)._id);

      const handleIncomingMessage = (msg: any) => {
        const msgRoomId = String(msg.chatRoomId || msg.groupChatRoomId || msg.courseChatRoomId || msg.roomId || '');
        const currentUserId = String(currentUser?.id || (currentUser as any)?._id || '');
        const senderId = String(msg.sender?._id || msg.sender || '');
        const receiverId = String(msg.receiver?._id || msg.receiver || '');
        const currentChatId = String(selectedChat?.id || '');
        const currentParticipantId = String(selectedChat?.participantId || '');

        const isCurrentChat = Boolean(
          (msgRoomId && currentChatId && msgRoomId === currentChatId) ||
          (currentParticipantId && (currentParticipantId === senderId || currentParticipantId === receiverId))
        );
        const isMe = senderId === currentUserId;

        if (isCurrentChat) {
          setMessages(prev => {
            if (msg._id && prev.some(m => m._id === msg._id)) return prev;
            const newMsgObj: Message = {
              _id: msg._id,
              sender: senderId,
              content: msg.message || msg.content,
              file: msg.fileUrl || msg.file,
              fileType: msg.fileType || 'text',
              createdAt: msg.createdAt,
              senderInfo: msg.sender,
              replyTo: msg.replyTo
            };
            const tempIdx = prev.findIndex(m => m._id?.startsWith('temp-') && m.content === newMsgObj.content);
            if (tempIdx !== -1) {
              const updated = [...prev];
              updated[tempIdx] = newMsgObj;
              return updated;
            }
            return [...prev, newMsgObj];
          });

          setTimeout(() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
          }, 50);

          // Mark as read immediately if it's the current chat
          let readEndpoint = "/chat/message/read";
          let payload: any = { roomId: msg.chatRoomId || msgRoomId, senderId: senderId };

          if (msg.courseChatRoomId) {
            readEndpoint = "/chat/course/message/read";
            payload = { courseChatRoomId: msg.courseChatRoomId };
          }

          axiosInstance.patch(readEndpoint, payload).catch(() => {});
        }
        updateLastMessage(msg, isCurrentChat, isMe);
      };

      chatService.onNewMessage(handleIncomingMessage);
      chatService.onNewCourseChatMessage(handleIncomingMessage);
      chatService.onMessageSent(handleIncomingMessage); // Handle own sent message confirmation

      return () => {
        socket.off("newMessage");
        socket.off("newCourseChatMessage");
        socket.off("messageSent");
      };
    }
  }, [token, currentUser, selectedChat?.id]);

  const updateLastMessage = (msg: any, isCurrentChat: boolean, isMe: boolean) => {
    const roomId = msg.chatRoomId || msg.groupChatRoomId || msg.courseChatRoomId;
    const senderId = msg.sender?._id || msg.sender;
    setChats(prev => {
      let matchUpdated = false;
      return prev.map(chat => {
        const isMatch = chat.id === roomId || (chat.type === 'direct' && String(chat.participantId) === String(senderId));
        if (isMatch && !matchUpdated) {
          matchUpdated = true;
          return {
            ...chat,
            id: roomId || chat.id,
            lastMessage: msg.message || "File",
            updatedAt: msg.createdAt || new Date().toISOString(),
            unreadCount: isCurrentChat ? 0 : (isMe ? chat.unreadCount : chat.unreadCount + 1)
          };
        }
        return chat;
      });
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        sendVoiceMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const sendVoiceMessage = async (blob: Blob) => {
    if (!selectedChat) return;
    const formData = new FormData();
    const file = new File([blob], "voice_message.webm", { type: 'audio/webm' });
    formData.append("files", file); // Changed from 'file' to 'files' to match backend
    formData.append("receiverId", selectedChat.participantId);
    formData.append("roomId", selectedChat.id);

    try {
      await axiosInstance.post("/chat/message", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } catch (err) {
      console.error("Voice upload failed", err);
    }
  };

  const handleSendMessage = () => {
    const text = inputValue.trim();
    if (!text || !selectedChat) return;

    const currentUserId = String(currentUser?.id || (currentUser as any)?._id || '');
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      _id: tempId,
      sender: currentUserId,
      content: text,
      file: undefined,
      fileType: 'text',
      createdAt: new Date().toISOString(),
      senderInfo: currentUser,
      replyTo: replyingTo || undefined
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);

    // Update sidebar last message immediately
    updateLastMessage({
      chatRoomId: selectedChat.id,
      courseChatRoomId: selectedChat.type === 'course' ? selectedChat.id : undefined,
      sender: currentUserId,
      message: text,
      createdAt: new Date().toISOString()
    }, true, true);

    if (selectedChat.type === 'direct') {
      chatService.sendMessage({
        roomId: selectedChat.id,
        receiverId: selectedChat.participantId,
        message: text,
        replyTo: replyingTo?._id
      });
    } else if (selectedChat.type === 'course') {
      chatService.sendCourseChatMessage({
        courseChatRoomId: selectedChat.id,
        message: text,
        replyTo: replyingTo?._id
      });
    }

    setInputValue("");
    setReplyingTo(null);
  };

  const handleCopyMessage = (msg: Message) => {
    const textToCopy = msg.content || msg.file || "";
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedChat) {
      const formData = new FormData();
      formData.append("files", file);

      let endpoint = "/chat/message";
      if (selectedChat.type === 'direct') {
        formData.append("receiverId", selectedChat.participantId);
        formData.append("roomId", selectedChat.id);
      } else if (selectedChat.type === 'course') {
        endpoint = "/chat/course/message";
        formData.append("courseChatRoomId", selectedChat.id);
      }

      axiosInstance.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).catch(err => {
        console.error("Upload failed", err);
      });
    }
  };

  const [activeTab, setActiveTab] = useState<'direct' | 'course'>('direct');

  // ... (existing effects and functions)

  return (
    <div className="flex h-[calc(100vh-120px)] bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-800">
      <PageMeta title="Messages | LMS Admin" />

      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold dark:text-white">Messages</h1>
            <div className="flex gap-2">
            </div>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <button
              onClick={() => setActiveTab('direct')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${activeTab === 'direct' ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-500' : 'text-gray-500'}`}
            >
              Direct
            </button>
            <button
              onClick={() => setActiveTab('course')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${activeTab === 'course' ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-500' : 'text-gray-500'}`}
            >
              Courses
            </button>
          </div>

          <div className="flex gap-2 mt-3 border-b border-gray-100 dark:border-gray-800 pb-2">
            <button
              onClick={() => setSubFilter('all')}
              className={`px-3 py-1 text-[11px] font-semibold rounded-full transition-all ${subFilter === 'all' ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/20' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 bg-gray-50 dark:bg-gray-800/40'}`}
            >
              All
            </button>
            <button
              onClick={() => setSubFilter('unread')}
              className={`px-3 py-1 text-[11px] font-semibold rounded-full transition-all ${subFilter === 'unread' ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/20' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 bg-gray-50 dark:bg-gray-800/40'}`}
            >
              Unread
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="p-2 space-y-1">
            {(() => {
              console.log("ChatPage render activeTab:", activeTab);
              console.log("Current chats state length:", chats.length);
              if (chats.length > 0) {
                console.log("First 5 chats sample:", chats.slice(0, 5));
              }
              const filtered = chats.filter(c => c.type === activeTab && (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()));

              // Ensure uniqueness by participantId/id for direct chats
              const uniqueFiltered: typeof filtered = [];
              const seenDirect = new Set<string>();
              for (const c of filtered) {
                if (c.type === 'direct') {
                  const key = String(c.participantId || c.id);
                  if (seenDirect.has(key)) continue;
                  seenDirect.add(key);
                }
                uniqueFiltered.push(c);
              }

              const sorted = [...uniqueFiltered].sort((a, b) => {
                if (subFilter === 'unread') {
                  if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
                  if (b.unreadCount > 0 && a.unreadCount === 0) return 1;
                }

                const dateA = new Date(a.updatedAt || 0).getTime();
                const dateB = new Date(b.updatedAt || 0).getTime();
                return dateB - dateA;
              });

              return sorted.map(chat => (
                <div
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`p-3 rounded-xl cursor-pointer flex items-center gap-3 transition-all ${selectedChat?.id === chat.id ||
                      (chat.participantId && selectedChat?.participantId === chat.participantId)
                      ? 'bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 shadow-sm'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
                    }`}
                >
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner ${chat.type === 'direct' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-orange-400 to-orange-600'}`}>
                      {chat.image ? <img src={chat.image} className="w-full h-full rounded-full object-cover" alt="" onError={(e) => e.currentTarget.style.display = 'none'} /> : (chat.name || "?").charAt(0)}
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full shadow-sm"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <h3 className="font-bold text-sm truncate dark:text-white">{chat.name}</h3>
                      <span className="text-[10px] text-gray-400">{formatMessageTime(chat.updatedAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 truncate pr-2">{chat.lastMessage || "Start a conversation"}</p>
                      {chat.unreadCount > 0 && (
                        <span className="bg-brand-500 text-white text-[10px] min-w-5 h-5 px-1 rounded-full flex items-center justify-center shadow-md shadow-brand-500/20 font-bold">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ));
            })()}

            {chats.filter(c => c.type === activeTab).length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 text-center text-gray-400">
                <Search className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm">No {activeTab} chats found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 min-w-0 flex flex-col bg-white dark:bg-gray-950 relative">
        {selectedChat ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white/80 dark:bg-gray-950/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${selectedChat.type === 'direct' ? 'bg-blue-500' : 'bg-orange-500'}`}>
                  {selectedChat.name.charAt(0)}
                </div>
                <div>
                  <h2 className="font-bold dark:text-white">{selectedChat.name}</h2>
                  {isTypingRemote ? (
                    <span className="text-xs text-brand-500 font-medium animate-pulse">Typing...</span>
                  ) : (
                    <span className="text-xs text-green-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      Online
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-gray-500">
                <button className="hover:text-brand-500 transition-colors"><Phone className="w-5 h-5" /></button>
                <button className="hover:text-brand-500 transition-colors"><Video className="w-5 h-5" /></button>
                <button className="hover:text-brand-500 transition-colors"><Info className="w-5 h-5" /></button>
                <button className="hover:text-brand-500 transition-colors"><MoreVertical className="w-5 h-5" /></button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 w-full overflow-y-auto p-6 space-y-6 no-scrollbar bg-gray-50/30 dark:bg-gray-950/30"
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50 space-y-4">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-10 h-10" />
                  </div>
                  <p className="text-sm font-medium">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const otherParticipantId = String(selectedChat?.participantId || '');
                  const msgSenderId = String(
                    (typeof msg.sender === 'object' && msg.sender !== null)
                      ? (msg.sender._id || msg.sender.id || '')
                      : (msg.sender || '')
                  );
                  const currentUserId = String(currentUser?._id || (currentUser as any)?.id || '');
                  const isMe = Boolean(
                    selectedChat?.type === 'direct' && otherParticipantId
                      ? (msgSenderId ? msgSenderId !== otherParticipantId : (currentUserId && currentUserId === msgSenderId))
                      : ((currentUserId && msgSenderId && currentUserId === msgSenderId) || msgSenderId === 'me')
                  );
                  return (
                    <motion.div
                      key={msg._id || idx}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex flex-col max-w-[75%] min-w-0 ${isMe ? 'items-end' : 'items-start'}`}>
                        {!isMe && selectedChat?.type !== 'direct' && (
                          <span className="text-[10px] text-gray-500 mb-1 ml-2">{msg.senderInfo?.fullName || "User"}</span>
                        )}
                        <div className={`group relative p-3 rounded-2xl shadow-sm transition-all hover:shadow-md min-w-0 ${msg.replyTo ? 'w-full' : ''} ${isMe
                            ? 'bg-brand-500 text-white rounded-tr-none'
                            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-tl-none border border-gray-100 dark:border-gray-700'
                          }`}>
                          {msg.replyTo && typeof msg.replyTo === 'object' && (
                            <div className={`mb-2 p-2 rounded-lg text-xs ${isMe ? 'bg-white/20 border-l-2 border-white' : 'bg-gray-100 dark:bg-gray-700 border-l-2 border-brand-500'} w-full overflow-hidden`}>
                              <span className="font-bold">{(msg.replyTo.senderInfo?.fullName || msg.replyTo.sender?.fullName || "User")}</span>
                              <p className="truncate opacity-80">{msg.replyTo.message || msg.replyTo.content || "Attachment"}</p>
                            </div>
                          )}
                          {msg.fileType === 'image' && msg.file && (
                            <div className="mb-2 overflow-hidden rounded-lg cursor-pointer">
                              <img
                                src={resolveMediaUrl(msg.file)}
                                alt="attachment"
                                className="max-w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
                                onError={(e) => {
                                  // fallback if resolveMediaUrl failed
                                  if (msg.file && !e.currentTarget.src.includes(msg.file)) {
                                    e.currentTarget.src = msg.file;
                                  }
                                }}
                              />
                            </div>
                          )}

                          {msg.fileType === 'voice' && msg.file && (
                            <div className={`mb-2 p-2 rounded-xl flex items-center gap-3 ${isMe ? 'bg-white/10' : 'bg-gray-100 dark:bg-gray-900'}`}>
                              <button className={`w-8 h-8 rounded-full flex items-center justify-center ${isMe ? 'bg-white text-brand-500' : 'bg-brand-500 text-white'}`}>
                                <Mic className="w-4 h-4" />
                              </button>
                              <audio controls className="h-8 w-48 opacity-80 filter invert dark:invert-0">
                                <source src={resolveMediaUrl(msg.file)} type="audio/webm" />
                                <source src={resolveMediaUrl(msg.file)} type="audio/mpeg" />
                              </audio>
                            </div>
                          )}

                          {msg.fileType === 'file' && msg.file && (
                            <a
                              href={resolveMediaUrl(msg.file)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-3 p-3 mb-2 rounded-xl border ${isMe ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'} transition-colors`}
                            >
                              <div className={`p-2 rounded-lg ${isMe ? 'bg-white text-brand-500' : 'bg-brand-500 text-white'}`}>
                                <FileIcon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate">{msg.content || "Download File"}</p>
                                <p className={`text-[10px] ${isMe ? 'text-white/60' : 'text-gray-400'}`}>Click to open</p>
                              </div>
                            </a>
                          )}

                          {msg.content && (msg.fileType === 'text' || msg.fileType === 'image') && (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-all">{msg.content}</p>
                          )}

                          <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end text-white/70' : 'justify-start text-gray-400'}`}>
                            <span className="text-[10px]">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && (
                              <div className="flex">
                                <CheckCheck className="w-3 h-3" />
                              </div>
                            )}
                          </div>

                          {/* Quick Reactions / Actions (Hidden by default) */}
                          <div className={`absolute top-0 ${isMe ? '-left-16' : '-right-16'} opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10`}>
                            <button onClick={() => setReplyingTo(msg)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 hover:text-brand-500 transition-colors bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-700" title="Reply">
                              <Reply className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCopyMessage(msg)}
                              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 hover:text-brand-500 transition-colors bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-700"
                              title="Copy Message"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
              <AnimatePresence mode="wait">
                {isRecording ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="flex items-center justify-between bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                      <span className="text-red-600 dark:text-red-400 font-medium">Recording... {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setIsRecording(false); clearInterval(timerRef.current); }}
                        className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={stopRecording}
                        className="px-6 py-2 bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-500/20"
                      >
                        Stop & Send
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col bg-gray-100 dark:bg-gray-800 p-2 rounded-2xl w-full"
                  >
                    {replyingTo && (
                      <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-2 rounded-lg mb-2 mx-1 text-xs border-l-2 border-brand-500 shadow-sm">
                        <div className="flex flex-col flex-1 min-w-0 pr-2">
                          <span className="font-bold text-brand-500">Replying to {replyingTo.senderInfo?.fullName || "User"}</span>
                          <span className="text-gray-500 truncate">{replyingTo.content || "Attachment"}</span>
                        </div>
                        <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full flex-shrink-0 text-gray-400 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <div className="flex items-end gap-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 text-gray-500 hover:text-brand-500 transition-colors"
                        >
                          <Paperclip className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-500 hover:text-brand-500 transition-colors">
                          <ImageIcon className="w-5 h-5" />
                        </button>
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <textarea
                        placeholder="Type your message..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 max-h-32 resize-none no-scrollbar dark:text-white"
                        rows={1}
                        value={inputValue}
                        onChange={(e) => {
                          setInputValue(e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                          handleTyping();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={startRecording}
                          className="p-2 text-gray-500 hover:text-brand-500 transition-colors"
                        >
                          <Mic className="w-5 h-5" />
                        </button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={handleSendMessage}
                          disabled={!inputValue.trim()}
                          className={`p-2 rounded-xl shadow-lg transition-all ${inputValue.trim() ? 'bg-brand-500 text-white shadow-brand-500/20' : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                        >
                          <Send className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
            <div className="w-24 h-24 bg-brand-50 dark:bg-brand-900/20 rounded-full flex items-center justify-center mb-6 text-brand-500">
              <Bot className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold mb-2 dark:text-white">Your Chat Hub</h2>
            <p className="max-w-xs mx-auto text-sm">Select a student, group or course chat from the sidebar to start messaging in real-time.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
