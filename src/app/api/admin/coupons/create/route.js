import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rppakudcmvwlkcxjhnfn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_AUO4h2oUniw9oE4moZm3kw_HHjziI09';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const payload = await request.json();
    
    let { data, error } = await supabase.from('coupons').insert([payload]).select();

    // If is_additive column doesn't exist in Supabase DB schema, fallback without it
    if (error && error.message.includes('is_additive')) {
      delete payload.is_additive;
      const res = await supabase.from('coupons').insert([payload]).select();
      error = res.error;
      data = res.data;
    }

    if (error) {
      console.error('Error creating coupon:', error);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Server error creating coupon:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
