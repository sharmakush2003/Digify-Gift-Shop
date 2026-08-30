import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rppakudcmvwlkcxjhnfn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_AUO4h2oUniw9oE4moZm3kw_HHjziI09';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const { code, cartValue, cartItems = [], email = "" } = await request.json();

    if (!code) {
      return NextResponse.json({ success: false, message: 'Coupon code is required' }, { status: 400 });
    }

    // Fetch the coupon from the database
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('is_active', true)
      .single();

    if (error || !coupon) {
      return NextResponse.json({ success: false, message: 'Invalid or inactive coupon code' }, { status: 404 });
    }

    // Check validity dates
    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return NextResponse.json({ success: false, message: 'Coupon is not yet active' }, { status: 400 });
    }
    if (coupon.valid_till && new Date(coupon.valid_till) < now) {
      return NextResponse.json({ success: false, message: 'Coupon has expired' }, { status: 400 });
    }

    // Check minimum cart value
    if (coupon.min_cart_value > 0 && cartValue < coupon.min_cart_value) {
      return NextResponse.json({ success: false, message: `Minimum cart value of ₹${coupon.min_cart_value} required` }, { status: 400 });
    }

    // Check SINGLE_USE per Customer Email limit
    if (coupon.usage_type === 'SINGLE_USE' && email) {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('guest_email', email)
        .eq('coupon_id', coupon.id);

      if (count && count > 0) {
        return NextResponse.json({ success: false, message: 'This single-use coupon has already been used on your email account' }, { status: 400 });
      }
    }

    // Category Specific Calculation
    let eligibleSubtotal = cartValue;
    if (coupon.coupon_category && coupon.coupon_category !== 'ALL' && cartItems && cartItems.length > 0) {
      const eligibleItems = cartItems.filter(item => 
        (item.department && item.department.toLowerCase() === coupon.coupon_category.toLowerCase()) ||
        (item.category && item.category.toLowerCase() === coupon.coupon_category.toLowerCase())
      );

      if (eligibleItems.length === 0) {
        return NextResponse.json({ 
          success: false, 
          message: `This coupon applies strictly to ${coupon.coupon_category} items. No matching items found in your cart.` 
        }, { status: 400 });
      }

      eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + (item.price * (item.quantity || item.qty || 1)), 0);
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_type === 'PERCENTAGE') {
      discountAmount = (eligibleSubtotal * coupon.discount_value) / 100;
      if (coupon.max_discount && discountAmount > coupon.max_discount) {
        discountAmount = coupon.max_discount;
      }
    } else if (coupon.discount_type === 'FIXED') {
      discountAmount = coupon.discount_value;
    }

    // Don't let discount exceed eligible subtotal
    if (discountAmount > eligibleSubtotal) {
      discountAmount = eligibleSubtotal;
    }

    return NextResponse.json({
      success: true,
      message: `${coupon.is_gift_voucher ? 'Gift Voucher' : 'Coupon'} applied successfully!`,
      discountAmount: Math.round(discountAmount * 100) / 100,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.discount_type,
        value: coupon.discount_value,
        isGiftVoucher: coupon.is_gift_voucher || false,
        category: coupon.coupon_category || 'ALL',
        usageType: coupon.usage_type || 'MULTI_USE'
      }
    });

  } catch (err) {
    console.error('Error validating coupon:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
