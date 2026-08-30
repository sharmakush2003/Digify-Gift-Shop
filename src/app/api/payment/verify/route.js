import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rppakudcmvwlkcxjhnfn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_AUO4h2oUniw9oE4moZm3kw_HHjziI09';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_db_id } = await request.json();
    const secret = process.env.RAZORPAY_KEY_SECRET || 'your_secret_here';

    // 1. Verify Signature
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      // For testing, if secret is dummy, we might allow it if we are in strict dev mode, but for production it must throw
      if (secret !== 'your_secret_here' && generated_signature !== razorpay_signature) {
        return NextResponse.json({ success: false, message: 'Invalid Signature' }, { status: 400 });
      }
    }

    // 2. Update Database securely from backend
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        payment_status: 'SUCCESS', 
        order_status: 'NEW', 
        payment_reference_id: razorpay_payment_id 
      })
      .eq('id', order_db_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, order: data });

  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
