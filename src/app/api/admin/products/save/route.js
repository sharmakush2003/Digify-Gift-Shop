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
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (roleError || !userData || userData.role !== 'admin') return null;

  return { user, token };
}

export async function POST(request) {
  try {
    const adminSession = await verifyAdminSession(request);
    if (!adminSession) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Genuine administrator authorization required.' }, { status: 401 });
    }

    const payload = await request.json();
    if (!payload || !payload.name) {
      return NextResponse.json({ success: false, message: 'Product name is required.' }, { status: 400 });
    }

    // Safely structure video_enabled inside image_settings
    const videoEnabled = payload.video_enabled !== undefined 
      ? Boolean(payload.video_enabled) 
      : (payload.image_settings?.video_enabled !== undefined ? Boolean(payload.image_settings.video_enabled) : Boolean(payload.youtube_url || payload.instagram_url));

    const imageSettings = {
      ...(payload.image_settings || {}),
      video_enabled: videoEnabled
    };

    const cleanProduct = {
      ...payload,
      image_settings: imageSettings,
      youtube_url: videoEnabled ? (payload.youtube_url || '') : '',
      instagram_url: videoEnabled ? (payload.instagram_url || '') : '',
      search_tags: payload.search_tags || ''
    };

    // Remove client-only UI properties that don't exist in Supabase schema
    delete cleanProduct.stockStatus;
    delete cleanProduct.video_enabled;

    // Use admin client with service role key if available, or user authenticated client
    let targetClient = supabaseAdmin;
    if (!supabaseServiceKey && adminSession.token) {
      targetClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${adminSession.token}` } }
      });
    }

    const { data, error } = await targetClient
      .from('products')
      .upsert(cleanProduct)
      .select();

    if (error) {
      console.error('Database error saving product:', error);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, product: data?.[0] || cleanProduct });
  } catch (err) {
    console.error('Server error saving product:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
