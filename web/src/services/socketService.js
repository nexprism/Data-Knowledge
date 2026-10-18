// Dynamically import socket.io-client inside connect() to avoid importing
import { getApiBaseUrl } from '../utils/apiConfig';

const getBaseUrl = () => {
  return getApiBaseUrl();
};

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.authenticated = false;
    this.eventHandlers = new Map();
  }

  cleanup() {
    if (this.socket) {
      try {
        // remove listeners added by this instance
        if (this.socket.off) this.socket.off();
        if (this.socket.removeAllListeners) this.socket.removeAllListeners();
        if (this.socket.disconnect) this.socket.disconnect();
      } catch (e) {}
      this.socket = null;
    }
    this.connected = false;
    this.authenticated = false;
  }

  connect(token) {
    if (this.socket && this.socket.connected) return Promise.resolve(this.socket);

    return new Promise(async (resolve, reject) => {
      try {
        // lazy import to avoid engine.io-client being evaluated prematurely
        const mod = await import('socket.io-client');
        const io = mod.default || mod.io || mod;

        const baseUrl = getBaseUrl();
        const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};
        const path = env.VITE_SOCKET_PATH || '/socket.io';

        const opts = {
          path,
          transports: ['websocket'], // websocket-only, avoid polling transport
          upgrade: false, // don't attempt transport upgrade (prevents polling initialization)
          auth: { token },
          reconnection: true,
          reconnectionAttempts: 5,
          timeout: 20000,
        };

        if (typeof io !== 'function') {
           throw new Error('Socket.io client failed to load correctly');
        }

        this.socket = io(baseUrl, opts);

        const onConnect = () => {
          this.connected = true;
          if (token) this.socket.emit('authenticate', token);
          resolve(this.socket);
        };

        const onConnectError = (err) => {
          this.cleanup();
          reject(err || new Error('connect_error'));
        };

        this.socket.once('connect', onConnect);
        this.socket.once('connect_error', onConnectError);

        // Relay common events to registered handlers
        this.socket.on('authenticated', (data) => {
          this.authenticated = true;
          this._emitLocal('authenticated', data);
        });

        this.socket.on('disconnect', (reason) => {
          this.connected = false;
          this.authenticated = false;
          this._emitLocal('disconnect', reason);
        });

        this.socket.on('newMessage', (msg) => this._emitLocal('newMessage', msg));
        this.socket.on('newCourseChatMessage', (msg) => this._emitLocal('newCourseChatMessage', msg));
        this.socket.on('messageSent', (msg) => this._emitLocal('messageSent', msg));
        this.socket.on('user_typing', (data) => this._emitLocal('user_typing', data));
        this.socket.on('user_stopped_typing', (data) => this._emitLocal('user_stopped_typing', data));
        this.socket.on('user_online', (data) => this._emitLocal('user_online', data));
        this.socket.on('user_offline', (data) => this._emitLocal('user_offline', data));
        this.socket.on('progress-updated', (data) => this._emitLocal('progress-updated', data));
        this.socket.on('video-completed', (data) => this._emitLocal('video-completed', data));

      } catch (error) {
        this.cleanup();
        reject(error);
      }
    });
  }

  authenticate(token) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('authenticate', token);
    }
  }

  emit(event, payload) {
    if (this.socket && this.connected) {
      this.socket.emit(event, payload);
      return true;
    }
    return false;
  }

  disconnect() {
    if (this.socket) {
      try {
        this.socket.removeAllListeners();
        this.socket.disconnect();
      } catch (e) {}
      this.socket = null;
    }
    this.connected = false;
    this.authenticated = false;
    this.eventHandlers.clear();
  }

  sendMessage(payload) {
    if (!this.socket || !this.connected) {
        console.error('[SOCKET_DEBUG] Cannot send: Socket not connected');
        return Promise.reject(new Error('Socket not connected'));
    }
    
    // Low-level transmission log
    console.debug('[SOCKET_DEBUG] Emitting message payload', payload);

    // Try both common event names for compatibility
    this.socket.emit('sendMessage', payload);
    this.socket.emit('message', payload);
    
    return Promise.resolve({ status: 'emitted' });
  }

  on(event, cb) {
    if (!this.eventHandlers.has(event)) this.eventHandlers.set(event, []);
    this.eventHandlers.get(event).push(cb);
  }

  off(event, cb) {
    if (!this.eventHandlers.has(event)) return;
    const arr = this.eventHandlers.get(event).filter((fn) => fn !== cb);
    if (arr.length) this.eventHandlers.set(event, arr);
    else this.eventHandlers.delete(event);
  }

  _emitLocal(event, payload) {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach((h) => {
      try { h(payload); } catch (e) { console.error(e); }
    });
  }
}

const socketService = new SocketService();
export default socketService;
