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

  const clientToUse = supabaseServiceKey ? supabaseAdmin : createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { data: userData, error: roleError } = await clientToUse
    .from('users').select('role').eq('id', user.id).single();
  if (roleError || !userData || userData.role !== 'admin') return null;

  return { user, client: clientToUse };
}

export async function POST(request) {
  try {
    const adminSession = await verifyAdminSession(request);
    if (!adminSession) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const targetClient = adminSession.client;
    const payload = await request.json();

    let { data, error } = await targetClient.from('coupons').insert([payload]).select();

    // If is_additive column doesn't exist in Supabase DB schema, fallback without it
    if (error && error.message.includes('is_additive')) {
      delete payload.is_additive;
      const res = await targetClient.from('coupons').insert([payload]).select();
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
