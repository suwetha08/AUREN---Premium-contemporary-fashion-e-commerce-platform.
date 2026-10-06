"use client";

import Link from "next/link";
import React, { useState } from "react";
import { useStore } from "../context/StoreContext";

export function Header() {
  const { cart, wishlist } = useStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const wishlistCount = wishlist.length;

  return (
    <header className="fixed top-0 left-0 right-0 h-[80px] bg-[#101011]/90 backdrop-blur-md border-b border-zinc-800 z-50 flex items-center justify-between px-4 md:px-12 transition-all duration-300">
      <Link href="/" className="text-2xl font-bold tracking-widest hover:text-gray-300 transition-colors">AUREN</Link>
      
      {/* Desktop Nav */}
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
        <Link href="/" className="hover:text-gray-300 transition-colors">Home</Link>
        <Link href="/shop" className="hover:text-gray-300 transition-colors">Shop</Link>
        <Link href="/new-arrivals" className="hover:text-gray-300 transition-colors">New Arrivals</Link>
        <Link href="/women" className="hover:text-gray-300 transition-colors">Women</Link>
      </nav>

      <div className="hidden md:flex items-center gap-6 text-sm font-medium">
        <Link href="/search" className="hover:text-gray-300 transition-colors">Search</Link>
        <Link href="/wishlist" className="hover:text-gray-300 transition-colors">Wishlist ({wishlistCount})</Link>
        <Link href="/cart" className="hover:text-gray-300 transition-colors">Cart ({cartCount})</Link>
        <Link href="/account" className="hover:text-gray-300 transition-colors">Account</Link>
      </div>

      {/* Mobile Toggle */}
      <button 
        className="md:hidden flex flex-col gap-1.5 p-2"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle menu"
      >
        <span className={`w-6 h-0.5 bg-white transition-transform ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
        <span className={`w-6 h-0.5 bg-white transition-opacity ${isMenuOpen ? 'opacity-0' : ''}`} />
        <span className={`w-6 h-0.5 bg-white transition-transform ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
      </button>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-[80px] left-0 w-full bg-[#101011] border-b border-zinc-800 flex flex-col p-4 md:hidden">
          <Link href="/" onClick={() => setIsMenuOpen(false)} className="py-3 border-b border-zinc-800 hover:text-gray-300">Home</Link>
          <Link href="/shop" onClick={() => setIsMenuOpen(false)} className="py-3 border-b border-zinc-800 hover:text-gray-300">Shop</Link>
          <Link href="/new-arrivals" onClick={() => setIsMenuOpen(false)} className="py-3 border-b border-zinc-800 hover:text-gray-300">New Arrivals</Link>
          <Link href="/women" onClick={() => setIsMenuOpen(false)} className="py-3 border-b border-zinc-800 hover:text-gray-300">Women</Link>
          <div className="py-3 flex justify-between border-b border-zinc-800">
             <Link href="/search" onClick={() => setIsMenuOpen(false)} className="hover:text-gray-300">Search</Link>
             <Link href="/account" onClick={() => setIsMenuOpen(false)} className="hover:text-gray-300">Account</Link>
          </div>
          <div className="py-3 flex justify-between">
            <Link href="/wishlist" onClick={() => setIsMenuOpen(false)} className="hover:text-gray-300">Wishlist ({wishlistCount})</Link>
            <Link href="/cart" onClick={() => setIsMenuOpen(false)} className="hover:text-gray-300">Cart ({cartCount})</Link>
          </div>
        </div>
      )}
    </header>
  );
}
