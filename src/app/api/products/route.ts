/**
 * GET /api/products
 *
 * Paginated, cached product listing.
 *
 * Query params:
 *   page     (default 1)
 *   limit    (default 24, max 100)
 *   category (e.g. DRESSES)
 *   sort     (latest | price_asc | price_desc | rating)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRedis, isRedisReady } from '../../../lib/redis';
import { log } from '../../../lib/logger';
import { products } from '../../../lib/data';
import { filterByCategory } from '../../../lib/categories';

export const dynamic = 'force-dynamic';

const PRODUCT_CACHE_TTL = parseInt(process.env.PRODUCT_CACHE_TTL ?? '60', 10);
const DEFAULT_LIMIT = 24;
const MAX_LIMIT     = 100;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page     = Math.max(1, parseInt(searchParams.get('page')  ?? '1',  10));
  const rawLimit = parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10);
  const limit    = Math.min(isNaN(rawLimit) ? DEFAULT_LIMIT : rawLimit, MAX_LIMIT);
  const category = searchParams.get('category') ?? '';
  const sort     = searchParams.get('sort') ?? 'latest';

  const cacheKey = `auren:cache:products:${[page, limit, category, sort].join(':')}`;

  // ── Cache check ───────────────────────────────────────────────────────────
  if (isRedisReady()) {
    try {
      const cached = await getRedis().get(cacheKey);
      if (cached) {
        log({ event: 'CACHE_HIT', key: cacheKey });
        return NextResponse.json(JSON.parse(cached));
      }
      log({ event: 'CACHE_MISS', key: cacheKey });
    } catch {
      // Non-fatal — fall through to live query
    }
  }

  // ── Query ─────────────────────────────────────────────────────────────────
  let result = category ? filterByCategory([...products], category) : [...products];

  result.sort((a, b) => {
    const priceA = parseInt(a.price.replace(/[^\d]/g, ''));
    const priceB = parseInt(b.price.replace(/[^\d]/g, ''));
    switch (sort) {
      case 'price_asc':  return priceA - priceB;
      case 'price_desc': return priceB - priceA;
      case 'rating':     return b.rating - a.rating;
      default:           return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const total      = result.length;
  const totalPages = Math.ceil(total / limit);
  const data       = result.slice((page - 1) * limit, page * limit);
  const payload    = { page, limit, total, totalPages, data };

  // ── Cache write ───────────────────────────────────────────────────────────
  if (isRedisReady()) {
    try {
      await getRedis().setex(cacheKey, PRODUCT_CACHE_TTL, JSON.stringify(payload));
    } catch { /* non-fatal */ }
  }

  return NextResponse.json(payload);
}
