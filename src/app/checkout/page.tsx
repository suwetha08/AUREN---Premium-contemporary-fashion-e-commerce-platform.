"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useStore } from "../../context/StoreContext";

export default function CheckoutPage() {
  const { cart, clearCart } = useStore();
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    phone: "",
    country: "India"
  });

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const subtotal = cart.reduce((total, item) => {
    const price = parseInt(item.price.replace(/[^\d]/g, ""), 10);
    return total + price * item.quantity;
  }, 0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      // 1. Create Internal & Razorpay Order on Backend
      const createRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(item => ({ id: item.id, selectedSize: item.selectedSize, quantity: item.quantity, name: item.name })),
          customer: {
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            postalCode: formData.postalCode,
            country: formData.country,
          }
        })
      });

      const orderData = await createRes.json();

      if (!orderData.success) {
        throw new Error(orderData.message || "Failed to create order");
      }

      // 2. Open Razorpay Checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "AUREN",
        description: "Premium Fashion Purchase",
        order_id: orderData.razorpayOrderId,
        handler: async function (response: any) {
          // 3. Verify Payment Signature on Backend
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              })
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
               setOrderInfo({
                 id: orderData.orderId,
                 amount: orderData.amount / 100,
                 address: `${formData.address}, ${formData.city}, ${formData.postalCode}`,
               });
               setIsSuccess(true);
               clearCart(); // Clear ONLY after verified success
            } else {
               setErrorMsg("Payment verification failed. Please contact support.");
            }
          } catch (err) {
             setErrorMsg("Payment verification failed due to network error.");
          }
        },
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          contact: formData.phone
        },
        theme: {
          color: "#000000"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      
      rzp.on('payment.failed', function (response: any){
         setErrorMsg(`Payment was not completed (${response.error.description}). Your cart is still saved.`);
      });

      rzp.open();

    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during checkout.");
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="py-24 px-4 md:px-12 max-w-2xl mx-auto min-h-[70vh] text-center">
        <p className="text-xs tracking-widest text-gray-400 mb-4 uppercase">Order Confirmed</p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-8 text-white uppercase">Thank you.</h1>
        
        <div className="bg-zinc-900 border border-zinc-800 p-8 text-left mb-12">
           <div className="mb-4">
             <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Order ID</p>
             <p className="font-mono text-white">{orderInfo?.id}</p>
           </div>
           <div className="mb-4">
             <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Payment</p>
             <p className="text-green-500 uppercase font-semibold text-sm">Successful</p>
           </div>
           <div className="mb-4">
             <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Amount</p>
             <p className="text-white">₹{orderInfo?.amount?.toLocaleString()}</p>
           </div>
           <div>
             <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Shipping To</p>
             <p className="text-gray-300 text-sm leading-relaxed">{orderInfo?.address}</p>
           </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/shop" className="px-8 py-4 bg-white text-black font-semibold uppercase tracking-wider hover:bg-gray-200 transition-colors">
            Continue Shopping
          </Link>
          <Link href="/account/orders" className="px-8 py-4 border border-zinc-700 text-white font-semibold uppercase tracking-wider hover:border-gray-400 transition-colors">
            View Order History
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="py-24 px-4 md:px-12 max-w-2xl mx-auto min-h-[70vh] text-center">
        <p className="text-xl text-gray-400 mb-8">Your cart is empty.</p>
        <Link href="/shop" className="px-8 py-4 bg-white text-black font-semibold uppercase tracking-wider hover:bg-gray-200 transition-colors">
          Go to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 md:px-12 max-w-7xl mx-auto min-h-[70vh]">
      <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-12 uppercase">Checkout</h1>
      
      {errorMsg && (
        <div className="mb-8 p-4 border border-red-800 bg-red-900/20 text-red-400 text-sm">
          {errorMsg}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-12">
        <div className="w-full lg:w-1/2">
          <form id="checkout-form" onSubmit={handleCheckout} className="space-y-8">
            <div>
              <h2 className="text-xl font-bold uppercase tracking-wider mb-6">Contact Information</h2>
              <div className="space-y-4">
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Email Address" required className="w-full bg-transparent border border-zinc-700 px-4 py-3 text-white outline-none focus:border-white transition-colors" />
                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Phone Number" required className="w-full bg-transparent border border-zinc-700 px-4 py-3 text-white outline-none focus:border-white transition-colors" />
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-bold uppercase tracking-wider mb-6">Shipping Address</h2>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="First Name" required className="w-full bg-transparent border border-zinc-700 px-4 py-3 text-white outline-none focus:border-white transition-colors" />
                <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Last Name" required className="w-full bg-transparent border border-zinc-700 px-4 py-3 text-white outline-none focus:border-white transition-colors" />
                <input type="text" name="address" value={formData.address} onChange={handleInputChange} placeholder="Address" required className="col-span-2 w-full bg-transparent border border-zinc-700 px-4 py-3 text-white outline-none focus:border-white transition-colors" />
                <input type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="City" required className="w-full bg-transparent border border-zinc-700 px-4 py-3 text-white outline-none focus:border-white transition-colors" />
                <input type="text" name="state" value={formData.state} onChange={handleInputChange} placeholder="State" required className="w-full bg-transparent border border-zinc-700 px-4 py-3 text-white outline-none focus:border-white transition-colors" />
                <input type="text" name="postalCode" value={formData.postalCode} onChange={handleInputChange} placeholder="Postal Code" required className="w-full bg-transparent border border-zinc-700 px-4 py-3 text-white outline-none focus:border-white transition-colors" />
                <input type="text" name="country" value={formData.country} onChange={handleInputChange} placeholder="Country" required className="w-full bg-transparent border border-zinc-700 px-4 py-3 text-white outline-none focus:border-white transition-colors" />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold uppercase tracking-wider mb-6">Payment</h2>
              <div className="p-6 border border-zinc-700 text-gray-300 bg-zinc-900/50 flex flex-col items-center justify-center space-y-4">
                <p className="text-sm uppercase tracking-widest text-gray-400">Pay Securely with Razorpay</p>
                <p className="text-xs text-gray-500 text-center">Test Mode Enabled. No real payment will be processed.</p>
              </div>
            </div>
            
            {/* Mobile submit button, desktop uses sidebar button if desired, but we keep it here for simplicity */}
            <button type="submit" disabled={loading} className="w-full py-4 bg-white text-black font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors disabled:opacity-50">
              {loading ? "Processing..." : "Proceed to Payment"}
            </button>
          </form>
        </div>

        <div className="w-full lg:w-1/2">
          <div className="bg-zinc-900 p-8 sticky top-24">
            <h2 className="text-xl font-bold uppercase tracking-wider mb-6">Order Summary</h2>
            <div className="space-y-6 mb-8">
              {cart.map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-20 h-24 bg-zinc-800 flex-shrink-0">
                    <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow flex flex-col justify-center">
                    <p className="text-white text-sm font-medium mb-1">{item.name}</p>
                    <p className="text-gray-400 text-xs mb-2">Size: {item.selectedSize} | Qty: {item.quantity}</p>
                    <p className="text-white text-sm">{item.price}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mb-4 text-gray-300 text-sm">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between mb-4 text-gray-300 text-sm">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between mb-6 text-gray-300 text-sm">
              <span>Discount</span>
              <span>₹0</span>
            </div>
            <div className="flex justify-between text-xl font-bold border-t border-zinc-700 pt-6">
              <span>Total</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            
            <button form="checkout-form" type="submit" disabled={loading} className="w-full mt-8 py-4 bg-white text-black font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors disabled:opacity-50 hidden lg:block">
              {loading ? "Processing..." : "Proceed to Payment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
