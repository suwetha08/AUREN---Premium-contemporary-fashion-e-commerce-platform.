"use client";

import Link from "next/link";
import React from "react";

export function Footer() {
  return (
    <footer className="bg-black py-24 px-4 md:px-12 border-t border-zinc-800">
      <div className="flex flex-col md:flex-row justify-between gap-12 mb-24">
        <div>
          <Link href="/" className="text-3xl font-bold tracking-widest mb-4 block hover:text-gray-300 transition-colors">AUREN</Link>
          <p className="text-gray-400 text-sm tracking-wide">FORM. FUNCTION. ATTITUDE.</p>
        </div>
        <div className="flex gap-12 flex-wrap">
          <div>
            <h2 className="font-semibold mb-4 tracking-wider uppercase">Shop</h2>
            <ul className="flex flex-col gap-2 text-gray-400 text-sm">
              <li><Link href="/shop" className="hover:text-white transition-colors">All products</Link></li>
              <li><Link href="/new-arrivals" className="hover:text-white transition-colors">New Arrivals</Link></li>
              <li><Link href="/women" className="hover:text-white transition-colors">Women</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="font-semibold mb-4 tracking-wider uppercase">Auren</h2>
            <ul className="flex flex-col gap-2 text-gray-400 text-sm">
              <li><Link href="/shop" className="hover:text-white transition-colors">Our Collections</Link></li>
              <li><Link href="/search" className="hover:text-white transition-colors">Search</Link></li>
              <li><Link href="/account" className="hover:text-white transition-colors">My Account</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center text-xs text-gray-500 pt-8 border-t border-zinc-800">
        <span>&copy; {new Date().getFullYear()} AUREN</span>
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition-colors">Back to top ↑</button>
      </div>
    </footer>
  );
}
