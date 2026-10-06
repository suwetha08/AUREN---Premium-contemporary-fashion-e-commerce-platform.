"use client";

import React from "react";
import Link from "next/link";
import { products } from "../../lib/data";

export default function NewArrivalsPage() {
  return (
    <div className="py-12 px-4 md:px-12 max-w-7xl mx-auto min-h-[70vh]">
      <div className="mb-16 border-b border-zinc-800 pb-12">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 uppercase">New Arrivals</h1>
        <p className="text-gray-400 max-w-2xl text-lg">The latest additions to the AUREN collection. Premium materials, contemporary silhouettes.</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-16">
        {products.map(prod => (
          <Link href={`/product/${prod.slug}`} key={prod.id} className="group cursor-pointer block">
            <div className="aspect-[3/4] bg-zinc-900 mb-5 relative overflow-hidden">
              <div className="absolute top-4 left-4 bg-white text-black text-xs font-bold tracking-wider px-3 py-1.5 z-10 uppercase">New</div>
              <img src={prod.images[0]} alt={prod.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out" />
            </div>
            <h3 className="font-medium text-lg leading-tight mb-1 group-hover:text-gray-300 transition-colors">{prod.name}</h3>
            <p className="text-gray-500 text-sm mb-2 uppercase tracking-wide">{prod.category}</p>
            <p className="font-semibold">{prod.price}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
