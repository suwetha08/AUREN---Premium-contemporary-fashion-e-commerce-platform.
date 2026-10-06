/**
 * POST /api/auth/logout
 *
 * Deletes the session from Redis and removes the cookie.
 * This immediately frees the active-user slot so another
 * user can log in.
 */

import { NextRequest, NextResponse } from 'next/server';
import { deleteSession, COOKIE_NAME } from '../../../../lib/session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get(COOKIE_NAME)?.value;

  if (sessionId) {
    await deleteSession(sessionId);
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });
  return res;
}
