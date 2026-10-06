import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getOrderByRazorpayOrderId, updateOrder } from '../../../../lib/orderStore';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json({ success: false, message: 'Razorpay secret is not configured' }, { status: 500 });
    }

    const order = getOrderByRazorpayOrderId(razorpay_order_id);
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    if (order.paymentStatus === 'PAID') {
       return NextResponse.json({ success: true, message: 'Order is already paid', orderId: order.id });
    }

    const bodyToSign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(bodyToSign.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      // Signature is valid
      updateOrder(order.id, {
        paymentStatus: 'PAID',
        orderStatus: 'CONFIRMED',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature
      });

      return NextResponse.json({ success: true, message: 'Payment verified successfully', orderId: order.id });
    } else {
      updateOrder(order.id, { paymentStatus: 'FAILED' });
      return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 400 });
    }
  } catch (error) {
    console.error('Verify Order Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
