/**
 * Structured application logger.
 * Emits newline-delimited JSON to stdout so any log aggregator (Datadog,
 * CloudWatch, Loki …) can parse it without further configuration.
 *
 * NEVER log passwords, tokens, session IDs, or cookies.
 */

export type LogEvent =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'ACTIVE_USER_LIMIT_REACHED'
  | 'LOGOUT'
  | 'SESSION_EXPIRED'
  | 'SESSION_REFRESHED'
  | 'REDIS_CONNECTED'
  | 'REDIS_DISCONNECTED'
  | 'REDIS_RECONNECTING'
  | 'REDIS_READY'
  | 'REDIS_ERROR'
  | 'REDIS_SHUTDOWN'
  | 'RATE_LIMITED'
  | 'CACHE_HIT'
  | 'CACHE_MISS'
  | 'AUTH_SERVICE_UNAVAILABLE'
  | 'REGISTER_SUCCESS'
  | 'REGISTER_FAILED'
  | 'HEALTH_CHECK';

interface LogPayload {
  event: LogEvent | string;
  userId?: string;
  ip?: string;
  path?: string;
  message?: string;
  [key: string]: unknown;
}

export function log(payload: LogPayload): void {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      env: process.env.NODE_ENV ?? 'unknown',
      ...payload,
    })
  );
}
