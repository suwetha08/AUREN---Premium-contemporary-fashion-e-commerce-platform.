import { NextResponse } from 'next/server';
import { searchService, SearchParams } from '../../../lib/search';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params: SearchParams = {
      q: searchParams.get('q') || undefined,
      category: searchParams.get('category') || undefined,
      subcategory: searchParams.get('subcategory') || undefined,
      page: searchParams.has('page') ? parseInt(searchParams.get('page')!) : 1,
      pageSize: searchParams.has('pageSize') ? parseInt(searchParams.get('pageSize')!) : 24,
      sort: (searchParams.get('sort') as SearchParams['sort']) || 'relevance',
      color: searchParams.get('color') || undefined,
      size: searchParams.get('size') || undefined,
      minPrice: searchParams.has('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.has('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
    };

    const result = await searchService.search(params);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
