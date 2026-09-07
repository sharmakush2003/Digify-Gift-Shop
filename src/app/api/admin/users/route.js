import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rppakudcmvwlkcxjhnfn.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_AUO4h2oUniw9oE4moZm3kw_HHjziI09';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

async function verifyAdminSession(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;

  const supabaseAuthClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error } = await supabaseAuthClient.auth.getUser(token);
  if (error || !user) return null;

  const { data: userData, error: roleError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (roleError || !userData || userData.role !== 'admin') return null;

  return { user, token };
}

export async function GET(request) {
  try {
    const adminSession = await verifyAdminSession(request);
    if (!adminSession) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Genuine administrator authorization required.' }, { status: 401 });
    }

    let targetClient = supabaseAdmin;
    if (!supabaseServiceKey && adminSession.token) {
      targetClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${adminSession.token}` } }
      });
    }

    const [customersRes, usersRes, ordersRes] = await Promise.all([
      targetClient.from('customers').select('*'),
      targetClient.from('users').select('*'),
      targetClient.from('orders').select('id, order_number, final_total, customer_id, guest_phone, guest_email, shipping_address, created_at')
    ]);

    return NextResponse.json({
      success: true,
      customers: customersRes.data || [],
      users: usersRes.data || [],
      orders: ordersRes.data || []
    });
  } catch (err) {
    console.error('Server error fetching admin users data:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
