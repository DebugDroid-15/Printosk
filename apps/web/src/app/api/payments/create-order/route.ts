import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amountPaise, currency = 'INR', receipt } = body;

    if (!amountPaise || amountPaise <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_TvyYDR4pvtLP33';
    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'reNU7PioTuSaEny9GOJfUoD9';

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    // Create a real order in Razorpay
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
    });

    console.log('[Razorpay] Real Order Created successfully:', order.id);

    return NextResponse.json({
      success: true,
      order,
      keyId: key_id,
    });
  } catch (error: any) {
    console.error('[Razorpay Order Creation Error]:', error);
    return NextResponse.json({ error: error.message || 'Payment order creation failed' }, { status: 500 });
  }
}
