import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rppakudcmvwlkcxjhnfn.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_AUO4h2oUniw9oE4moZm3kw_HHjziI09';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Authentication-only client
const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Privileged server-only client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export async function GET(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '')?.trim();
    
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Token required.' }, { status: 401 });
    }

    // Validate the token
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Invalid session.' }, { status: 401 });
    }

    const cleanPhone = user.phone || user.user_metadata?.phone || '';
    const formattedPhone = cleanPhone ? (cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone.replace(/\D/g, '').slice(-10)}`) : '';
    const userEmail = user.email || '';

    const filterConditions = [];
    if (user.id) filterConditions.push(`customer_id.eq.${user.id}`);
    if (userEmail) filterConditions.push(`guest_email.eq.${userEmail}`);
    if (formattedPhone) filterConditions.push(`guest_phone.eq.${formattedPhone}`);

    if (filterConditions.length === 0) {
      return NextResponse.json({ success: true, orders: [] });
    }

    // Use admin client to fetch orders and bypass RLS
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .or(filterConditions.join(','))
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders from DB:', error);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, orders: data || [] });

  } catch (err) {
    console.error('Server error fetching orders:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
