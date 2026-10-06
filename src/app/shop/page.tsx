"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useStore } from "../../context/StoreContext";
import { PRODUCT_CATEGORIES } from "../../lib/categories";

export default function Shop() {
  const [activeCategory, setActiveCategory] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useStore();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCategory && activeCategory !== "All") params.append("category", activeCategory);
    params.append("sort", sortOption);
    params.append("page", page.toString());
    params.append("pageSize", "24");

    try {
      const res = await fetch(`/api/search?${params.toString()}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [activeCategory, sortOption, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="py-12 px-4 md:px-12 max-w-7xl mx-auto min-h-[70vh]">
      <div className="mb-16 border-b border-zinc-800 pb-12">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 uppercase">Collection 001</h1>
        <p className="text-gray-400 max-w-2xl text-lg">Discover our latest arrivals. Redefining modern essentials through premium materials and architectural silhouettes.</p>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        {/* Categories */}
        <div className="flex flex-wrap md:flex-nowrap gap-4 overflow-x-auto pb-4 md:pb-0 hide-scrollbar w-full">
          {PRODUCT_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.value === "ALL" ? "" : cat.value); setPage(1); }}
              className={`px-4 py-2 text-sm uppercase tracking-wider whitespace-nowrap transition-colors flex-shrink-0 ${
                (activeCategory === cat.value || (cat.value === "ALL" && activeCategory === "")) ? 'bg-white text-black font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        
        {/* Sorting */}
        <select 
          value={sortOption} 
          onChange={(e) => { setSortOption(e.target.value); setPage(1); }}
          className="bg-zinc-900 border border-zinc-700 text-white px-4 py-2 text-sm uppercase tracking-wider outline-none focus:border-white transition-colors"
        >
          <option value="newest">Latest Arrivals</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="popularity">Most Popular</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>
      
      {loading ? (
        <div className="py-24 text-center">
          <p className="text-xl text-gray-500 animate-pulse">Loading products...</p>
        </div>
      ) : data?.products?.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-xl text-gray-500">No products found in this category.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-16">
            {data?.products.map((prod: any) => {
              const isWished = isInWishlist(prod.id);
              return (
                <div key={prod.id} className="group relative">
                  <Link href={`/product/${prod.slug}`} className="cursor-pointer block">
                    <div className="aspect-[3/4] bg-zinc-900 mb-5 relative overflow-hidden">
                      {prod.isNew && <div className="absolute top-4 left-4 bg-white text-black text-xs font-bold tracking-wider px-3 py-1.5 z-10 uppercase">New</div>}
                      {prod.discountPercentage > 0 && <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold tracking-wider px-3 py-1.5 z-10 uppercase">{prod.discountPercentage}% OFF</div>}
                      {prod.images.length > 1 ? (
                        <>
                          <img src={prod.images[0]} alt={prod.name} className="absolute inset-0 object-cover w-full h-full group-hover:opacity-0 transition-opacity duration-700 ease-in-out z-0" />
                          <img src={prod.images[1]} alt={`${prod.name} alternate view`} className="absolute inset-0 object-cover w-full h-full opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out z-0" />
                        </>
                      ) : (
                        <img src={prod.images[0]} alt={prod.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out" />
                      )}
                    </div>
                    <h3 className="font-medium text-lg leading-tight mb-1 group-hover:text-gray-300 transition-colors">{prod.name}</h3>
                    <p className="text-gray-500 text-sm mb-2 uppercase tracking-wide">{prod.category}</p>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-white">{prod.price}</p>
                      {prod.originalPrice && <p className="text-gray-500 line-through text-sm">{prod.originalPrice}</p>}
                    </div>
                  </Link>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      isWished ? removeFromWishlist(prod.id) : addToWishlist(prod);
                    }}
                    className={`absolute top-[400px] sm:top-[280px] md:top-[200px] lg:top-[280px] right-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors z-20 shadow-md ${
                      isWished ? 'bg-white text-black' : 'bg-black/50 text-white hover:bg-white hover:text-black'
                    }`}
                    style={{ transform: 'translateY(-120%)' }}
                    aria-label="Wishlist toggle"
                  >
                    {isWished ? '♥' : '♡'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {data?.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-24 border-t border-zinc-800 pt-12">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-6 py-3 border border-zinc-700 uppercase tracking-wider text-sm hover:border-white transition-colors disabled:opacity-30 disabled:hover:border-zinc-700"
              >
                Previous
              </button>
              <span className="text-gray-400">Page {page} of {data.totalPages}</span>
              <button 
                disabled={page === data.totalPages}
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                className="px-6 py-3 border border-zinc-700 uppercase tracking-wider text-sm hover:border-white transition-colors disabled:opacity-30 disabled:hover:border-zinc-700"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
