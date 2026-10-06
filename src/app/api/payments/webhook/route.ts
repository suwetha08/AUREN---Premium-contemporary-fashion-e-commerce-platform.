import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getOrderByRazorpayOrderId, updateOrder } from '../../../../lib/orderStore';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    
    // Webhook secret from dashboard
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret || !signature) {
      return NextResponse.json({ success: false, message: 'Invalid config or signature missing' }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json({ success: false, message: 'Invalid webhook signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      let orderId;
      let paymentId;

      if (event.event === 'payment.captured') {
        orderId = event.payload.payment.entity.order_id;
        paymentId = event.payload.payment.entity.id;
      } else {
        orderId = event.payload.order.entity.id;
        paymentId = event.payload.order.entity.receipt;
      }

      if (orderId) {
        const order = getOrderByRazorpayOrderId(orderId);
        if (order && order.paymentStatus !== 'PAID') {
          updateOrder(order.id, {
              paymentStatus: 'PAID',
              orderStatus: 'CONFIRMED',
              razorpayPaymentId: paymentId
          });
        }
      }
    } else if (event.event === 'payment.failed') {
      const orderId = event.payload.payment.entity.order_id;
      if (orderId) {
        const order = getOrderByRazorpayOrderId(orderId);
        if (order && order.paymentStatus !== 'PAID') {
          updateOrder(order.id, {
              paymentStatus: 'FAILED',
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
