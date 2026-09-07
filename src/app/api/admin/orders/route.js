import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rppakudcmvwlkcxjhnfn.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_AUO4h2oUniw9oE4moZm3kw_HHjziI09';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Service-role client — server-only, never sent to browser
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

/**
 * Verifies the request has a valid Supabase session AND that the user has role='admin' in the users table.
 * Returns { user } on success, or throws an error response.
 */
async function verifyAdminSession(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;

  // Verify the token against Supabase Auth
  const supabaseAuthClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error } = await supabaseAuthClient.auth.getUser(token);
  if (error || !user) return null;

  // If service role key is available, use supabaseAdmin; otherwise use authenticated client with token
  const clientToUse = supabaseServiceKey ? supabaseAdmin : createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { data: userData, error: roleError } = await clientToUse
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (roleError || !userData || userData.role !== 'admin') return null;

  return { user, client: clientToUse };
}

// GET /api/admin/orders — fetch all orders with items and products
export async function GET(request) {
  try {
    const adminSession = await verifyAdminSession(request);
    if (!adminSession) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const targetClient = adminSession.client;

    // Attempt relational query first
    let { data: ordersData, error: relError } = await targetClient
      .from('orders')
      .select('*, order_items(*, products(*))')
      .order('created_at', { ascending: false });

    if (relError) {
      console.warn('Relational fetch failed, falling back to manual merge.', relError);
      // Fallback: fetch separately and merge
      const { data: simpleOrders, error: ordErr } = await targetClient.from('orders').select('*').order('created_at', { ascending: false });
      if (ordErr) throw ordErr;

      const { data: simpleItems } = await targetClient.from('order_items').select('*');
      const { data: productsData } = await targetClient.from('products').select('*');

      ordersData = (simpleOrders || []).map(order => {
        const itemsForOrder = (simpleItems || []).filter(item => item.order_id === order.id);
        const populatedItems = itemsForOrder.map(item => {
          const product = (productsData || []).find(p => String(p.id) === String(item.product_id));
          return { ...item, products: product || null };
        });
        return { ...order, order_items: populatedItems };
      });
    }

    return NextResponse.json({ success: true, orders: ordersData || [] });
  } catch (err) {
    console.error('Admin orders fetch error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
