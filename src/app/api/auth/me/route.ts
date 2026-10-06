/**
 * GET /api/auth/me
 *
 * Returns the current user from the session cookie.
 * Also acts as a heartbeat — refreshes the session TTL.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession, COOKIE_NAME } from '../../../../lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get(COOKIE_NAME)?.value;
  if (!sessionId) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: { id: session.userId, email: session.email, name: session.name },
  });
}
