import { NextRequest, NextResponse } from 'next/server';
import { razorpay } from '../../../../lib/razorpay';
import { createOrder, updateOrder } from '../../../../lib/orderStore';
import { products } from '../../../../lib/data';
import { getSession } from '../../../../lib/session';
import { COOKIE_NAME } from '../../../../lib/session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    if (!razorpay) {
      return NextResponse.json({ success: false, message: 'Razorpay is not configured' }, { status: 500 });
    }

    const body = await req.json();
    const { items, customer } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Cart is empty' }, { status: 400 });
    }

    // Validate prices and stock against database
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const dbProduct = products.find(p => p.id === item.id);
      if (!dbProduct) {
        return NextResponse.json({ success: false, message: `Product not found: ${item.name}` }, { status: 400 });
      }

      // Check sizes/stock
      if (!dbProduct.sizes.includes(item.selectedSize)) {
         return NextResponse.json({ success: false, message: `Invalid size for ${item.name}` }, { status: 400 });
      }

      const price = parseInt(dbProduct.price.replace(/[^\d]/g, ""), 10);
      subtotal += price * item.quantity;
      
      validatedItems.push({
        productId: dbProduct.id,
        name: dbProduct.name,
        size: item.selectedSize,
        quantity: item.quantity,
        price,
        image: dbProduct.images[0]
      });
    }

    const discount = 0; 
    const shipping = 0; // Free shipping
    const total = subtotal - discount + shipping;

    // Convert to paise
    const amountInPaise = total * 100;

    // Try to attach user if logged in
    const sessionId = req.cookies.get(COOKIE_NAME)?.value;
    let userId;
    if (sessionId) {
      const session = await getSession(sessionId);
      if (session) userId = session.userId;
    }

    // Create internal order first
    const internalOrder = createOrder({
      userId,
      items: validatedItems,
      subtotal,
      discount,
      shipping,
      total,
      currency: 'INR',
      customerName: customer.name || 'Test User',
      customerEmail: customer.email || 'test@auren.com',
      customerPhone: customer.phone || '9999999999',
      shippingAddress: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      postalCode: customer.postalCode || '',
      country: customer.country || 'India',
      paymentStatus: 'PENDING',
      orderStatus: 'PENDING'
    });

    // Create Razorpay Order
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: internalOrder.id,
    };

    const rzpOrder = await razorpay.orders.create(options);

    // Save Razorpay order ID
    updateOrder(internalOrder.id, { razorpayOrderId: rzpOrder.id });

    return NextResponse.json({
      success: true,
      orderId: internalOrder.id,
      razorpayOrderId: rzpOrder.id,
      amount: amountInPaise,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error('Create Order Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
