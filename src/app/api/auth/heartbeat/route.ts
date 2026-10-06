/**
 * GET /api/auth/heartbeat
 *
 * Lightweight endpoint for the client to refresh a session TTL.
 * Does NOT increment the active-user count.
 * Identical to /api/auth/me but semantically clearer for polling use-cases.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession, COOKIE_NAME } from '../../../../lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get(COOKIE_NAME)?.value;
  if (!sessionId) {
    return NextResponse.json({ alive: false }, { status: 401 });
  }

  const session = await getSession(sessionId); // also refreshes TTL
  if (!session) {
    return NextResponse.json({ alive: false }, { status: 401 });
  }

  return NextResponse.json({ alive: true });
}
