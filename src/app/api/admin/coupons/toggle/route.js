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
    .from('users').select('role').eq('id', user.id).single();
  if (roleError || !userData || userData.role !== 'admin') return null;

  return user;
}

export async function POST(request) {
  try {
    const adminUser = await verifyAdminSession(request);
    if (!adminUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const { id, is_active } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, message: 'Coupon ID is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('coupons')
      .update({ is_active })
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
