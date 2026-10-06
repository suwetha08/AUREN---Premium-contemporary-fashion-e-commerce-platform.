"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { products } from "../lib/data";

export default function Home() {
  return (
    <div id="main">
      {/* Brand Hero */}
      <section className="relative h-[90vh] w-full flex items-center justify-center bg-black overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/products/yellow-cropped-hoodie-jogger-set/main.jpg" 
            alt="AUREN Streetwear Fashion" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#101011] via-transparent to-[#101011]/30"></div>
        </div>
        <div className="z-10 text-center flex flex-col items-center p-4">
          <p className="text-xs uppercase tracking-[0.3em] mb-4 text-gray-300">AUREN / COLLECTION 001</p>
          <h1 className="text-6xl md:text-9xl font-bold tracking-tighter mb-8 text-white drop-shadow-lg">AUREN</h1>
          <p className="max-w-md text-lg mb-8 text-gray-200">Contemporary silhouettes. Refined essentials. Designed for everyday movement.</p>
          <div className="flex gap-6 items-center">
            <Link href="/shop" className="px-8 py-3 bg-white text-black font-semibold tracking-wide hover:bg-gray-200 transition-colors">
              SHOP NOW
            </Link>
            <Link href="/new-arrivals" className="text-sm uppercase tracking-widest underline underline-offset-4 hover:text-gray-300 transition-colors">
              NEW ARRIVALS ↗
            </Link>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-24 px-4 md:px-12 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-16">
          <div>
            <p className="text-xs tracking-widest text-gray-400 mb-2 uppercase">01 — New Arrivals</p>
            <h2 className="text-5xl font-bold tracking-tighter">New<br /><em className="font-serif italic text-gray-300 font-light">arrivals.</em></h2>
          </div>
          <Link href="/new-arrivals" className="uppercase text-xs tracking-widest underline underline-offset-4 hover:text-gray-300 transition-colors hidden md:block">
            View all new arrivals ↗
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
          {products.slice(0, 4).map(prod => (
            <Link href={`/product/${prod.slug}`} key={prod.id} className="group cursor-pointer block">
              <div className="aspect-[3/4] bg-zinc-900 mb-4 relative overflow-hidden">
                <div className="absolute top-4 left-4 bg-white text-black text-xs font-bold tracking-wider px-3 py-1.5 z-10 uppercase">New</div>
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
              <p className="text-gray-500 text-sm mb-2">{prod.category}</p>
              <p className="font-semibold">{prod.price}</p>
            </Link>
          ))}
        </div>
        
        <div className="mt-12 text-center md:hidden">
          <Link href="/new-arrivals" className="uppercase text-xs tracking-widest underline underline-offset-4 hover:text-gray-300 transition-colors">
            View all new arrivals ↗
          </Link>
        </div>
      </section>

      {/* Shop By Category */}
      <section className="py-24 px-4 md:px-12 border-t border-zinc-900 bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-16">
            <div>
              <p className="text-xs tracking-widest text-gray-400 mb-2 uppercase">02 — Shop by Category</p>
              <h2 className="text-5xl font-bold tracking-tighter">Start with<br /><em className="font-serif italic text-gray-300 font-light">the shape.</em></h2>
            </div>
            <Link href="/shop" className="uppercase text-xs tracking-widest underline underline-offset-4 hover:text-gray-300 transition-colors hidden md:block">
              All products ↗
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { id: 1, name: "Tops", count: "02 pieces", link: "/shop?category=tops", image: "/images/products/black-oversized-essential-tee/main.jpg" },
              { id: 2, name: "Bottoms", count: "02 pieces", link: "/shop?category=bottoms", image: "/images/products/relaxed-blue-denim-jeans/main.jpg" },
              { id: 3, name: "Outerwear", count: "02 pieces", link: "/shop?category=outerwear", image: "/images/products/beige-utility-jacket/main.jpg" },
            ].map(cat => (
              <Link href={cat.link} key={cat.id} className="block border border-zinc-800 p-8 hover:bg-zinc-900 transition-all cursor-pointer group flex flex-col items-center text-center">
                <h3 className="text-3xl font-bold tracking-tight mb-2 group-hover:text-white text-gray-200 transition-colors">{cat.name}</h3>
                <p className="text-gray-500 mb-8">{cat.count}</p>
                <div className="aspect-square w-full bg-zinc-900 relative overflow-hidden">
                  <img src={cat.image} alt={cat.name} className="absolute inset-0 object-cover w-full h-full opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out z-0" />
                  <div className="absolute inset-0 flex items-center justify-center text-zinc-100 group-hover:scale-110 transition-transform duration-500 z-10 mix-blend-overlay">
                    <span className="text-4xl font-serif italic opacity-50 drop-shadow-lg">{cat.name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24 px-4 md:px-12 bg-black border-t border-zinc-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12 items-center justify-between">
          <div>
            <p className="text-xs tracking-widest text-gray-400 mb-2 uppercase">03 — Keep in touch</p>
            <h2 className="text-5xl font-bold tracking-tighter">First to<br />know.</h2>
          </div>
          <form className="w-full max-w-md flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); alert("Subscribed to AUREN newsletter!"); }}>
            <div className="flex gap-2">
              <input type="email" placeholder="you@example.com" className="flex-1 bg-transparent border border-zinc-700 px-4 py-3 text-white outline-none focus:border-white transition-colors" required />
              <button type="submit" className="px-6 py-3 bg-white text-black font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors">Sign up</button>
            </div>
            <label className="flex gap-3 items-start text-xs text-gray-400 cursor-pointer group">
              <input type="checkbox" required className="mt-0.5 accent-white" />
              <span className="group-hover:text-gray-300 transition-colors leading-relaxed">I agree to receive emails from AUREN about new collections and offers. I can unsubscribe at any time.</span>
            </label>
          </form>
        </div>
      </section>
    </div>
  );
}
