/**
 * Distributed rate limiter backed by Redis.
 * Uses a fixed-window counter per key with Lua-atomic increment.
 * Works identically across all backend instances.
 *
 * Key schema:
 *   auren:rate:<action>:<identifier>
 */

import { getRedis, isRedisReady } from './redis';
import { log } from './logger';

const LOGIN_RATE_LIMIT  = parseInt(process.env.LOGIN_RATE_LIMIT  ?? '10', 10);
const LOGIN_RATE_WINDOW = parseInt(process.env.LOGIN_RATE_WINDOW ?? '60', 10);

const LUA_RATE_INCR = `
local key    = KEYS[1]
local window = tonumber(ARGV[1])
local count  = redis.call('INCR', key)
if count == 1 then
  redis.call('EXPIRE', key, window)
end
return count
`;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

export async function checkRateLimit(
  action: string,
  identifier: string,
  limit    = LOGIN_RATE_LIMIT,
  windowSec = LOGIN_RATE_WINDOW
): Promise<RateLimitResult> {
  if (!isRedisReady()) {
    // Fail open for rate limiting (non-critical)
    return { allowed: true, remaining: limit, resetInSeconds: windowSec };
  }

  const r     = getRedis();
  const key   = `auren:rate:${action}:${identifier}`;
  const count = (await r.eval(LUA_RATE_INCR, 1, key, String(windowSec))) as number;
  const ttl   = await r.ttl(key);

  const allowed   = count <= limit;
  const remaining = Math.max(0, limit - count);

  if (!allowed) {
    log({ event: 'RATE_LIMITED', action, identifier, count });
  }

  return { allowed, remaining, resetInSeconds: ttl > 0 ? ttl : windowSec };
}
