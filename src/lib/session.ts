/**
 * Session Manager
 *
 * Responsibilities:
 *  1. Atomically enforce a hard cap of MAX_CONCURRENT_USERS active sessions.
 *  2. Store session data in Redis with a TTL.
 *  3. Release the slot on logout.
 *  4. Refresh the TTL on heartbeat / authenticated requests.
 *
 * Redis key schema
 * ─────────────────────────────────────────────────────────────────────────────
 *  auren:session:<sessionId>          → JSON session payload  (TTL = SESSION_TTL)
 *  auren:active:sessions              → Redis SET of sessionIds
 *
 * Active-session counting strategy
 * ─────────────────────────────────────────────────────────────────────────────
 * We use a Redis SET (`auren:active:sessions`) where each member is a sessionId.
 * SCARD = authoritative active user count.
 *
 * The critical add operation runs inside a Lua script so that the
 * "check capacity → add member" step is ATOMIC — no race condition possible.
 *
 * Session policy: one session per device (multiple devices per user).
 */

import crypto from 'crypto';
import { getRedis, isRedisReady } from './redis';
import { log } from './logger';

// ─── Configuration ────────────────────────────────────────────────────────────
const SESSION_TTL = parseInt(process.env.SESSION_TTL ?? '3600', 10);
const MAX_USERS   = parseInt(process.env.MAX_CONCURRENT_USERS ?? '100', 10);

// ─── Redis key helpers ────────────────────────────────────────────────────────
const KEY_SESSION = (id: string) => `auren:session:${id}`;
const KEY_ACTIVE  = 'auren:active:sessions';

// ─── Session shape ────────────────────────────────────────────────────────────
export interface SessionData {
  sessionId: string;
  userId: string;
  email: string;
  name: string;
  createdAt: string;
}

// ─── Lua: atomic "add if under limit" ─────────────────────────────────────────
//  KEYS[1] = auren:active:sessions
//  KEYS[2] = auren:session:<sessionId>
//  ARGV[1] = sessionId
//  ARGV[2] = maxUsers
//  ARGV[3] = sessionTTL (seconds)
//  ARGV[4] = session JSON payload
//  Returns 1 on success, 0 if limit reached.
const LUA_ADD_SESSION = `
local activeKey  = KEYS[1]
local sessionKey = KEYS[2]
local sessionId  = ARGV[1]
local maxUsers   = tonumber(ARGV[2])
local ttl        = tonumber(ARGV[3])
local payload    = ARGV[4]

local count = redis.call('SCARD', activeKey)
if count >= maxUsers then
  return 0
end

redis.call('SADD', activeKey, sessionId)
redis.call('SET',  sessionKey, payload, 'EX', ttl)
return 1
`;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Atomically reserve a slot and create a session.
 * Returns the new SessionData or null when the limit is reached.
 * Throws if Redis is unavailable (fail-closed).
 */
export async function createSession(
  userId: string,
  email: string,
  name: string
): Promise<SessionData | null> {
  if (!isRedisReady()) {
    throw new Error('AUTH_SERVICE_UNAVAILABLE');
  }

  const r = getRedis();
  const sessionId   = crypto.randomBytes(32).toString('hex');
  const payload: SessionData = {
    sessionId, userId, email, name,
    createdAt: new Date().toISOString(),
  };
  const payloadJson = JSON.stringify(payload);

  const result = await r.eval(
    LUA_ADD_SESSION,
    2,
    KEY_ACTIVE,
    KEY_SESSION(sessionId),
    sessionId,
    String(MAX_USERS),
    String(SESSION_TTL),
    payloadJson
  ) as number;

  if (result === 0) {
    log({ event: 'ACTIVE_USER_LIMIT_REACHED', userId });
    return null;
  }

  log({ event: 'LOGIN_SUCCESS', userId });
  return payload;
}

/**
 * Look up a session by ID and refresh its TTL (sliding window heartbeat).
 */
export async function getSession(sessionId: string): Promise<SessionData | null> {
  if (!isRedisReady()) return null;

  const r   = getRedis();
  const raw = await r.get(KEY_SESSION(sessionId));
  if (!raw) return null;

  await r.expire(KEY_SESSION(sessionId), SESSION_TTL);

  const data = JSON.parse(raw) as SessionData;
  log({ event: 'SESSION_REFRESHED', userId: data.userId });
  return data;
}

/**
 * Destroy a session and release its slot immediately.
 */
export async function deleteSession(sessionId: string): Promise<void> {
  if (!isRedisReady()) return;

  const r   = getRedis();
  const raw = await r.get(KEY_SESSION(sessionId));
  const userId = raw ? (JSON.parse(raw) as SessionData).userId : 'unknown';

  await r.del(KEY_SESSION(sessionId));
  await r.srem(KEY_ACTIVE, sessionId);

  log({ event: 'LOGOUT', userId });
}

/**
 * Return how many authenticated sessions currently exist.
 */
export async function getActiveCount(): Promise<number> {
  if (!isRedisReady()) return -1;
  return getRedis().scard(KEY_ACTIVE);
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────
export const COOKIE_NAME = 'auren_session';

export function sessionCookieOptions(ttl = SESSION_TTL) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: ttl,
    path: '/',
  };
}
