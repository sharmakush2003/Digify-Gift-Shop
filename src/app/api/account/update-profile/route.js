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

export async function POST(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '')?.trim();
    
    let verifiedUserId = null;
    if (token) {
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
      if (!authError && user) {
        verifiedUserId = user.id;
      }
    }

    const body = await request.json();
    const { userId, name, phone, email } = body;

    // Security: ensure the user can only update their own profile
    if (!verifiedUserId || verifiedUserId !== userId) {
       return NextResponse.json({ success: false, message: 'Unauthorized. Invalid session.' }, { status: 401 });
    }

    if (!userId || !name) {
      return NextResponse.json({ success: false, message: 'User ID and Name are required.' }, { status: 400 });
    }

    const cleanPhone = phone ? (phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '').slice(-10)}`) : '';
    const cleanName = name.trim();
    const cleanEmail = (email || '').trim().toLowerCase();

    // 1. Update public.customers by ID using ADMIN client to bypass RLS
    let { data: custData, error: custErr } = await supabaseAdmin
      .from('customers')
      .update({
        full_name: cleanName,
        phone_number: cleanPhone
      })
      .eq('id', userId)
      .select();

    // If no row updated (e.g. customer wasn't created yet), upsert it
    if (!custErr && (!custData || custData.length === 0)) {
      const res = await supabaseAdmin.from('customers').upsert({
        id: userId,
        full_name: cleanName,
        phone_number: cleanPhone,
        email: cleanEmail,
        loyalty_points: 0
      }).select();
      custData = res.data;
      custErr = res.error;
    }

    // Also update by email if needed
    if (cleanEmail) {
      await supabaseAdmin
        .from('customers')
        .update({
          full_name: cleanName,
          phone_number: cleanPhone
        })
        .eq('email', cleanEmail);
    }

    if (custErr) {
      console.error('Error updating customer record in Supabase:', custErr);
      return NextResponse.json({ success: false, message: custErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated in Supabase successfully',
      customer: custData?.[0] || null
    });

  } catch (err) {
    console.error('Server error updating profile:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
