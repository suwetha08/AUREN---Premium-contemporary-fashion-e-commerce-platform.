"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Product, products } from "../lib/data";

interface CartItem extends Product {
  quantity: number;
  selectedSize: string;
}

interface StoreContextType {
  cart: CartItem[];
  wishlist: Product[];
  addToCart: (product: Product, size: string) => void;
  removeFromCart: (id: string, size: string) => void;
  updateCartQuantity: (id: string, size: string, quantity: number) => void;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  clearCart: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [mounted, setMounted] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("auren_cart");
      const savedWishlist = localStorage.getItem("auren_wishlist");
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        const hydrated = parsed.map((item: any) => {
          const fresh = products.find(p => p.id === item.id);
          return fresh ? { ...fresh, quantity: item.quantity, selectedSize: item.selectedSize } : null;
        }).filter(Boolean);
        setCart(hydrated as CartItem[]);
      }
      if (savedWishlist) {
        const parsed = JSON.parse(savedWishlist);
        const hydrated = parsed.map((item: any) => products.find(p => p.id === item.id)).filter(Boolean);
        setWishlist(hydrated as Product[]);
      }
    } catch (error) {
      console.error("Error loading store state:", error);
    }
    setMounted(true);
  }, []);

  // Save to local storage when state changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("auren_cart", JSON.stringify(cart));
      localStorage.setItem("auren_wishlist", JSON.stringify(wishlist));
    }
  }, [cart, wishlist, mounted]);

  const addToCart = (product: Product, size: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedSize === size);
      if (existing) {
        return prev.map(item =>
          item.id === product.id && item.selectedSize === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, selectedSize: size }];
    });
  };

  const removeFromCart = (id: string, size: string) => {
    setCart(prev => prev.filter(item => !(item.id === id && item.selectedSize === size)));
  };

  const updateCartQuantity = (id: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id, size);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.id === id && item.selectedSize === size
          ? { ...item, quantity }
          : item
      )
    );
  };

  const addToWishlist = (product: Product) => {
    setWishlist(prev => {
      if (!prev.find(item => item.id === product.id)) {
        return [...prev, product];
      }
      return prev;
    });
  };

  const removeFromWishlist = (id: string) => {
    setWishlist(prev => prev.filter(item => item.id !== id));
  };

  const isInWishlist = (id: string) => {
    return wishlist.some(item => item.id === id);
  };

  const clearCart = () => setCart([]);

  return (
    <StoreContext.Provider
      value={{
        cart,
        wishlist,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearCart
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
