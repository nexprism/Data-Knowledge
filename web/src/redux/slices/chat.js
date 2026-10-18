import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import authorizedFetch from '../../utils/apiClient';
import { getApiBaseUrl } from '../../utils/apiConfig';
// socketService will be dynamically imported in thunks to avoid early evaluation

const API_BASE = getApiBaseUrl();

export const connectSocket = createAsyncThunk('chat/connectSocket', async (_, { rejectWithValue, dispatch, getState }) => {
  try {
    const { auth } = getState();
    const token = auth.token || localStorage.getItem('edrilla_token');
    const { default: socketService } = await import('../../services/socketService');
    await socketService.connect(token);

    // register common handlers
    socketService.on('newMessage', (msg) => dispatch(addMessage(msg)));
    socketService.on('newCourseChatMessage', (msg) => {
      console.debug('[SOCKET_DEBUG] Received newCourseChatMessage', msg);
      // Normalize course message structure if needed (ensure it has roomId for the reducer)
      const normalized = msg.newMessage || msg;
      if (!normalized.roomId && normalized.courseChatRoomId) {
        normalized.roomId = normalized.courseChatRoomId;
      }
      dispatch(addMessage(normalized));
    });
    // The acknowledgement contains the real message id, while the optimistic
    // message has a temporary id. Matching by message content replaces it.
    socketService.on('messageSent', (msg) => dispatch(addMessage(msg)));
    socketService.on('user_typing', (data) => dispatch(addTypingUser(data)));
    socketService.on('user_stopped_typing', (data) => dispatch(removeTypingUser(data)));
    socketService.on('user_online', (data) => dispatch(addOnlineUser(data.userId)));
    socketService.on('user_offline', (data) => dispatch(removeOnlineUser(data.userId)));

    return true;
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to connect socket');
  }
});

export const disconnectSocket = createAsyncThunk('chat/disconnectSocket', async (_, { dispatch }) => {
  try {
    const { default: socketService } = await import('../../services/socketService');
    socketService.disconnect();
  } catch (e) {
    // ignore
  }
  dispatch(setSocketConnected(false));
});

export const fetchChatRooms = createAsyncThunk('chat/fetchRooms', async (_, { rejectWithValue, getState }) => {
  try {
    const response = await authorizedFetch(`${API_BASE}/chat/rooms`);
    const data = await response.json();
    console.debug('fetchChatRooms: response received', data);
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch rooms');
    }

    // Robust payload extraction: handle { rooms: [] }, { data: [] }, { data: { rooms: [] } }, or []
    let rooms = data.rooms || data.data || data;
    if (rooms && !Array.isArray(rooms) && typeof rooms === 'object') {
      if (Array.isArray(rooms.rooms)) rooms = rooms.rooms;
      else if (Array.isArray(rooms.data)) rooms = rooms.data;
    }
    console.debug('fetchChatRooms: extracted rooms', Array.isArray(rooms) ? rooms.length : 'NOT_ARRAY', rooms);

    if (!Array.isArray(rooms)) {
      console.warn('fetchChatRooms: Could not find rooms array in response', data);
      return [];
    }

    return rooms;
  } catch (error) {
    console.error('fetchChatRooms failed:', error);
    return rejectWithValue(error.message || 'Failed to fetch rooms');
  }
});

export const fetchMessages = createAsyncThunk('chat/fetchMessages', async (roomIdentifier, { rejectWithValue, getState }) => {
  try {
    const state = getState();
    const token = state.auth?.token || localStorage.getItem('edrilla_token');
    let roomId = roomIdentifier;

    if (!roomId) return rejectWithValue('No room id provided');

    const rooms = state.chat?.rooms || [];
    if (rooms && rooms.length) {
      if (roomId === 'support') {
        const supportRoom = rooms.find(r => r.isSupport || /support/i.test(r.name || '') || (r.participants && r.participants.some(p => p.role === 'admin' || p.role === 'super_admin')));
        if (supportRoom) roomId = supportRoom._id;
      }

      const looksLikeObjectId = typeof roomId === 'string' && /^[0-9a-fA-F]{24}$/.test(roomId);
      if (!looksLikeObjectId) {
        const found = rooms.find(r => r._id === roomId || r.slug === roomId || (r.participants && r.participants.some(p => p._id === roomId)) || r.name === roomId);
        if (found) roomId = found._id;
      }
    }

    // If still 'support', resolve dynamically from backend
    if (roomId === 'support') {
      try {
        const supportRes = await authorizedFetch('/chat/support-room');
        const supportData = await supportRes.json();
        if (supportData?.room?._id) {
          roomId = supportData.room._id;
        }
      } catch (e) { }
    }

    const isObjectId = typeof roomId === 'string' && /^[0-9a-fA-F]{24}$/.test(roomId);
    if (!isObjectId) {
      return { roomId: roomIdentifier, messages: [] };
    }

    console.debug(`[FETCH_DEBUG] Fetching history for room: ${roomId}`);

    // Check if this is a course group room
    const isCourseGroup = (state.chat?.courseRooms || []).some(r => r._id === roomId);
    const FETCH_URL = isCourseGroup ? `${API_BASE}/chat/course/messages/${roomId}` : `${API_BASE}/chat/messages/${roomId}`;

    // Attempt the most likely endpoint first
    const response = await authorizedFetch(FETCH_URL);
    const data = await response.json();

    console.debug(`[FETCH_DEBUG] Raw History Response for ${roomId}:`, { status: response.status, data });

    if (!response.ok) {
      console.warn(`[FETCH_DEBUG] /chat/messages/${roomId} failed, trying /chat/history/${roomId}`);
      const hbResponse = await authorizedFetch(`${API_BASE}/chat/history/${roomId}`);
      const hbData = await hbResponse.json();

      if (!hbResponse.ok) {
        throw new Error(hbData.message || `History Fetch Failed (${response.status})`);
      }

      const hbMessages = hbData.messages || hbData.data || hbData;
      return { roomId, messages: Array.isArray(hbMessages) ? hbMessages : [] };
    }

    const messages = data.messages || data.data || data;
    return { roomId, messages: Array.isArray(messages) ? messages : [] };
  } catch (error) {
    console.error(`[FETCH_DEBUG] History Fetch Error:`, error);
    return rejectWithValue(error.message || 'Failed to fetch messages');
  }
});

export const sendMessageSocket = createAsyncThunk('chat/sendMessageSocket', async ({ roomId: initialRoomId, receiverId: initialReceiverId, message, files, replyTo }, { rejectWithValue, getState }) => {
  const { auth, chat } = getState();
  const user = auth.user || JSON.parse(localStorage.getItem('edrilla_user') || '{}');

  let roomId = initialRoomId;
  let receiverId = initialReceiverId;

  // If roomId is 'support' or missing receiverId, dynamically resolve from support room endpoint
  if ((roomId === 'support' || !roomId) || !receiverId) {
    try {
      const supportRes = await authorizedFetch('/chat/support-room');
      const supportData = await supportRes.json();
      if (supportData?.room?._id) {
        roomId = supportData.room._id;
        const myId = user?._id || user?.id;
        const other = (supportData.room.participants || []).find(p => String(p._id || p.id) !== String(myId));
        if (other?._id || other?.id) receiverId = other._id || other.id;
      }
    } catch (err) {
      console.error('[CHAT_DEBUG] Dynamic support room resolution failed:', err);
    }
  }

  const optimisticMsg = {
    _id: `temp-${Date.now()}`,
    roomId,
    message,
    replyTo, // Add reply support
    sender: user?._id || 'me',
    senderName: user?.fullName || 'You',
    createdAt: new Date().toISOString(),
    status: 'sending',
    attachments: (files || []).map(f => {
      const fileName = (f.name || '').toLowerCase();
      const isImage = (f.type || '').startsWith('image/') ||
        /\.(jpg|jpeg|png|gif|webp|jfif|bmp|svg)$/.test(fileName);
      const isAudio = (f.type || '').startsWith('audio/') || f.type === 'voice' ||
        /\.(mp3|wav|ogg|m4a|webm)$/.test(fileName);
      return {
        name: f.name,
        type: f.type,
        preview: (isImage || isAudio) ? URL.createObjectURL(f) : null // Local preview for bubble
      };
    })
  };

  try {
    const { default: socketService } = await import('../../services/socketService');
    const hasFiles = files && files.length > 0;

    // Determine if this is a course group chat
    const isCourseGroup = (chat.courseRooms || []).some(r => r._id === roomId);

    const REST_URL = isCourseGroup ? `${API_BASE}/chat/course/message` : `${API_BASE}/chat/message`;
    const SOCKET_EVENT = isCourseGroup ? 'sendCourseChatMessage' : 'sendMessage';
    const ROOM_ID_KEY = isCourseGroup ? 'courseChatRoomId' : 'roomId';

    // IF NO FILES: Try socket first
    if (!hasFiles && socketService.socket && socketService.connected) {
      const socketPayload = { [ROOM_ID_KEY]: roomId, receiverId, message, messageType: 'text', replyTo };
      console.debug(`[SOCKET_DEBUG] Emitting ${SOCKET_EVENT}`, socketPayload);
      socketService.socket.emit(SOCKET_EVENT, socketPayload);
      return optimisticMsg;
    }

    // IF FILES or SOCKET OFFLINE: Use REST API with FormData
    const formData = new FormData();
    formData.append(ROOM_ID_KEY, roomId);
    if (!isCourseGroup && receiverId) formData.append('receiverId', receiverId);
    if (message) formData.append('message', message);
    if (replyTo) formData.append('replyTo', replyTo);

    if (hasFiles) {
      files.forEach(file => {
        formData.append('files', file);
      });
    }

    const response = await authorizedFetch(REST_URL, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `Send failed (${response.status})`);
    const savedMsg = data.data || data.message_obj || data.chat || null;
    return savedMsg ? { ...savedMsg, isSent: true, status: 'sent' } : { ...optimisticMsg, status: 'sent' };

  } catch (error) {
    console.error('[CHAT_DEBUG] Send failed:', error);
    return rejectWithValue(error.message || 'Failed to send message');
  }
});

export const pinMessage = createAsyncThunk('chat/pinMessage', async ({ messageId, isPinned }, { rejectWithValue }) => {
  try {
    const response = await authorizedFetch(`${API_BASE}/chat/message/${messageId}/pin`, {
      method: 'PATCH',
      body: JSON.stringify({ isPinned })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to pin message');
    return { messageId, isPinned, data: data.data };
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const deleteMessage = createAsyncThunk('chat/deleteMessage', async (messageId, { rejectWithValue }) => {
  if (typeof messageId === 'string' && messageId.startsWith('temp-')) {
    return messageId;
  }
  try {
    const response = await authorizedFetch(`${API_BASE}/chat/message/${messageId}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to delete message');
    }
    return messageId;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const sendMessage = createAsyncThunk('chat/sendMessage', async ({ roomId, receiverId, message, replyTo }, { rejectWithValue, getState }) => {
  try {
    const { auth } = getState();
    const token = auth.token || localStorage.getItem('edrilla_token');

    const response = await fetch(`${API_BASE}/chat/message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-access-token': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ roomId, receiverId, message, replyTo })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to send message');
    }

    return data.newMessage || data.message || data;
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to send message');
  }
});

export const fetchCourseRooms = createAsyncThunk('chat/fetchCourseRooms', async (_, { rejectWithValue }) => {
  try {
    const response = await authorizedFetch(`${API_BASE}/chat/course/rooms`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch course rooms');
    // The API returns rooms in "courseChatRooms" key
    return data.courseChatRooms || data.data || data.rooms || [];
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const removeCourseParticipant = createAsyncThunk('chat/removeCourseParticipant', async ({ roomId, participantId }, { rejectWithValue }) => {
  try {
    const response = await authorizedFetch(`${API_BASE}/chat/course/participant/${roomId}/${participantId}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to remove participant');
    }
    return { roomId, participantId };
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const fetchMoreMessages = createAsyncThunk('chat/fetchMoreMessages', async ({ roomId, page }, { rejectWithValue, getState }) => {
  try {
    const state = getState();
    const isCourseGroup = (state.chat?.courseRooms || []).some(r => r._id === roomId);
    const FETCH_URL = isCourseGroup
      ? `${API_BASE}/chat/course/messages/${roomId}?page=${page}`
      : `${API_BASE}/chat/messages/${roomId}?page=${page}`;

    const response = await authorizedFetch(FETCH_URL);
    const data = await response.json();

    if (!response.ok) throw new Error(data.message || `Fetch failed (${response.status})`);

    const messages = data.messages || data.data || data;
    return {
      roomId,
      page,
      messages: Array.isArray(messages) ? messages : [],
      hasMore: Array.isArray(messages) && messages.length > 0,
    };
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to fetch more messages');
  }
});

const initialState = {
  rooms: [],
  courseRooms: [], // To store group/course chats
  messages: {},
  messagePagination: {}, // { [roomId]: { page, hasMore, loadingMore } }
  activeRoom: null,
  loading: false,
  socketLoading: false,
  hasFetched: false,
  sendingMessage: false,
  error: null,
  socketError: null,
  socketConnected: false,
  typingUsers: {},
  onlineUsers: [],
  notification: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setSocketConnected(state, action) {
      state.socketConnected = action.payload;
    },
    addMessage(state, action) {
      const message = action.payload;
      const roomId = String(message.roomId || message.chatRoomId || message.courseChatRoomId || '');
      if (!roomId) return;
      if (!state.messages[roomId]) state.messages[roomId] = [];

      const serverText = (message.message || message.text || message.body || message.content || '').trim();

      // Check if message._id is already in store
      const existingIdx = message._id ? state.messages[roomId].findIndex(m => m._id === message._id) : -1;

      // Find any optimistic temp message matching this text
      const tempIdx = state.messages[roomId].findIndex(m => {
        const isTemp = String(m._id || m.id || '').startsWith('temp-');
        if (!isTemp) return false;
        const localText = (m.message || m.text || m.body || m.content || '').trim();
        return localText === serverText;
      });

      if (existingIdx !== -1) {
        // Real message already in store; prune any matching temp message
        if (tempIdx !== -1) {
          state.messages[roomId].splice(tempIdx, 1);
        }
      } else if (tempIdx !== -1) {
        // Replace temp optimistic message with real server message
        state.messages[roomId][tempIdx] = { ...message, isSent: true, status: 'sent' };
      } else {
        // New incoming message
        if (serverText || message.fileUrl || (message.files && message.files.length > 0)) {
          state.messages[roomId].push({ ...message, status: 'sent' });
        }
      }

      // Ensure no duplicate IDs in store
      const seen = new Set();
      state.messages[roomId] = state.messages[roomId].filter(m => {
        const id = m._id || m.id;
        if (id && seen.has(id)) return false;
        if (id) seen.add(id);
        return true;
      });

      // update room last message
      const roomIndex = state.rooms.findIndex((r) => r._id === roomId);
      if (roomIndex !== -1) {
        state.rooms[roomIndex].lastMessage = message;
        if (state.activeRoom === roomId) {
          state.rooms[roomIndex].unreadCount = 0;
        } else {
          state.rooms[roomIndex].unreadCount = (state.rooms[roomIndex].unreadCount || 0) + 1;
        }
        const room = state.rooms.splice(roomIndex, 1)[0];
        state.rooms.unshift(room);
      }

      // update course room last message
      const courseRoomIndex = state.courseRooms.findIndex((r) => r._id === roomId);
      if (courseRoomIndex !== -1) {
        state.courseRooms[courseRoomIndex].lastMessage = message;
        if (state.activeRoom === roomId) {
          state.courseRooms[courseRoomIndex].unreadCount = 0;
        } else {
          state.courseRooms[courseRoomIndex].unreadCount = (state.courseRooms[courseRoomIndex].unreadCount || 0) + 1;
        }
        const room = state.courseRooms.splice(courseRoomIndex, 1)[0];
        state.courseRooms.unshift(room);
      }
    },
    updateMessageStatus(state, action) {
      const { roomId, messageId, status } = action.payload;
      if (!state.messages[roomId]) return;
      const msg = state.messages[roomId].find((m) => m._id === messageId || m.id === messageId);
      if (msg) {
        if (status === 'read') msg.isRead = true;
        if (status === 'sent') msg.status = 'sent';
      }
    },
    addTypingUser(state, action) {
      const { roomId, userId } = action.payload;
      if (!state.typingUsers[roomId]) state.typingUsers[roomId] = [];
      if (!state.typingUsers[roomId].includes(userId)) state.typingUsers[roomId].push(userId);
    },
    removeTypingUser(state, action) {
      const { roomId, userId } = action.payload;
      if (!state.typingUsers[roomId]) return;
      state.typingUsers[roomId] = state.typingUsers[roomId].filter((id) => id !== userId);
      if (!state.typingUsers[roomId].length) delete state.typingUsers[roomId];
    },
    addOnlineUser(state, action) {
      const id = action.payload;
      if (!state.onlineUsers.includes(id)) state.onlineUsers.push(id);
    },
    removeOnlineUser(state, action) {
      state.onlineUsers = state.onlineUsers.filter((id) => id !== action.payload);
    },
    setActiveRoom(state, action) {
      state.activeRoom = action.payload;
      const roomId = action.payload;
      if (roomId) {
        const room = state.rooms.find(r => r._id === roomId);
        if (room) {
          room.unreadCount = 0;
        }
        const courseRoom = state.courseRooms.find(r => r._id === roomId);
        if (courseRoom) {
          courseRoom.unreadCount = 0;
        }
      }
    },
    clearMessages(state, action) {
      const roomId = action.payload;
      if (state.messages[roomId]) delete state.messages[roomId];
    },
    clearNotification(state) {
      state.notification = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(connectSocket.pending, (state) => { state.socketLoading = true; state.socketError = null; })
      .addCase(connectSocket.fulfilled, (state) => { state.socketLoading = false; state.socketConnected = true; state.socketError = null; })
      .addCase(connectSocket.rejected, (state, action) => { state.socketLoading = false; state.socketConnected = false; state.socketError = action.payload; })

      .addCase(fetchChatRooms.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchChatRooms.fulfilled, (state, action) => {
        state.loading = false;
        state.rooms = action.payload || [];
        state.hasFetched = true;
        try { console.debug('chatSlice: rooms.fulfilled ->', state.rooms.length, state.rooms); } catch (e) { }
      })
      .addCase(fetchChatRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.hasFetched = true;
      })

      .addCase(fetchCourseRooms.fulfilled, (state, action) => {
        state.courseRooms = action.payload || [];
      })

      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { roomId, messages } = action.payload;
        state.messages[roomId] = messages || [];
        // Reset pagination for this room on fresh load
        state.messagePagination[roomId] = { page: 1, hasMore: true, loadingMore: false };
      })
      .addCase(fetchMoreMessages.pending, (state, action) => {
        const roomId = action.meta.arg.roomId;
        if (!state.messagePagination[roomId]) state.messagePagination[roomId] = { page: 1, hasMore: true, loadingMore: false };
        state.messagePagination[roomId].loadingMore = true;
      })
      .addCase(fetchMoreMessages.fulfilled, (state, action) => {
        const { roomId, page, messages, hasMore } = action.payload;
        if (!state.messages[roomId]) state.messages[roomId] = [];
        // Prepend older messages, avoiding duplicates
        const existingIds = new Set(state.messages[roomId].map(m => m._id));
        const newMsgs = messages.filter(m => !existingIds.has(m._id));
        state.messages[roomId] = [...newMsgs, ...state.messages[roomId]];
        state.messagePagination[roomId] = { page, hasMore, loadingMore: false };
      })
      .addCase(fetchMoreMessages.rejected, (state, action) => {
        const roomId = action.meta.arg?.roomId;
        if (roomId && state.messagePagination[roomId]) {
          state.messagePagination[roomId].loadingMore = false;
        }
      })
      .addCase(sendMessageSocket.pending, (state) => { state.sendingMessage = true; })
      .addCase(sendMessageSocket.fulfilled, (state, action) => {
        state.sendingMessage = false;
        const message = action.payload;
        const roomId = message.roomId;
        if (!roomId) return;
        if (!state.messages[roomId]) state.messages[roomId] = [];

        // If this is the optimistic return, don't add if already present or already confirmed by real message
        if (message._id && String(message._id).startsWith('temp-')) {
          const tempText = (message.message || message.text || message.body || '').trim();
          const alreadyHasRealMessage = state.messages[roomId].some(m => {
            const isTemp = String(m._id || m.id || '').startsWith('temp-');
            if (isTemp) return false;
            return (m.message || m.text || m.body || '').trim() === tempText;
          });
          if (!alreadyHasRealMessage && !state.messages[roomId].some(m => m._id === message._id)) {
            state.messages[roomId].push(message);
          }
          return;
        }

        // If it's a real server message, perform fuzzy replacement
        if (message._id && state.messages[roomId].some(m => m._id === message._id)) return;

        const serverText = (message.message || message.text || message.body || message.content || '').trim();
        const tempIdx = state.messages[roomId].findIndex(m => {
          const isTemp = m._id?.startsWith?.('temp-') || m.id?.startsWith?.('temp-');
          const localText = (m.message || m.text || m.body || m.content || '').trim();
          return isTemp && localText === serverText;
        });

        if (tempIdx !== -1) {
          state.messages[roomId][tempIdx] = { ...message, isSent: true, status: 'sent' };
        } else {
          state.messages[roomId].push({ ...message, isSent: true, status: 'sent' });
        }
      })
      .addCase(sendMessageSocket.rejected, (state, action) => {
        state.sendingMessage = false;
        state.error = action.payload;
        console.error('[REDUCER_DEBUG] sendMessageSocket.rejected', action.payload);
      })

      .addCase(pinMessage.fulfilled, (state, action) => {
        const { messageId, isPinned } = action.payload;
        Object.keys(state.messages).forEach(roomId => {
          const msg = state.messages[roomId].find(m => m._id === messageId);
          if (msg) msg.isPinned = isPinned;
        });
      })

      .addCase(deleteMessage.fulfilled, (state, action) => {
        const messageId = action.payload;
        Object.keys(state.messages).forEach(roomId => {
          state.messages[roomId] = state.messages[roomId].filter(m => m._id !== messageId && m.id !== messageId);
        });
      })

      .addCase(sendMessage.fulfilled, (state, action) => {
        const msg = action.payload;
        const roomId = msg.roomId || msg.chatRoomId;
        if (!state.messages[roomId]) state.messages[roomId] = [];
        state.messages[roomId].push(msg);
      })
      .addCase(sendMessage.rejected, (state, action) => { state.error = action.payload; })

      .addCase(removeCourseParticipant.fulfilled, (state, action) => {
        const { roomId, participantId } = action.payload;
        const room = state.courseRooms.find(r => r._id === roomId);
        if (room) {
          const removed = (room.participants || []).find(p => p._id === participantId);
          room.participants = (room.participants || []).filter(p => p._id !== participantId);
          state.notification = { type: 'success', message: `${removed?.fullName || removed?.name || 'Participant'} removed successfully` };
        }
      })
      .addCase(removeCourseParticipant.rejected, (state, action) => {
        state.notification = { type: 'error', message: action.payload || 'Failed to remove participant' };
      });
  }
});

export const { setSocketConnected, addMessage, updateMessageStatus, addTypingUser, removeTypingUser, addOnlineUser, removeOnlineUser, setActiveRoom, clearMessages, clearNotification } = chatSlice.actions;
export default chatSlice.reducer;
