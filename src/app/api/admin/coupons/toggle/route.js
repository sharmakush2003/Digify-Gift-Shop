import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rppakudcmvwlkcxjhnfn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_AUO4h2oUniw9oE4moZm3kw_HHjziI09';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const { id, is_active } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, message: 'Coupon ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('coupons')
      .update({ is_active: is_active })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error toggling coupon status:', error);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Server error toggling coupon status:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
