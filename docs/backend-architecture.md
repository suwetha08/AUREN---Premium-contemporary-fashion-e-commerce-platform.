# AUREN E-Commerce — Backend Architecture

## Overview

The backend is designed to handle **1,000 concurrent anonymous users** while enforcing a hard cap of **100 concurrent authenticated sessions** — enforced atomically via Redis.

---

## Architecture Diagram

```mermaid
flowchart TD
    Internet([Internet]) --> LB

    subgraph LB["Load Balancer (Nginx :80)"]
        direction LR
        Nginx[least_conn upstream\nhealth checks\nper-IP rate limiting]
    end

    LB --> B1["Backend 1\n:3001"]
    LB --> B2["Backend 2\n:3002"]
    LB --> B3["Backend 3\n:3003"]

    B1 & B2 & B3 --> Redis

    subgraph Redis["Redis (shared state)"]
        S1[auren:session:<id> → session data + TTL]
        S2[auren:active:sessions → SET of sessionIds]
        S3[auren:rate:login:<ip> → counter + TTL]
        S4["auren:cache:products:<params> → paginated result"]
    end

    Redis --> DB[(Database\nPostgreSQL / in-memory)]
```

---

## 1. Load Balancing

**Tool:** Nginx `upstream` block with `least_conn` strategy.

- Nginx distributes incoming HTTP requests across 3 backend instances.
- `least_conn` routes each request to whichever backend currently has the fewest active connections — better than round-robin for uneven workloads.
- Nginx also applies a **first-line per-IP rate limit** (`limit_req_zone`) on auth endpoints before requests even reach the backend.

---

## 2. Backend Instances

- Each backend is a **stateless** Next.js 16 (App Router) application.
- No session data, no user counters, no global variables are stored in backend memory.
- All shared state lives in Redis.
- Instances can be added/removed without reconfiguration (just update `nginx.conf`).

---

## 3. Redis

**Role:** Single source of truth for:
- Active session set
- Session payload (user data, TTL)
- Rate-limit counters
- Product response cache

**Client:** `ioredis` singleton (`src/lib/redis.ts`) with:
- Automatic reconnection (capped exponential back-off, max 10 s)
- `enableOfflineQueue: false` — commands fail immediately when Redis is down, preventing a queue build-up
- Structured event logging for connect/disconnect/error events

---

## 4. Authentication

### Login flow

```
POST /api/auth/login
        │
        ▼
Per-IP rate limit check (Redis INCR, Lua atomic)
        │
        ▼
Credential verification (user store / database)
        │
   ┌────┴────┐
invalid   valid
   │          │
  401         ▼
        Atomic slot reservation (Lua)
              │
         ┌────┴────┐
       limit     slot available
       reached        │
         │          Create session
        429         Store in Redis (TTL)
                    Set HttpOnly cookie
                    Return 200
```

### Error codes

| Situation | HTTP Status | Code |
|---|---|---|
| Missing fields | 400 | `BAD_REQUEST` |
| Wrong credentials | 401 | `INVALID_CREDENTIALS` |
| IP rate limited | 429 | `RATE_LIMITED` |
| 100-user cap reached | 429 | `ACTIVE_USER_LIMIT_REACHED` |
| Redis unavailable | 503 | `AUTH_SERVICE_UNAVAILABLE` |

---

## 5. Active User Limit

**Hard cap: 100 concurrent authenticated sessions**

> This is NOT "100 total registered users" or "100 page views".
> It is 100 simultaneously active, authenticated sessions.

### What "active" means

- A session is active from the moment of successful login until either:
  - The user explicitly logs out (slot released immediately), OR
  - The session TTL expires in Redis (slot released automatically)

### Tracking mechanism

Redis SET `auren:active:sessions`

- Each member is a `sessionId` (random 32-byte hex string)
- `SCARD(auren:active:sessions)` = current active user count

### Why a SET and not a counter?

A bare `INCR` counter has no way to auto-decrement when a session TTL expires. A SET of sessionIds allows us to use Redis TTL on the session key and a cleanup approach. The SCARD is the authoritative count.

> **Note:** For production at scale, add a Redis keyspace notification listener that removes the sessionId from the SET on key expiry. For the current scale (100 users), the Lua script + TTL approach is sufficient.

---

## 6. Atomic Limit Enforcement (Lua Script)

The critical section — "check count, then add" — runs as a single Lua script inside Redis.  
Lua scripts in Redis are executed **atomically** with no other command interleaved.

```lua
local count = redis.call('SCARD', activeKey)
if count >= maxUsers then
  return 0             -- limit reached
end
redis.call('SADD', activeKey, sessionId)
redis.call('SET',  sessionKey, payload, 'EX', ttl)
return 1               -- success
```

This prevents the classic TOCTOU race:

```
❌ WITHOUT atomic check:          ✅ WITH Lua (atomic):
  Thread A: SCARD → 99               Thread A: Lua → SCARD 99, SADD → return 1
  Thread B: SCARD → 99               Thread B: Lua → SCARD 100, return 0 ✅
  Thread A: SADD  → 100
  Thread B: SADD  → 101 ❌
```

---

## 7. Sessions

| Property | Value |
|---|---|
| Storage | Redis (`auren:session:<sessionId>`) |
| TTL | `SESSION_TTL` env var (default: 3600 s) |
| Cookie | `auren_session`, HttpOnly, SameSite=Lax, Secure in production |
| Heartbeat | `GET /api/auth/heartbeat` or any `GET /api/auth/me` refreshes TTL |
| Policy | One session per device; multiple devices per user allowed |

---

## 8. Rate Limiting

Implemented at two layers:

### Layer 1 — Nginx (`nginx.conf`)
```nginx
limit_req_zone $binary_remote_addr zone=login_zone:10m rate=10r/m;
```
Applied to `/api/auth/login` and `/api/auth/register`. Pure IP-based. Very fast (no Redis lookup).

### Layer 2 — Redis (`src/lib/rateLimit.ts`)
Fixed-window counter per `action:ip`. Atomic via Lua:
```lua
local count = redis.call('INCR', key)
if count == 1 then redis.call('EXPIRE', key, window) end
return count
```
Works identically across all backend instances. Configurable via `LOGIN_RATE_LIMIT` and `LOGIN_RATE_WINDOW`.

---

## 9. Caching

**Strategy:** Cache-aside (lazy population)

```
Request → Redis cache?
             │
       ┌─────┴──────┐
      HIT           MISS
       │              │
    Return         Query in-memory / DB
    cached            │
                   Store in Redis (TTL)
                      │
                   Return
```

**Cache keys:**
- `auren:cache:products:<page>:<limit>:<category>:<sort>` — product list pages
- `auren:cache:product:<slug>` — individual product (future)

**TTL:** `PRODUCT_CACHE_TTL` env var (default: 60 s)

**Cache invalidation:** When a product is created/updated/deleted, the relevant Redis keys must be deleted (`DEL`). Implemented at the write endpoint level.

---

## 10. Database

Currently uses an **in-memory user store** (`src/lib/userStore.ts`).  
The interface (`findUserByEmail`, `verifyPassword`, `createUser`) is intentionally abstracted — swap the implementation for a PostgreSQL pool (e.g., `pg`, Prisma, Drizzle) without changing any API route code.

For PostgreSQL, configure:
```env
DATABASE_URL=postgresql://user:pass@host:5432/auren
DATABASE_POOL_SIZE=10
```

---

## 11. Failure Handling

| Component | Behaviour on failure |
|---|---|
| Redis (auth operations) | **Fail closed** → 503 AUTH_SERVICE_UNAVAILABLE |
| Redis (product cache) | **Fail open** → fall through to in-memory query |
| Redis (rate limiting) | **Fail open** → allow request (non-critical) |
| Backend instance | Nginx removes from upstream on 3 consecutive failures |
| Database | 500 error (connection pool handles retries) |

---

## 12. Scaling Strategy

### Horizontal scaling

Add more backend instances → update `nginx.conf` upstream block. No other changes required.

### Redis scaling

- **Sentinel** for high availability (automatic failover)
- **Redis Cluster** for horizontal partitioning at very high volumes (>1M sessions)

### Beyond 100 concurrent users

Change `MAX_CONCURRENT_USERS` env var. The Lua script reads the limit from `ARGV[2]`, so no code changes are needed.

---

## 13. Key Distinction: 1000 vs 100

```
1,000 concurrent users ≠ 100 concurrent authenticated users

Anonymous user 1   → browsing products → ✅ allowed
Anonymous user 2   → browsing products → ✅ allowed
...
Anonymous user 1000 → browsing products → ✅ allowed

Logged-in user 1   → ✅ slot 1/100
Logged-in user 100  → ✅ slot 100/100
Logged-in user 101  → ❌ 429 ACTIVE_USER_LIMIT_REACHED

Logged-in user 1 logs out → slot freed
Logged-in user 101  → ✅ slot 100/100
```

The website is **never locked** for anonymous browsing. Only simultaneous authenticated sessions are capped.

---

## API Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/health | None | Load balancer health probe |
| GET | /api/metrics | X-Metrics-Key header | Admin metrics |
| POST | /api/auth/login | None | Authenticate + create session |
| POST | /api/auth/register | None | Create account + session |
| POST | /api/auth/logout | Cookie | Destroy session, release slot |
| GET | /api/auth/me | Cookie | Get current user + refresh TTL |
| GET | /api/auth/heartbeat | Cookie | Keep session alive |
| GET | /api/products | None | Paginated product listing (cached) |
| GET | /api/search | None | Full-text + faceted search |
