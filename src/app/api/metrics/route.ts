/**
 * GET /api/metrics
 *
 * Internal metrics endpoint. Protect with X-Metrics-Key header.
 * In production, also restrict via Nginx to internal network.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isRedisReady } from '../../../lib/redis';
import { getActiveCount } from '../../../lib/session';

export const dynamic = 'force-dynamic';

const METRICS_SECRET = process.env.METRICS_SECRET ?? 'change-me-in-production';
const MAX_USERS = parseInt(process.env.MAX_CONCURRENT_USERS ?? '100', 10);

export async function GET(req: NextRequest) {
  const key = req.headers.get('x-metrics-key');
  if (key !== METRICS_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const redisReady  = isRedisReady();
  const activeUsers = redisReady ? await getActiveCount() : -1;

  return NextResponse.json({
    activeUsers,
    activeUserLimit: MAX_USERS,
    redisStatus: redisReady ? 'connected' : 'disconnected',
    cacheStatus: 'enabled',
    nodeEnv: process.env.NODE_ENV,
  });
}
