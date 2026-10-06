/**
 * POST /api/auth/register
 *
 * Creates a new user account and immediately logs them in
 * (creates a Redis session if under the active-user limit).
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '../../../../lib/rateLimit';
import { createSession, sessionCookieOptions, COOKIE_NAME } from '../../../../lib/session';
import { createUser, userExists } from '../../../../lib/userStore';
import { log } from '../../../../lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';

  let body: { email?: string; password?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, code: 'BAD_REQUEST', message: 'Invalid JSON.' }, { status: 400 });
  }

  const { email, password, name } = body;
  if (!email || !password || !name) {
    return NextResponse.json(
      { success: false, code: 'BAD_REQUEST', message: 'email, password, and name are required.' },
      { status: 400 }
    );
  }

  // Rate limit registrations by IP
  const registerLimit = parseInt(process.env.REGISTER_RATE_LIMIT ?? '5', 10);
  const rl = await checkRateLimit('register', ip, registerLimit, 60);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, code: 'RATE_LIMITED', message: 'Too many registration attempts.' },
      { status: 429, headers: { 'Retry-After': String(rl.resetInSeconds) } }
    );
  }

  if (userExists(email)) {
    log({ event: 'REGISTER_FAILED', ip, reason: 'email_exists' });
    return NextResponse.json(
      { success: false, code: 'EMAIL_EXISTS', message: 'An account with this email already exists.' },
      { status: 409 }
    );
  }

  const user = createUser(email, password, name);
  log({ event: 'REGISTER_SUCCESS', userId: user.id });

  // Attempt to create a session immediately
  let session;
  try {
    session = await createSession(user.id, user.email, user.name);
  } catch {
    // Redis down — account created but not logged in
    return NextResponse.json({
      success: true,
      message: 'Account created. Please log in.',
      user: { id: user.id, email: user.email, name: user.name },
    });
  }

  if (!session) {
    return NextResponse.json(
      {
        success: false,
        code: 'ACTIVE_USER_LIMIT_REACHED',
        message: 'Account created but the server is at capacity. Please log in later.',
      },
      { status: 429 }
    );
  }

  const res = NextResponse.json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name },
  });
  res.cookies.set(COOKIE_NAME, session.sessionId, sessionCookieOptions());
  return res;
}
