"use client";

import React from "react";
import Link from "next/link";
import { useStore } from "../../context/StoreContext";

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useStore();

  return (
    <div className="py-12 px-4 md:px-12 max-w-7xl mx-auto min-h-[70vh]">
      <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-12 uppercase">Wishlist</h1>
      
      {wishlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-xl text-gray-400 mb-8">Your wishlist is currently empty.</p>
          <Link href="/shop" className="px-8 py-4 bg-white text-black font-semibold uppercase tracking-wider hover:bg-gray-200 transition-colors">
            Explore Collection
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
          {wishlist.map((prod) => (
            <div key={prod.id} className="group relative">
              <Link href={`/product/${prod.slug}`} className="block cursor-pointer">
                <div className="aspect-[3/4] bg-zinc-900 mb-4 relative overflow-hidden">
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
                <p className="font-semibold">{prod.price}</p>
              </Link>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  removeFromWishlist(prod.id);
                }}
                className="absolute top-4 right-4 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-colors"
                aria-label="Remove from wishlist"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
