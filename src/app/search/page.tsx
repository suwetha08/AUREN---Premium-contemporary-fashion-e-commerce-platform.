"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useStore } from "../../context/StoreContext";

// Simple debounce utility
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useStore();

  const fetchResults = useCallback(async () => {
    if (!debouncedQuery.trim()) {
      setData(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&pageSize=50`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [debouncedQuery]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  return (
    <div className="py-12 px-4 md:px-12 max-w-7xl mx-auto min-h-[70vh]">
      <div className="mb-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-8 uppercase">Search</h1>
        <div className="relative max-w-2xl">
          <input 
            type="text" 
            placeholder="Search AUREN..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-b-2 border-zinc-700 py-4 text-2xl outline-none focus:border-white transition-colors"
            autoFocus
          />
          {query && (
            <button 
              onClick={() => setQuery("")}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors uppercase tracking-wider text-sm font-semibold"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      
      {loading ? (
        <div className="py-12 border-t border-zinc-800">
          <p className="text-xl text-gray-500 animate-pulse">Searching...</p>
        </div>
      ) : data ? (
        <div className="mb-12 border-t border-zinc-800 pt-12">
          <div className="flex justify-between items-end mb-8">
            <p className="text-gray-400 text-lg">{data.total} results for "{debouncedQuery}"</p>
            {/* Future facets toggle could go here */}
          </div>
          
          {data.total > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-16">
              {data.products.map((prod: any) => {
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
          ) : (
            <div className="py-12">
              <p className="text-xl text-gray-500 mb-4">No products match your search.</p>
              {data.suggestions && data.suggestions.length > 0 && (
                <div className="flex gap-2">
                  <span className="text-gray-400">Try instead:</span>
                  {data.suggestions.map((s: string) => (
                    <button key={s} onClick={() => setQuery(s)} className="text-white underline hover:text-gray-300">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="py-12 border-t border-zinc-800">
          <p className="text-xl text-gray-500 mb-8">Popular searches</p>
          <div className="flex flex-wrap gap-4">
            {["Dresses", "Black", "Linen", "Denim", "Party"].map(s => (
              <button 
                key={s} 
                onClick={() => setQuery(s)}
                className="px-6 py-3 border border-zinc-700 hover:border-white transition-colors uppercase tracking-wider text-sm"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
