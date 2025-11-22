const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Simple health route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Optional Redis client (use REDIS_URL env var). If not provided, fall back to in-memory map (demo only).
let redisClient = null;
let useRedis = false;
if (process.env.REDIS_URL) {
  try {
    const { createClient } = require('redis');
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', (err) => console.error('Redis error', err));
    redisClient.connect().then(() => console.log('Connected to Redis'));
    useRedis = true;
  } catch (err) {
    console.warn('Failed to initialize Redis client, falling back to memory store', err);
    useRedis = false;
  }
}

const notes = new Map();

// Helper to store a payload (ciphertext + iv + optional metadata)
async function storeNote(id, payload, ttlSeconds = 24 * 60 * 60) {
  if (useRedis && redisClient) {
    await redisClient.set(id, JSON.stringify(payload), { EX: ttlSeconds });
  } else {
    notes.set(id, payload);
    setTimeout(() => notes.delete(id), ttlSeconds * 1000);
  }
}

// Helper to get-and-delete atomically
async function getAndDeleteNote(id) {
  if (useRedis && redisClient) {
    // EVAL script: get value then delete key
    const script = "local v = redis.call('GET', KEYS[1]); if v then redis.call('DEL', KEYS[1]); end; return v;";
    const val = await redisClient.eval(script, { keys: [id] });
    if (!val) return null;
    try {
      return JSON.parse(val);
    } catch (e) {
      return null;
    }
  } else {
    if (!notes.has(id)) return null;
    const v = notes.get(id);
    notes.delete(id);
    return v;
  }
}

// POST /api/note - store an encrypted payload and return an id
app.post('/api/note', async (req, res) => {
  const { payload, ttlSeconds } = req.body || {};
  if (!payload || !payload.data) return res.status(400).json({ error: 'Missing payload' });
  const id = require('crypto').randomUUID();
  const ttl = typeof ttlSeconds === 'number' ? ttlSeconds : 24 * 60 * 60; // seconds
  try {
    await storeNote(id, payload, ttl);
    res.json({ id });
  } catch (err) {
    console.error('Store note error', err);
    res.status(500).json({ error: 'Failed to store note' });
  }
});

// GET /api/note/:id - return the payload once and delete it (burn-once)
app.get('/api/note/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const payload = await getAndDeleteNote(id);
    if (!payload) return res.status(404).json({ error: 'Not found' });
    res.json({ payload });
  } catch (err) {
    console.error('Get note error', err);
    res.status(500).json({ error: 'Failed to retrieve note' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
