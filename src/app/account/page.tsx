"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function AccountPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    fetch("/api/auth/me")
      .then(async (res) => {
        if (res.ok) {
           setIsLoggedIn(true);
           const data = await res.json();
           if (data.user) setEmail(data.user.email);
           
           // Fetch orders
           setOrdersLoading(true);
           fetch("/api/account/orders")
             .then(r => r.json())
             .then(d => {
                if (d.success) setOrders(d.orders);
             })
             .finally(() => setOrdersLoading(false));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    
    try {
      const payload: any = { email, password };
      if (mode === "register") payload.name = "AUREN Customer"; // default name for now

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || data.error || "An error occurred");
      }
      
      if (mode === "login") {
        setIsLoggedIn(true);
        // Fetch orders
        setOrdersLoading(true);
        fetch("/api/account/orders")
          .then(r => r.json())
          .then(d => {
            if (d.success) setOrders(d.orders);
          })
          .finally(() => setOrdersLoading(false));
      } else {
        // After successful registration, log them in automatically
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (loginRes.ok) {
           setIsLoggedIn(true);
           // Fetch orders
           setOrdersLoading(true);
           fetch("/api/account/orders")
             .then(r => r.json())
             .then(d => {
                if (d.success) setOrders(d.orders);
             })
             .finally(() => setOrdersLoading(false));
        }
        else throw new Error("Registration succeeded but login failed.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsLoggedIn(false);
    setOrders([]);
  };

  if (loading && !isLoggedIn) {
    return <div className="py-24 px-4 min-h-[70vh] flex items-center justify-center text-gray-500">Loading...</div>;
  }

  if (!isLoggedIn) {
    return (
      <div className="py-24 px-4 md:px-12 max-w-md mx-auto min-h-[70vh]">
        <h1 className="text-4xl font-bold tracking-tighter mb-8 uppercase text-center">
          {mode === "login" ? "Sign In" : "Create Account"}
        </h1>
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 text-red-200 text-sm text-center">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            required 
            className="w-full bg-transparent border-b border-zinc-700 py-3 text-white outline-none focus:border-white transition-colors" 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            required 
            className="w-full bg-transparent border-b border-zinc-700 py-3 text-white outline-none focus:border-white transition-colors" 
          />
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-white text-black font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors mt-8 disabled:opacity-50"
          >
            {loading ? "Processing..." : (mode === "login" ? "Sign In" : "Register")}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-8">
          {mode === "login" ? (
            <>Don't have an account? <span onClick={() => { setMode("register"); setError(""); }} className="text-white cursor-pointer hover:underline">Create one</span></>
          ) : (
            <>Already have an account? <span onClick={() => { setMode("login"); setError(""); }} className="text-white cursor-pointer hover:underline">Sign in</span></>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 md:px-12 max-w-7xl mx-auto min-h-[70vh]">
      <div className="flex justify-between items-end mb-12 border-b border-zinc-800 pb-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase">My Account</h1>
        <button onClick={handleLogout} className="text-sm uppercase tracking-widest text-gray-400 hover:text-white transition-colors">
          Sign Out
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="md:col-span-2 space-y-12">
          <section>
            <h2 className="text-2xl font-bold uppercase tracking-wider mb-6">Order History</h2>
            {ordersLoading ? (
               <div className="bg-zinc-900 p-8 text-center text-gray-400">Loading orders...</div>
            ) : orders.length === 0 ? (
               <div className="bg-zinc-900 p-8 text-center text-gray-400">
                 You haven't placed any orders yet.
               </div>
            ) : (
               <div className="space-y-4">
                 {orders.map(order => (
                   <div key={order.id} className="bg-zinc-900 border border-zinc-800 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                     <div>
                       <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Order ID</p>
                       <p className="font-mono text-white mb-2">{order.id}</p>
                       <p className="text-sm text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                     </div>
                     <div>
                       <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Total</p>
                       <p className="font-medium text-white mb-2">₹{order.total.toLocaleString()}</p>
                       <div className="flex gap-2">
                         <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 ${order.paymentStatus === 'PAID' ? 'bg-green-900 text-green-300' : order.paymentStatus === 'FAILED' ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'}`}>
                           {order.paymentStatus}
                         </span>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
            )}
          </section>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-wider mb-6">Account Details</h2>
          <div className="bg-zinc-900 p-8 space-y-4">
            <p className="text-white">AUREN Customer</p>
            <p className="text-gray-400">{email || "customer@example.com"}</p>
            <p className="text-gray-400 mt-4">India</p>
            <button className="mt-8 text-sm uppercase tracking-widest text-white underline underline-offset-4 hover:text-gray-300 transition-colors">
              Edit Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
