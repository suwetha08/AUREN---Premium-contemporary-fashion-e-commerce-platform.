import { products, Product } from '../data';
import { filterByCategory } from '../categories';

// Architectural abstraction designed for millions of products.
// In a production environment with millions of products, this would interface with 
// OpenSearch or Elasticsearch, using Kafka for real-time indexing.
export interface SearchParams {
  q?: string;
  category?: string;
  subcategory?: string;
  page?: number;
  pageSize?: number;
  sort?: 'relevance' | 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popularity';
  color?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface SearchResult {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facets: {
    categories: Record<string, number>;
    colors: Record<string, number>;
    sizes: Record<string, number>;
  };
  suggestions?: string[];
}

export interface ISearchProvider {
  search(params: SearchParams): Promise<SearchResult>;
}

// Local mock provider that falls back to in-memory filtering but uses the exact
// same interface that an OpenSearchProvider would use.
export class LocalSearchProvider implements ISearchProvider {
  async search(params: SearchParams): Promise<SearchResult> {
    const {
      q,
      category,
      subcategory,
      page = 1,
      pageSize = 24,
      sort = 'relevance',
      color,
      size,
      minPrice,
      maxPrice
    } = params;

    let results = [...products];

    // Filter by query
    if (q) {
      const query = q.toLowerCase();
      results = results.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.tags.some(t => t.toLowerCase().includes(query)) ||
        p.category.toLowerCase().includes(query)
      );
    }

    // Faceted filtering
    if (category) {
      results = filterByCategory(results, category);
    }
    if (subcategory) {
      results = results.filter(p => p.subcategory.toLowerCase() === subcategory.toLowerCase());
    }
    if (color) {
      results = results.filter(p => p.colors.some(c => c.toLowerCase() === color.toLowerCase()));
    }
    if (size) {
      results = results.filter(p => p.sizes.includes(size.toUpperCase()));
    }
    if (minPrice !== undefined) {
      results = results.filter(p => parseInt(p.price.replace(/[^\d]/g, "")) >= minPrice);
    }
    if (maxPrice !== undefined) {
      results = results.filter(p => parseInt(p.price.replace(/[^\d]/g, "")) <= maxPrice);
    }

    // Generate Facets before pagination but after filtering
    const facets = {
      categories: {} as Record<string, number>,
      colors: {} as Record<string, number>,
      sizes: {} as Record<string, number>
    };

    results.forEach(p => {
      facets.categories[p.category] = (facets.categories[p.category] || 0) + 1;
      p.colors.forEach(c => {
        facets.colors[c] = (facets.colors[c] || 0) + 1;
      });
      p.sizes.forEach(s => {
        facets.sizes[s] = (facets.sizes[s] || 0) + 1;
      });
    });

    // Sorting
    results.sort((a, b) => {
      const priceA = parseInt(a.price.replace(/[^\d]/g, ""));
      const priceB = parseInt(b.price.replace(/[^\d]/g, ""));
      const popA = a.rating * a.reviewCount;
      const popB = b.rating * b.reviewCount;

      switch (sort) {
        case 'price_asc': return priceA - priceB;
        case 'price_desc': return priceB - priceA;
        case 'rating': return b.rating - a.rating;
        case 'popularity': return popB - popA;
        case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'relevance':
        default:
          return 0; // If there was a real ranking algorithm, it would apply here.
      }
    });

    // Pagination
    const total = results.length;
    const totalPages = Math.ceil(total / pageSize);
    const paginatedProducts = results.slice((page - 1) * pageSize, page * pageSize);

    // Suggestions (Mock)
    let suggestions: string[] = [];
    if (q && total === 0) {
      suggestions = ["dresses", "denim", "black", "party"];
    }

    return {
      products: paginatedProducts,
      total,
      page,
      pageSize,
      totalPages,
      facets,
      suggestions
    };
  }
}

// In a real application, you would switch this based on NODE_ENV or configuration:
// export const searchService = process.env.USE_OPENSEARCH ? new OpenSearchProvider() : new LocalSearchProvider();
export const searchService = new LocalSearchProvider();
