/**
 * GET /api/health
 *
 * Public health-check endpoint for load-balancer probes.
 * Contains NO credentials or secrets.
 */

import { NextResponse } from 'next/server';
import { getRedis } from '../../../lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  let redisStatus = 'disconnected';
  
  try {
    const client = getRedis();
    // Await a quick ping to confirm the connection is actually alive
    await client.ping();
    redisStatus = 'connected';
  } catch (err) {
    redisStatus = 'error';
  }

  const httpStatus = redisStatus === 'connected' ? 200 : 503;

  return NextResponse.json(
    { status: httpStatus === 200 ? 'ok' : 'degraded', redis: redisStatus },
    { status: httpStatus }
  );
}
