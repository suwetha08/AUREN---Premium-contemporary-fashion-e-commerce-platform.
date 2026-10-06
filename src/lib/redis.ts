import Redis from 'ioredis';

// ─── Structured logger (inline to avoid circular deps) ───────────────────────
function log(event: string, detail?: Record<string, unknown>) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...detail }));
}

// ─── Lazy singleton ───────────────────────────────────────────────────────────
// We do NOT create the Redis client at module evaluation time.
// This allows `next build` to statically pre-render pages without needing
// a live Redis connection during the build phase.
//
// The client is created on the first call to `getRedis()` at RUNTIME only.
//
// The singleton is stored on `global` so that Next.js dev-mode hot-reloads
// do not spawn a new connection on every file change.

const g = global as unknown as { _aurenRedis?: Redis };

function createClient(): Redis {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error(
      'REDIS_URL environment variable is not set. ' +
      'Add REDIS_URL=redis://localhost:6379 to your .env.local file.'
    );
  }

  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    commandTimeout: 5000,
    retryStrategy(times) {
      const delay = Math.min(100 * Math.pow(2, times), 10_000);
      log('REDIS_RECONNECTING', { attempt: times, delayMs: delay });
      return delay;
    },
    // Reject queued commands immediately when Redis is unreachable.
    enableOfflineQueue: false,
  });

  client.on('connect', () => log('REDIS_CONNECTED'));
  client.on('ready',   () => log('REDIS_READY'));
  client.on('close',   () => log('REDIS_DISCONNECTED'));
  client.on('error',   (err: Error) => log('REDIS_ERROR', { message: err.message }));

  return client;
}

/**
 * Returns the shared Redis client, creating it on first call.
 * MUST be called at request time, not at module evaluation time.
 */
export function getRedis(): Redis {
  if (!g._aurenRedis) {
    g._aurenRedis = createClient();
  }
  return g._aurenRedis;
}

/**
 * Convenience alias — use `redis` in request handlers only.
 * Do NOT call this at the module top-level.
 */
export function redis(): Redis {
  return getRedis();
}

/** Returns true when the Redis connection is ready to accept commands. */
export function isRedisReady(): boolean {
  // Ensure the client is actually created so it can attempt to connect
  const client = getRedis();
  return client.status === 'ready';
}

/** Gracefully close the connection (e.g. in tests or on SIGTERM). */
export async function closeRedis(): Promise<void> {
  if (g._aurenRedis) {
    await g._aurenRedis.quit();
    delete g._aurenRedis;
    log('REDIS_SHUTDOWN');
  }
}

export default getRedis;
