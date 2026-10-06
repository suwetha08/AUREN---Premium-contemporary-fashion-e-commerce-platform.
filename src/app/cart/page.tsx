"use client";

import React from "react";
import Link from "next/link";
import { useStore } from "../../context/StoreContext";

export default function CartPage() {
  const { cart, removeFromCart, updateCartQuantity } = useStore();

  const subtotal = cart.reduce((total, item) => {
    // Basic parse of "₹2,999" -> 2999
    const price = parseInt(item.price.replace(/[^\d]/g, ""), 10);
    return total + price * item.quantity;
  }, 0);

  return (
    <div className="py-12 px-4 md:px-12 max-w-7xl mx-auto min-h-[70vh]">
      <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-12 uppercase">Cart</h1>
      
      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-xl text-gray-400 mb-8">Your cart is currently empty.</p>
          <Link href="/shop" className="px-8 py-4 bg-white text-black font-semibold uppercase tracking-wider hover:bg-gray-200 transition-colors">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="w-full lg:w-2/3 flex flex-col gap-8">
            {cart.map((item, idx) => (
              <div key={`${item.id}-${item.selectedSize}-${idx}`} className="flex gap-6 border-b border-zinc-800 pb-8">
                <Link href={`/product/${item.slug}`} className="w-1/4 max-w-[120px]">
                  <div className="aspect-[3/4] bg-zinc-900 relative">
                    <img src={item.images[0]} alt={item.name} className="object-cover w-full h-full" />
                  </div>
                </Link>
                <div className="flex flex-col flex-1 justify-between py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link href={`/product/${item.slug}`} className="font-semibold text-lg hover:text-gray-300 transition-colors">{item.name}</Link>
                      <p className="text-sm text-gray-500 mt-1">Size: {item.selectedSize}</p>
                    </div>
                    <p className="font-medium">{item.price}</p>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="flex items-center border border-zinc-700">
                      <button 
                        onClick={() => updateCartQuantity(item.id, item.selectedSize, item.quantity - 1)}
                        className="px-3 py-1 hover:bg-zinc-800 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="px-4 py-1 text-sm">{item.quantity}</span>
                      <button 
                        onClick={() => updateCartQuantity(item.id, item.selectedSize, item.quantity + 1)}
                        className="px-3 py-1 hover:bg-zinc-800 transition-colors"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id, item.selectedSize)}
                      className="text-sm text-gray-500 hover:text-white underline underline-offset-4 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="w-full lg:w-1/3">
            <div className="bg-zinc-900 p-8 sticky top-24">
              <h2 className="text-xl font-bold uppercase tracking-wider mb-6">Order Summary</h2>
              <div className="flex justify-between mb-4 text-gray-300">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between mb-6 text-gray-300">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="flex justify-between mb-8 text-xl font-bold border-t border-zinc-700 pt-6">
                <span>Total</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <Link href="/checkout" className="block w-full py-4 bg-white text-black text-center font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors">
                Proceed to Checkout
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
