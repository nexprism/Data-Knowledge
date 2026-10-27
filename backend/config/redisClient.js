import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

// In-memory Redis simulation for local development or when Redis server is offline
class MemoryRedisClient {
  constructor() {
    this.store = new Map(); // key -> { value, expiry }
    this.sortedSets = new Map(); // key -> [{ score, value }]
    this.isOpen = true;
  }

  _isExpired(item) {
    return item.expiry && item.expiry <= Date.now();
  }

  async get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (this._isExpired(item)) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key, value, options = {}) {
    let expiry = null;
    if (options?.EX) {
      expiry = Date.now() + options.EX * 1000;
    } else if (options?.PX) {
      expiry = Date.now() + options.PX;
    }
    this.store.set(key, { value: String(value), expiry });
    return 'OK';
  }

  async setEx(key, seconds, value) {
    const expiry = Date.now() + seconds * 1000;
    this.store.set(key, { value: String(value), expiry });
    return 'OK';
  }

  async del(keys) {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    let deletedCount = 0;
    for (const pattern of keyArray) {
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        for (const k of Array.from(this.store.keys())) {
          if (regex.test(k)) {
            this.store.delete(k);
            deletedCount++;
          }
        }
        for (const k of Array.from(this.sortedSets.keys())) {
          if (regex.test(k)) {
            this.sortedSets.delete(k);
            deletedCount++;
          }
        }
      } else {
        if (this.store.delete(pattern)) deletedCount++;
        if (this.sortedSets.delete(pattern)) deletedCount++;
      }
    }
    return deletedCount;
  }

  async keys(pattern = '*') {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const matched = [];
    for (const [k, item] of this.store.entries()) {
      if (this._isExpired(item)) {
        this.store.delete(k);
        continue;
      }
      if (regex.test(k)) matched.push(k);
    }
    for (const k of this.sortedSets.keys()) {
      if (regex.test(k) && !matched.includes(k)) matched.push(k);
    }
    return matched;
  }

  async zAdd(key, items) {
    if (!this.sortedSets.has(key)) {
      this.sortedSets.set(key, []);
    }
    const set = this.sortedSets.get(key);
    const itemArray = Array.isArray(items) ? items : [items];
    for (const item of itemArray) {
      const idx = set.findIndex((x) => x.value === item.value);
      if (idx >= 0) {
        set[idx].score = item.score;
      } else {
        set.push({ score: item.score, value: item.value });
      }
    }
    set.sort((a, b) => a.score - b.score);
    return itemArray.length;
  }

  async zRangeByScore(key, min, max) {
    const set = this.sortedSets.get(key);
    if (!set) return [];
    const minVal = min === '-inf' ? -Infinity : Number(min);
    const maxVal = max === '+inf' ? Infinity : Number(max);
    return set
      .filter((x) => x.score >= minVal && x.score <= maxVal)
      .map((x) => x.value);
  }

  async zRemRangeByScore(key, min, max) {
    const set = this.sortedSets.get(key);
    if (!set) return 0;
    const minVal = min === '-inf' ? -Infinity : Number(min);
    const maxVal = max === '+inf' ? Infinity : Number(max);
    const initialLen = set.length;
    const remaining = set.filter((x) => !(x.score >= minVal && x.score <= maxVal));
    this.sortedSets.set(key, remaining);
    return initialLen - remaining.length;
  }

  async exists(key) {
    const val = await this.get(key);
    return val !== null || this.sortedSets.has(key) ? 1 : 0;
  }

  async expire(key, seconds) {
    const item = this.store.get(key);
    if (item) {
      item.expiry = Date.now() + seconds * 1000;
      return 1;
    }
    return 0;
  }

  async ttl(key) {
    const item = this.store.get(key);
    if (!item) return -2;
    if (!item.expiry) return -1;
    const remaining = Math.floor((item.expiry - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async ping() {
    return 'PONG';
  }

  async dbSize() {
    return this.store.size + this.sortedSets.size;
  }

  async dbsize() {
    return this.store.size + this.sortedSets.size;
  }

  async flushAll() {
    this.store.clear();
    this.sortedSets.clear();
    return 'OK';
  }

  async connect() {
    this.isOpen = true;
    return this;
  }

  async disconnect() {
    this.isOpen = false;
    return 'OK';
  }

  async quit() {
    this.isOpen = false;
    return 'OK';
  }

  on(event, handler) {
    return this;
  }
}

import Setting from '../models/setting.js';

let redisClient = null;
let externalClient = null;
let memoryFallbackClient = null;
let isRedisManuallyDisabled = false;
let isExternalConnected = false;
let lastError = null;
let lastPingLatency = null;
let dbSettingLoaded = false;

const getMemoryFallback = () => {
  if (!memoryFallbackClient) {
    memoryFallbackClient = new MemoryRedisClient();
  }
  return memoryFallbackClient;
};

const syncSettingFromDB = async () => {
  if (dbSettingLoaded) return;
  try {
    const dbSetting = await Setting.findOne({ key: 'redis_enabled' });
    if (dbSetting !== null && dbSetting.value !== undefined) {
      isRedisManuallyDisabled = !(dbSetting.value === true || dbSetting.value === 'true');
    }
    dbSettingLoaded = true;
  } catch (_) {
    // DB might not be ready yet
  }
};

const connectExternalRedis = async (force = false) => {
  await syncSettingFromDB();

  if (isRedisManuallyDisabled || process.env.REDIS_ENABLED === 'false') {
    isExternalConnected = false;
    redisClient = getMemoryFallback();
    return redisClient;
  }

  const host = process.env.REDIS_HOST;
  const port = process.env.REDIS_PORT;

  if (!host || !port) {
    lastError = 'REDIS_HOST or REDIS_PORT not configured in environment';
    isExternalConnected = false;
    redisClient = getMemoryFallback();
    return redisClient;
  }

  if (externalClient && isExternalConnected && externalClient.isOpen && !force) {
    redisClient = externalClient;
    return redisClient;
  }

  // If previous external client exists, clean it up before reconnecting
  if (externalClient) {
    try {
      await externalClient.disconnect();
    } catch (_) {}
    externalClient = null;
  }

  let client = null;
  try {
    const clientOptions = {
      socket: {
        host: host,
        port: Number(port),
        connectTimeout: 2000,
        reconnectStrategy: false,
      },
    };

    if (process.env.REDIS_PASSWORD) {
      clientOptions.password = process.env.REDIS_PASSWORD;
    }

    client = createClient(clientOptions);
    client.on('error', (err) => {
      lastError = err?.message || 'Redis client runtime error';
    });

    await Promise.race([
      client.connect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis connection timeout (2000ms)')), 2500)
      ),
    ]);

    // Measure initial ping
    const pingStart = Date.now();
    await client.ping();
    lastPingLatency = Date.now() - pingStart;

    console.log('✅ Connected to External Redis (' + host + ':' + port + ')');
    externalClient = client;
    isExternalConnected = true;
    lastError = null;
    redisClient = externalClient;
    return redisClient;
  } catch (err) {
    console.warn('⚠️ External Redis unavailable (' + (err?.message || err) + '), using in-memory store');
    lastError = err?.message || 'Connection failed';
    isExternalConnected = false;
    try {
      if (client) await client.disconnect();
    } catch (_) {}
    externalClient = null;
    redisClient = getMemoryFallback();
    return redisClient;
  }
};

const initRedis = async () => {
  if (redisClient) {
    // If external redis is expected but disconnected, or if client state changed
    if (!isRedisManuallyDisabled && !isExternalConnected && process.env.REDIS_ENABLED !== 'false' && process.env.REDIS_HOST) {
      return await connectExternalRedis();
    }
    return redisClient;
  }

  return await connectExternalRedis();
};

const getRedisStatus = async () => {
  await syncSettingFromDB();

  const isEnabled = !isRedisManuallyDisabled && process.env.REDIS_ENABLED !== 'false';
  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379;
  const hasPassword = Boolean(process.env.REDIS_PASSWORD);

  let keyCount = 0;
  let latencyMs = lastPingLatency;
  let connected = isExternalConnected;
  let currentMode = !isEnabled ? 'disabled' : (connected ? 'external' : 'memory');

  try {
    const activeClient = redisClient || getMemoryFallback();
    if (activeClient) {
      if (typeof activeClient.dbSize === 'function') {
        keyCount = await activeClient.dbSize();
      } else if (typeof activeClient.dbsize === 'function') {
        keyCount = await activeClient.dbsize();
      } else if (typeof activeClient.keys === 'function') {
        const k = await activeClient.keys('*');
        keyCount = Array.isArray(k) ? k.length : 0;
      }

      if (connected && externalClient && externalClient.isOpen) {
        const pStart = Date.now();
        await externalClient.ping();
        latencyMs = Date.now() - pStart;
        lastPingLatency = latencyMs;
      }
    }
  } catch (err) {
    lastError = err?.message || 'Error checking Redis status';
  }

  return {
    success: true,
    enabled: isEnabled,
    connected: isEnabled && connected,
    mode: currentMode,
    latencyMs,
    keyCount,
    error: lastError ? 'Connection issue encountered' : null,
    lastChecked: new Date().toISOString(),
  };
};

const toggleRedis = async (enableState) => {
  const shouldEnable = Boolean(enableState);
  isRedisManuallyDisabled = !shouldEnable;
  dbSettingLoaded = true;

  try {
    await Setting.findOneAndUpdate(
      { key: 'redis_enabled' },
      { value: shouldEnable, description: 'Redis external connection enabled/disabled' },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.warn('⚠️ Could not persist redis_enabled in Setting model:', err.message);
  }

  if (!shouldEnable) {
    if (externalClient) {
      try {
        await externalClient.disconnect();
      } catch (_) {}
      externalClient = null;
    }
    isExternalConnected = false;
    lastError = null;
    redisClient = getMemoryFallback();
    return {
      ...(await getRedisStatus()),
      message: 'Redis connection turned OFF. In-memory cache fallback is active.',
    };
  } else {
    await connectExternalRedis(true);
    const status = await getRedisStatus();
    return {
      ...status,
      message: status.connected
        ? 'Redis connection turned ON and connected successfully.'
        : `Redis connection turned ON, but external server could not be reached (${status.error || 'Connection failed'}). Using in-memory fallback.`,
    };
  }
};

const testRedisConnection = async () => {
  const start = Date.now();
  try {
    const activeClient = await initRedis();
    if (!activeClient) throw new Error('No Redis client initialized');
    const pong = await activeClient.ping();
    const latencyMs = Date.now() - start;
    lastPingLatency = latencyMs;

    return {
      success: true,
      ping: pong || 'PONG',
      latencyMs,
      connected: isExternalConnected,
      mode: !isRedisManuallyDisabled ? (isExternalConnected ? 'external' : 'memory') : 'disabled',
      message: isExternalConnected
        ? `External Redis ping successful (${latencyMs}ms)`
        : `In-memory Redis ping successful (${latencyMs}ms)`,
    };
  } catch (err) {
    return {
      success: false,
      error: err?.message || 'Ping failed',
      latencyMs: Date.now() - start,
      connected: false,
      mode: 'error',
      message: `Redis ping failed: ${err?.message || 'Unknown error'}`,
    };
  }
};

const flushRedisCache = async () => {
  try {
    const activeClient = await initRedis();
    if (activeClient && typeof activeClient.flushAll === 'function') {
      await activeClient.flushAll();
      return {
        success: true,
        message: 'Redis cache flushed successfully.',
      };
    }
    return {
      success: false,
      message: 'Active Redis client does not support flushAll.',
    };
  } catch (err) {
    return {
      success: false,
      error: err?.message || 'Failed to flush cache',
      message: `Failed to flush cache: ${err?.message || 'Unknown error'}`,
    };
  }
};

export {
  initRedis,
  redisClient,
  getRedisStatus,
  toggleRedis,
  testRedisConnection,
  flushRedisCache,
};

