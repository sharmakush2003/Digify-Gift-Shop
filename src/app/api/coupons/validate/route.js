import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rppakudcmvwlkcxjhnfn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_AUO4h2oUniw9oE4moZm3kw_HHjziI09';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const { code, cartValue, cartItems = [], email = "", activeCoupons = [] } = await request.json();

    if (!code) {
      return NextResponse.json({ success: false, message: 'Coupon code is required' }, { status: 400 });
    }

    // Fetch the coupon from the database
    const { data: dbCoupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .maybeSingle();

    // Fallback dictionary for standard coupons if not found in DB
    let coupon = dbCoupon;
    if (!coupon) {
      const demoCoupons = {
        'FLAT100': { id: 'flat100', code: 'FLAT100', discount_type: 'FIXED', discount_value: 100, min_cart_value: 0, is_active: true, is_additive: false },
        'HOLI10': { id: 'holi10', code: 'HOLI10', discount_type: 'PERCENTAGE', discount_value: 10, min_cart_value: 0, is_active: true, is_additive: false },
        'OFF20': { id: 'off20', code: 'OFF20', discount_type: 'PERCENTAGE', discount_value: 20, min_cart_value: 0, is_active: true, is_additive: true },
        'FESTIVE10': { id: 'festive10', code: 'FESTIVE10', discount_type: 'FIXED', discount_value: 100, min_cart_value: 0, is_active: true, is_additive: true }
      };
      coupon = demoCoupons[code.toUpperCase().trim()];
    }

    if (!coupon) {
      return NextResponse.json({ success: false, message: 'Invalid coupon code' }, { status: 404 });
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

    // Determine Stacking Category (Additive vs Exclusive)
    const isAdditive = coupon.is_additive === true || (coupon.discount_type && coupon.discount_type.includes('ADDITIVE'));
    const rawDiscountType = (coupon.discount_type || 'PERCENTAGE').replace('_ADDITIVE', '');

    // 1. Check if this exact coupon is already applied
    if (activeCoupons.some(c => c.code.toUpperCase() === coupon.code.toUpperCase())) {
      return NextResponse.json({ success: false, message: 'This coupon code is already applied.' }, { status: 400 });
    }

    // 2. Check Stacking Rules:
    // Non-additive (exclusive) coupons cannot combine with other non-additive coupons
    if (!isAdditive && !coupon.is_gift_voucher) {
      const hasExistingExclusive = activeCoupons.some(c => !c.isAdditive && !c.isGiftVoucher);
      if (hasExistingExclusive) {
        return NextResponse.json({ 
          success: false, 
          message: 'An exclusive single-use coupon is already applied. Non-additive coupons cannot be stacked.' 
        }, { status: 400 });
      }
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
    if (rawDiscountType === 'PERCENTAGE') {
      discountAmount = (eligibleSubtotal * coupon.discount_value) / 100;
      if (coupon.max_discount && discountAmount > coupon.max_discount) {
        discountAmount = coupon.max_discount;
      }
    } else if (rawDiscountType === 'FIXED') {
      discountAmount = coupon.discount_value;
    }

    // Don't let discount exceed eligible subtotal
    if (discountAmount > eligibleSubtotal) {
      discountAmount = eligibleSubtotal;
    }

    return NextResponse.json({
      success: true,
      message: `${isAdditive ? '➕ Additive Coupon' : 'Coupon'} applied successfully!`,
      discountAmount: Math.round(discountAmount * 100) / 100,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: rawDiscountType,
        value: coupon.discount_value,
        isAdditive: isAdditive,
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
