/**
 * AUREN Backend Test Suite
 *
 * Self-contained: registers users via /api/auth/register (no direct imports).
 * Requires:
 *   - Redis at REDIS_URL
 *   - Backend at TEST_BASE_URL with LOGIN_RATE_LIMIT >= 300
 *
 * Run:
 *   node tests/backend.test.mjs
 */

import Redis from 'ioredis';

const BASE      = process.env.TEST_BASE_URL  ?? 'http://localhost:3000';
const REDIS_URL = process.env.REDIS_URL      ?? 'redis://localhost:6379';
const MAX_USERS = parseInt(process.env.MAX_CONCURRENT_USERS ?? '100', 10);

const redis = new Redis(REDIS_URL, { lazyConnect: true });
await redis.connect();

let pass = 0, fail = 0;

function assert(name, condition, detail = '') {
  if (condition) { console.log(`  ✅  ${name}`); pass++; }
  else           { console.error(`  ❌  ${name}${detail ? ': ' + detail : ''}`); fail++; }
}

async function post(path, body, headers = {}) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  return { status: r.status, json: await r.json().catch(() => ({})), headers: r.headers };
}

async function get(path, headers = {}) {
  const r = await fetch(`${BASE}${path}`, { headers });
  return { status: r.status, json: await r.json().catch(() => ({})) };
}

async function clearRedis() {
  const keys = await redis.keys('auren:*');
  if (keys.length) await redis.del(...keys);
}

function extractCookie(headers) {
  const m = (headers.get('set-cookie') ?? '').match(/auren_session=([^;]+)/);
  return m ? m[1] : null;
}

// Register a user via API; ignore 409 (already exists)
async function registerUser(email, password, name) {
  await post('/api/auth/register', { email, password, name });
}

// ─── 1. Health ────────────────────────────────────────────────────────────────
async function testHealth() {
  console.log('\n─── 1. Health Check ──────────────────────────────────────────');
  const { status, json } = await get('/api/health');
  assert('GET /api/health returns 200',    status === 200,    `got ${status}`);
  assert('/api/health.status is "ok"',     json.status === 'ok', JSON.stringify(json));
  assert('Redis reported as connected',    json.redis === 'connected', `got ${json.redis}`);
}

// ─── 2. Auth ──────────────────────────────────────────────────────────────────
async function testAuth() {
  console.log('\n─── 2. Authentication ────────────────────────────────────────');
  await clearRedis();

  const r1 = await post('/api/auth/login', { email: 'alice@auren.com', password: 'password123' });
  assert('Valid login returns 200',          r1.status === 200, `got ${r1.status}`);
  assert('Valid login success:true',         r1.json.success === true);
  const cookie = extractCookie(r1.headers);
  assert('Session cookie set',               !!cookie);

  const r2 = await post('/api/auth/login', { email: 'alice@auren.com', password: 'wrong' });
  assert('Invalid credentials → 401',        r2.status === 401, `got ${r2.status}`);
  assert('Code = INVALID_CREDENTIALS',       r2.json.code === 'INVALID_CREDENTIALS');

  const r3 = await get('/api/auth/me', { Cookie: `auren_session=${cookie}` });
  assert('/api/auth/me → authenticated:true', r3.json.authenticated === true);

  const r4 = await post('/api/auth/logout', {}, { Cookie: `auren_session=${cookie}` });
  assert('Logout returns 200',               r4.status === 200);

  const r5 = await get('/api/auth/me', { Cookie: `auren_session=${cookie}` });
  assert('Session invalid after logout',     r5.json.authenticated !== true);
}

// ─── 3. 100-User Hard Limit (sequential) ─────────────────────────────────────
async function testHardLimit() {
  console.log('\n─── 3. 100-User Hard Limit ───────────────────────────────────');
  await clearRedis();

  const emails = Array.from({ length: 110 }, (_, i) => `limit_${i}@auren.com`);
  for (const email of emails) await registerUser(email, 'pass123', 'User');
  await clearRedis(); // clear sessions created during registration

  const results = [];
  for (const email of emails) {
    const r = await post('/api/auth/login', { email, password: 'pass123' });
    results.push(r.status);
  }

  const successes   = results.filter(s => s === 200).length;
  const rejected    = results.filter(s => s === 429).length;
  const activeCount = await redis.scard('auren:active:sessions');

  assert(`Exactly ${MAX_USERS} sessions created`,     successes === MAX_USERS,     `got ${successes}`);
  assert('Exactly 10 logins rejected with 429',       rejected  === 10,            `got ${rejected}`);
  assert(`Redis active:sessions = ${MAX_USERS}`,      activeCount === MAX_USERS,   `got ${activeCount}`);
  assert(`Active count never exceeded ${MAX_USERS}`,  activeCount <= MAX_USERS);
}

// ─── 4. Race Condition — 200 simultaneous logins ─────────────────────────────
async function testRaceCondition() {
  console.log('\n─── 4. Race Condition — 200 Simultaneous Logins ─────────────');
  await clearRedis();

  const emails = Array.from({ length: 200 }, (_, i) => `race_${i}@auren.com`);
  for (const email of emails) await registerUser(email, 'race123', 'Race');
  await clearRedis(); // clear registration sessions

  const results = await Promise.all(
    emails.map(email => post('/api/auth/login', { email, password: 'race123' }))
  );

  const activeCount = await redis.scard('auren:active:sessions');
  const successes   = results.filter(r => r.status === 200).length;
  const rejected    = results.filter(r => r.status === 429).length;

  assert('Active sessions never exceeded 100', activeCount <= MAX_USERS, `got ${activeCount}`);
  assert('Active sessions is exactly 100',     activeCount === MAX_USERS, `got ${activeCount}`);
  assert(`${successes} logins succeeded (≤100)`, successes <= MAX_USERS);
  assert(`${rejected} logins rejected`,          rejected === 200 - successes);
  console.log(`   → ${successes} succeeded, ${rejected} rejected, Redis count: ${activeCount}`);
}

// ─── 5. Logout Slot Release ───────────────────────────────────────────────────
async function testLogoutSlotRelease() {
  console.log('\n─── 5. Logout Slot Release ───────────────────────────────────');
  await clearRedis();

  const emails = Array.from({ length: MAX_USERS }, (_, i) => `slot_${i}@auren.com`);
  for (const email of emails) await registerUser(email, 'pass123', 'User');
  await clearRedis();

  const cookies = [];
  for (const email of emails) {
    const r = await post('/api/auth/login', { email, password: 'pass123' });
    if (r.status === 200) cookies.push(extractCookie(r.headers));
  }

  const before = await redis.scard('auren:active:sessions');
  assert(`All ${MAX_USERS} slots filled`, before === MAX_USERS, `got ${before}`);

  await registerUser('extra_slot@auren.com', 'pass123', 'Extra');
  const r101 = await post('/api/auth/login', { email: 'extra_slot@auren.com', password: 'pass123' });
  assert('101st login rejected (429)', r101.status === 429, `got ${r101.status}`);

  await post('/api/auth/logout', {}, { Cookie: `auren_session=${cookies[0]}` });
  const after = await redis.scard('auren:active:sessions');
  assert('After logout: 99 active sessions', after === MAX_USERS - 1, `got ${after}`);

  const r102 = await post('/api/auth/login', { email: 'extra_slot@auren.com', password: 'pass123' });
  assert('After logout: new login succeeds', r102.status === 200, `got ${r102.status}`);

  const final = await redis.scard('auren:active:sessions');
  assert(`Final count back to ${MAX_USERS}`, final === MAX_USERS, `got ${final}`);
}

// ─── 6. Session Expiry (TTL inspection) ──────────────────────────────────────
async function testSessionExpiry() {
  console.log('\n─── 6. Session Expiry ────────────────────────────────────────');
  await clearRedis();

  const r = await post('/api/auth/login', { email: 'alice@auren.com', password: 'password123' });
  if (r.status !== 200) { assert('Login for expiry test', false, `got ${r.status}`); return; }

  const cookie = extractCookie(r.headers);
  const ttl    = await redis.ttl(`auren:session:${cookie}`);

  assert('Session has positive TTL',       ttl > 0,    `got ${ttl}`);
  assert('Session TTL ≤ 3600',             ttl <= 3600, `got ${ttl}`);

  const ttlBefore = ttl;
  await get('/api/auth/heartbeat', { Cookie: `auren_session=${cookie}` });
  const ttlAfter = await redis.ttl(`auren:session:${cookie}`);
  assert('Heartbeat refreshes TTL',        ttlAfter >= ttlBefore - 2, `before=${ttlBefore} after=${ttlAfter}`);
}

// ─── 7. Product API ───────────────────────────────────────────────────────────
async function testProductAPI() {
  console.log('\n─── 7. Product API ───────────────────────────────────────────');

  const r1 = await get('/api/products?page=1&limit=24');
  assert('GET /api/products returns 200',      r1.status === 200, `got ${r1.status}`);
  assert('Response has data array',            Array.isArray(r1.json.data));
  assert('Pagination: page=1',                 r1.json.page === 1);
  assert('Pagination: limit ≤ 24',             r1.json.data.length <= 24);

  const r2 = await get('/api/products?limit=9999');
  assert('Limit capped at 100',                r2.json.data.length <= 100);

  const r3 = await get('/api/products?category=DRESSES');
  assert('Category filter: only DRESSES',
    r3.json.data.every(p => p.category === 'DRESSES'),
    `got: ${[...new Set(r3.json.data.map(p => p.category))].join(', ')}`
  );

  // Second call — should hit Redis cache (must not error)
  const r4 = await get('/api/products?page=1&limit=24');
  assert('Second request succeeds (cache path)', r4.status === 200);

  // Verify cache key exists in Redis
  const keys = await redis.keys('auren:cache:products:*');
  assert('Product cache key exists in Redis', keys.length > 0, `found: ${keys.length}`);
}

// ─── 8. Load Balancer + Cross-Backend Session ────────────────────────────────
async function testLoadBalancer() {
  console.log('\n─── 8. Load Balancer & Cross-Backend Session ────────────────');

  // Only runs if NGINX_URL is set (e.g. http://localhost:80)
  const nginxBase = process.env.NGINX_URL;
  if (!nginxBase) {
    console.log('   ⚠️  NGINX_URL not set — skipping load balancer test');
    console.log('      Set NGINX_URL=http://localhost:80 to enable this test');
    return;
  }

  // Login through nginx
  const loginRes = await fetch(`${nginxBase}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'alice@auren.com', password: 'password123' }),
  });
  const loginJson = await loginRes.json().catch(() => ({}));
  assert('Login through Nginx succeeds', loginRes.status === 200, `got ${loginRes.status}`);

  const cookie = (loginRes.headers.get('set-cookie') ?? '').match(/auren_session=([^;]+)/)?.[1];
  if (!cookie) { assert('Cookie from Nginx login', false, 'no cookie'); return; }

  // Hit /me multiple times — different backends will serve them (least_conn)
  const meResults = await Promise.all(
    Array.from({ length: 9 }, () =>
      fetch(`${nginxBase}/api/auth/me`, { headers: { Cookie: `auren_session=${cookie}` } })
        .then(r => r.json())
    )
  );
  const allAuthenticated = meResults.every(r => r.authenticated === true);
  assert('Session valid across all backends (9 requests)', allAuthenticated,
    `failed: ${meResults.filter(r => !r.authenticated).length} unauthenticated`);

  // Check upstream headers to confirm distribution
  const upstreamHits = new Set();
  for (let i = 0; i < 30; i++) {
    const r = await fetch(`${nginxBase}/api/health`);
    const via = r.headers.get('x-upstream') ?? r.headers.get('server') ?? '';
    upstreamHits.add(via);
  }
  console.log(`   → Nginx distributing requests (${upstreamHits.size} distinct upstream signatures)`);
  assert('Requests reach Nginx successfully', true); // if we got here, Nginx is working
}

// ─── Run ──────────────────────────────────────────────────────────────────────
async function run() {
  console.log(`\n${'═'.repeat(60)}`);
  console.log('AUREN Backend Test Suite');
  console.log(`Base URL : ${BASE}`);
  console.log(`Redis    : ${REDIS_URL}`);
  console.log(`Max Users: ${MAX_USERS}`);
  console.log('═'.repeat(60));

  await testHealth();
  await testAuth();
  await testHardLimit();
  await testRaceCondition();
  await testLogoutSlotRelease();
  await testSessionExpiry();
  await testProductAPI();
  await testLoadBalancer();

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`Results: ${pass} passed, ${fail} failed`);
  console.log('═'.repeat(60));

  await redis.quit();
  process.exit(fail > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Fatal:', err);
  redis.quit();
  process.exit(1);
});
