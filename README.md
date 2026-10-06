# Auren

A premium contemporary fashion e-commerce platform built with Next.js 16, designed to handle 1,000 concurrent anonymous users with a hard cap of 100 simultaneous authenticated sessions — enforced atomically via Redis.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Cache / Sessions | Redis 7 (ioredis) |
| Payments | Razorpay |
| Load Balancer | Nginx 1.25 |
| Containerisation | Docker + Docker Compose |

---

## Architecture

```
Client → Nginx :80 (least_conn + rate limiting)
              │
    ┌─────────┼─────────┐
    ▼         ▼         ▼
Backend 1  Backend 2  Backend 3
:3001       :3002       :3003
    └─────────┼─────────┘
              ▼
           Redis :6379
     (sessions · cache · rate limits)
```

- **Nginx** load balances across 3 stateless Next.js instances using `least_conn` and applies a first-line per-IP rate limit on auth endpoints.
- **Backends** are fully stateless — all shared state lives in Redis.
- **Redis** stores active sessions, rate-limit counters, and product cache. The 100-user cap is enforced with an atomic Lua script to prevent race conditions.

For a full breakdown see [`docs/backend-architecture.md`](docs/backend-architecture.md).

---

## Getting Started

### Local development (no Docker)

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in values
cp .env.example .env

# 3. Start Redis locally (or point REDIS_URL at a remote instance)
# 4. Run the dev server
npm run dev
```

App runs at `http://localhost:3000`.

### Production (Docker)

```bash
# Build and start all services
docker compose up --build

# Run in background
docker compose up --build -d
```

App runs at `http://localhost` (port 80 via Nginx).

| Service | Port |
|---|---|
| Nginx (entry point) | `http://localhost` |
| Backend 1 | `http://localhost:3001` |
| Backend 2 | `http://localhost:3002` |
| Backend 3 | `http://localhost:3003` |
| Redis | `localhost:6379` |

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Redis
REDIS_URL=redis://localhost:6379

# Session
SESSION_TTL=3600                  # seconds

# Concurrent user limits
MAX_CONCURRENT_USERS=100
MAX_CONCURRENT_CONNECTIONS=1000

# Rate limiting (per IP)
LOGIN_RATE_LIMIT=10               # max attempts
LOGIN_RATE_WINDOW=60              # per N seconds
REGISTER_RATE_LIMIT=5

# Product cache
PRODUCT_CACHE_TTL=60              # seconds

# Payments
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Admin metrics endpoint
METRICS_SECRET=change-me-in-production
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | None | Health probe (used by Nginx + Docker) |
| GET | `/api/metrics` | `X-Metrics-Key` header | Admin metrics |
| POST | `/api/auth/register` | None | Create account + session |
| POST | `/api/auth/login` | None | Authenticate + create session |
| POST | `/api/auth/logout` | Cookie | Destroy session, release slot |
| GET | `/api/auth/me` | Cookie | Get current user + refresh TTL |
| GET | `/api/auth/heartbeat` | Cookie | Keep session alive |
| GET | `/api/products` | None | Paginated product listing (cached) |
| GET | `/api/search` | None | Full-text + faceted search |
| GET | `/api/account/orders` | Cookie | Order history |
| POST | `/api/payments/create-order` | Cookie | Initiate Razorpay order |
| POST | `/api/payments/verify` | Cookie | Verify payment signature |
| POST | `/api/payments/webhook` | None | Razorpay webhook handler |

### Auth error codes

| Status | Code | Reason |
|---|---|---|
| 400 | `BAD_REQUEST` | Missing fields |
| 401 | `INVALID_CREDENTIALS` | Wrong email or password |
| 429 | `RATE_LIMITED` | Too many attempts from this IP |
| 429 | `ACTIVE_USER_LIMIT_REACHED` | 100-session cap hit |
| 503 | `AUTH_SERVICE_UNAVAILABLE` | Redis unreachable |

---

## Scripts

```bash
npm run dev       # development server
npm run build     # production build
npm run start     # start production server
npm run lint      # ESLint
npm run test      # backend integration tests
```

---

## Project Structure

```
src/
├── app/
│   ├── api/          # API routes (auth, products, payments, search)
│   ├── account/      # Account page
│   ├── cart/         # Cart page
│   ├── checkout/     # Checkout page
│   ├── product/      # Product detail page
│   ├── shop/         # Shop listing
│   ├── search/       # Search results
│   ├── new-arrivals/ # New arrivals
│   ├── women/        # Women's category
│   └── wishlist/     # Wishlist
├── components/       # Header, Footer
├── context/          # StoreContext (cart, wishlist state)
└── lib/              # Redis, sessions, rate limiting, data, payments
docs/
└── backend-architecture.md   # Detailed architecture reference
tests/
└── backend.test.mjs          # Backend integration tests
```

---

## Concurrency Model

The platform distinguishes between two types of users:

- **Anonymous users** — unlimited, can browse and search freely
- **Authenticated users** — capped at 100 simultaneous sessions

The cap is enforced atomically in Redis using a Lua script, preventing race conditions where two users could both read `count = 99` and both get in, pushing the total to 101.

When a user logs out or their session TTL expires, the slot is released automatically.
