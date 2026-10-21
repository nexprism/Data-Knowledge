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

  async flushAll() {
    this.store.clear();
    this.sortedSets.clear();
    return 'OK';
  }

  async connect() {
    return this;
  }

  async disconnect() {
    return 'OK';
  }

  async quit() {
    return 'OK';
  }

  on(event, handler) {
    return this;
  }
}

let redisClient = null;
let memoryFallbackClient = null;

const initRedis = async () => {
  if (redisClient) return redisClient;

  const isRedisEnabled = process.env.REDIS_ENABLED !== 'false' && Boolean(process.env.REDIS_HOST && process.env.REDIS_PORT);

  // Attempt external Redis if enabled and configuration is present
  if (isRedisEnabled) {
    let client = null;
    try {
      const clientOptions = {
        socket: {
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT),
          connectTimeout: 1500,
          reconnectStrategy: false,
        },
      };

      if (process.env.REDIS_PASSWORD) {
        clientOptions.password = process.env.REDIS_PASSWORD;
      }

      client = createClient(clientOptions);
      client.on('error', () => {});

      await Promise.race([
        client.connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Redis connection timeout')), 2000)
        ),
      ]);

      console.log('✅ Connected to Redis');
      redisClient = client;
      return redisClient;
    } catch (err) {
      console.warn('⚠️ External Redis unavailable, falling back to in-memory store:', err.message);
      try {
        if (client) await client.disconnect();
      } catch (_) {}
    }
  }

  if (!memoryFallbackClient) {
    memoryFallbackClient = new MemoryRedisClient();
  }
  redisClient = memoryFallbackClient;
  return redisClient;
};

export { initRedis, redisClient };
