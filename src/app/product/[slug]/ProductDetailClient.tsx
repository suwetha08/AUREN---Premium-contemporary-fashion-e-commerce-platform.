"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useStore } from "../../../context/StoreContext";
import { Product } from "../../../lib/data";

export default function ProductDetailClient({ 
  product, 
  relatedProducts 
}: { 
  product: Product, 
  relatedProducts: Product[] 
}) {
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useStore();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [added, setAdded] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [sizeError, setSizeError] = useState(false);
  
  const isWished = isInWishlist(product.id);

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    addToCart(product, selectedSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlistToggle = () => {
    if (isWished) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <div className="py-8 px-4 md:px-12 max-w-7xl mx-auto">
      {/* Breadcrumbs & Back */}
      <div className="flex items-center justify-between mb-8 text-xs uppercase tracking-widest text-gray-500">
        <div className="flex items-center gap-2">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link href={`/shop?category=${product.category}`} className="hover:text-white transition-colors">{product.category}</Link>
          <span>/</span>
          <span className="text-white">{product.name}</span>
        </div>
        <Link href="/shop" className="hover:text-white transition-colors flex items-center gap-2">
          <span>&larr;</span> Back to Shop
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-12 lg:gap-16 mb-24">
        {/* LEFT: Image Gallery */}
        <div className="w-full md:w-1/2 flex flex-col-reverse md:flex-row gap-4 h-full">
          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex md:flex-col gap-4 overflow-x-auto md:w-20 flex-shrink-0 hide-scrollbar">
              {product.images.map((img, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setActiveImageIndex(idx)}
                  className={`aspect-[3/4] w-20 flex-shrink-0 bg-zinc-900 overflow-hidden border-2 transition-colors ${activeImageIndex === idx ? 'border-white' : 'border-transparent hover:border-gray-500'}`}
                >
                  <img src={img} alt={`${product.name} thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
          {/* Main Image */}
          <div className="aspect-[3/4] bg-zinc-900 w-full relative overflow-hidden flex-grow">
             <img src={product.images[activeImageIndex]} alt={product.name} className="object-cover w-full h-full" />
             {product.isNew && <div className="absolute top-4 left-4 bg-white text-black text-xs font-bold tracking-wider px-3 py-1.5 z-10 uppercase">New</div>}
             {product.discountPercentage > 0 && <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold tracking-wider px-3 py-1.5 z-10 uppercase">{product.discountPercentage}% OFF</div>}
          </div>
        </div>

        {/* RIGHT: Product Info */}
        <div className="w-full md:w-1/2 flex flex-col">
          <p className="text-sm text-gray-400 uppercase tracking-widest mb-2">{product.category} / {product.subcategory}</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4 leading-tight">{product.name}</h1>
          
          <div className="flex items-center gap-2 mb-6 text-sm">
            <div className="flex text-yellow-500 text-lg">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i}>
                  {product.rating >= i + 0.5 ? '★' : '☆'}
                </span>
              ))}
            </div>
            <span className="text-gray-400">{product.rating} ({product.reviewCount} reviews)</span>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <p className="text-2xl font-light text-white">{product.price}</p>
            {product.originalPrice && <p className="text-xl font-light text-gray-500 line-through">{product.originalPrice}</p>}
          </div>

          <div className="mb-8">
            <p className="font-semibold uppercase tracking-wider text-sm mb-4">Color: <span className="text-gray-400 ml-2">{product.colors[0]}</span></p>
            <div className="flex gap-2">
              {product.colors.map((c, i) => {
                const lower = c.toLowerCase();
                let hex = '#525252';
                if (lower.includes('sky blue') || lower.includes('blue')) hex = '#87CEEB';
                if (lower === 'blue') hex = '#3B82F6';
                if (lower.includes('yellow')) hex = '#FCD34D';
                if (lower.includes('black')) hex = '#171717';
                if (lower.includes('ivory') || lower.includes('cream')) hex = '#FFFFF0';
                if (lower.includes('beige')) hex = '#F5F5DC';
                if (lower.includes('sage green') || lower.includes('green')) hex = '#9DC183';
                if (lower.includes('white')) hex = '#FFFFFF';
                if (lower.includes('red')) hex = '#EF4444';
                return (
                  <div 
                    key={i} 
                    className="w-8 h-8 rounded-full border border-zinc-600 shadow-inner" 
                    style={{ backgroundColor: hex }} 
                    title={c} 
                  />
                );
              })}
            </div>
          </div>
          
          <div className="mb-10">
            <div className="flex justify-between items-end mb-4">
              <p className="font-semibold uppercase tracking-wider text-sm">Size</p>
              <button className="text-xs text-gray-400 underline underline-offset-4 hover:text-white transition-colors">Size Guide</button>
            </div>
            <div className="flex flex-wrap gap-3 mb-2">
              {product.sizes.map(size => (
                <button 
                  key={size}
                  onClick={() => { setSelectedSize(size); setSizeError(false); }}
                  className={`w-14 h-14 border transition-colors flex items-center justify-center font-medium ${
                    selectedSize === size 
                      ? 'border-white bg-white text-black' 
                      : 'border-zinc-700 hover:border-gray-400 text-gray-300'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            {sizeError && <p className="text-red-500 text-sm mt-2">Please select a size.</p>}
          </div>

          <div className="flex flex-col gap-4 mb-12">
            <button 
              onClick={handleAddToCart}
              className={`w-full font-bold uppercase tracking-wider py-4 transition-colors ${
                added ? 'bg-green-600 text-white' : 'bg-white text-black hover:bg-gray-200'
              }`}
            >
              {added ? 'Added to Bag' : 'Add to Bag'}
            </button>
            <button 
              onClick={handleWishlistToggle}
              className={`w-full border font-bold uppercase tracking-wider py-4 transition-colors flex items-center justify-center gap-2 ${
                isWished ? 'border-white text-white' : 'border-zinc-700 hover:border-gray-400 text-gray-300'
              }`}
            >
              <span>{isWished ? '♥' : '♡'}</span> {isWished ? 'Remove from Wishlist' : 'Add to Wishlist'}
            </button>
          </div>

          <div className="border-t border-zinc-800 pt-8 mt-auto text-gray-400 text-sm leading-relaxed space-y-6">
            <div>
              <p className="font-semibold text-white uppercase tracking-wider mb-2">Description</p>
              <p>{product.description}</p>
            </div>
            <div>
              <p className="font-semibold text-white uppercase tracking-wider mb-2">Details</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Material: {product.material}</li>
                <li>Fit: {product.fit}</li>
                <li>Occasion: {product.occasion.join(", ")}</li>
                <li>Product Code: {product.id}</li>
              </ul>
            </div>
            <div className="flex gap-8 border-t border-zinc-800 pt-6">
              <button className="uppercase tracking-wider hover:text-white transition-colors">Shipping</button>
              <button className="uppercase tracking-wider hover:text-white transition-colors">Returns</button>
            </div>
          </div>
        </div>
      </div>

      {/* YOU MAY ALSO LIKE */}
      {relatedProducts.length > 0 && (
        <div className="border-t border-zinc-800 pt-16 mt-16">
          <h2 className="text-2xl font-bold uppercase tracking-widest text-center mb-12">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map(prod => (
              <Link key={prod.id} href={`/product/${prod.slug}`} className="group block">
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
                <h3 className="font-medium text-sm leading-tight mb-1 group-hover:text-gray-300 transition-colors truncate">{prod.name}</h3>
                <p className="font-semibold text-white text-sm">{prod.price}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
