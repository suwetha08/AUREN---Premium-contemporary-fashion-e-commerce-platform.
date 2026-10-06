/**
 * POST /api/auth/login
 *
 * Flow:
 *  1. Validate request body.
 *  2. Per-IP rate limiting (Redis).
 *  3. Verify credentials against user store.
 *  4. Atomically reserve an active-session slot (Lua script).
 *  5. Set HttpOnly session cookie.
 *  6. Return session info.
 *
 * Error codes:
 *  400 BAD_REQUEST          - missing / malformed fields
 *  401 INVALID_CREDENTIALS  - wrong email / password
 *  429 RATE_LIMITED         - too many attempts from this IP
 *  429 ACTIVE_USER_LIMIT_REACHED - server is at capacity
 *  503 AUTH_SERVICE_UNAVAILABLE  - Redis is down
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '../../../../lib/rateLimit';
import { createSession, sessionCookieOptions, COOKIE_NAME } from '../../../../lib/session';
import { findUserByEmail, verifyPassword } from '../../../../lib/userStore';
import { log } from '../../../../lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';

  // ── 1. Parse body ─────────────────────────────────────────────────────────
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, code: 'BAD_REQUEST', message: 'Invalid JSON.' }, { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json(
      { success: false, code: 'BAD_REQUEST', message: 'email and password are required.' },
      { status: 400 }
    );
  }

  // ── 2. Rate limit (per IP) ─────────────────────────────────────────────────
  const rl = await checkRateLimit('login', ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, code: 'RATE_LIMITED', message: 'Too many login attempts. Please wait.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rl.resetInSeconds),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  // ── 3. Verify credentials ──────────────────────────────────────────────────
  const user = findUserByEmail(email);
  if (!user || !verifyPassword(user, password)) {
    log({ event: 'LOGIN_FAILED', ip, email });
    return NextResponse.json(
      { success: false, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
      { status: 401 }
    );
  }

  // ── 4. Atomically claim a session slot ────────────────────────────────────
  let session;
  try {
    session = await createSession(user.id, user.email, user.name);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'AUTH_SERVICE_UNAVAILABLE') {
      log({ event: 'AUTH_SERVICE_UNAVAILABLE', ip });
      return NextResponse.json(
        {
          success: false,
          code: 'AUTH_SERVICE_UNAVAILABLE',
          message: 'Authentication service is temporarily unavailable.',
        },
        { status: 503 }
      );
    }
    throw err;
  }

  if (!session) {
    return NextResponse.json(
      {
        success: false,
        code: 'ACTIVE_USER_LIMIT_REACHED',
        message: 'The maximum number of active users has been reached. Please try again later.',
      },
      { status: 429 }
    );
  }

  // ── 5. Set cookie ─────────────────────────────────────────────────────────
  const res = NextResponse.json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name },
  });
  res.cookies.set(COOKIE_NAME, session.sessionId, sessionCookieOptions());
  return res;
}
