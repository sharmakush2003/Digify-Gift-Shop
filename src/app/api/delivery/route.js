import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rppakudcmvwlkcxjhnfn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_AUO4h2oUniw9oE4moZm3kw_HHjziI09';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, pin, updateData, orderId } = body;

    // Secure PIN verification for delivery staff
    if (pin !== '1994') {
      return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 });
    }

    if (action === 'fetch') {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*');
      
      if (error) throw error;
      
      return NextResponse.json({ success: true, orders });
    } 
    else if (action === 'update' && orderId && updateData) {
      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('order_number', orderId);
        
      if (error) throw error;
      
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });

  } catch (err) {
    console.error('Error in delivery API:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
