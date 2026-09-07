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
    // Verify admin session
    const adminUser = await verifyAdminSession(request);
    if (!adminUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, nextStatus, docId, paymentStatus } = body;

    if (!orderId && !docId) {
      return NextResponse.json({ success: false, message: 'Order ID or Document ID is required' }, { status: 400 });
    }

    const courierStatus = nextStatus === 'Packed' ? 'In Warehouse' : (nextStatus === 'Shipped' ? 'In Transit' : (nextStatus === 'Delivered' ? 'Delivered' : 'In Warehouse'));
    const finalPaymentStatus = nextStatus === 'Delivered' ? 'SUCCESS' : (paymentStatus === 'Paid' || paymentStatus === 'SUCCESS' ? 'SUCCESS' : 'PENDING');

    let otpGenerated = null;
    let updatedShippingAddress = null;

    let targetQuery = supabaseAdmin.from('orders').select('id, shipping_address');
    if (docId) {
      targetQuery = targetQuery.eq('id', docId);
    } else {
      targetQuery = targetQuery.eq('order_number', orderId);
    }
    const { data: existingOrder } = await targetQuery.maybeSingle();

    if (existingOrder && existingOrder.shipping_address) {
      updatedShippingAddress = typeof existingOrder.shipping_address === 'object'
        ? { ...existingOrder.shipping_address }
        : { raw_text: existingOrder.shipping_address };
      if (nextStatus === 'Shipped' && !updatedShippingAddress.delivery_otp) {
        otpGenerated = Math.floor(100000 + Math.random() * 900000).toString();
        updatedShippingAddress.delivery_otp = otpGenerated;
      }
    }

    const updateData = {
      order_status: nextStatus === 'Pending' ? 'NEW' : (nextStatus === 'Packed' ? 'PACKED' : (nextStatus === 'Shipped' ? 'DISPATCHED' : 'DELIVERED')),
      payment_status: finalPaymentStatus
    };
    if (updatedShippingAddress) updateData.shipping_address = updatedShippingAddress;

    let updateQuery = supabaseAdmin.from('orders').update(updateData);
    if (docId) {
      updateQuery = updateQuery.eq('id', docId);
    } else {
      updateQuery = updateQuery.eq('order_number', orderId);
    }

    const { data, error } = await updateQuery.select();
    if (error) throw error;

    // Optional: Trigger Google Sheets Webhook Update (fire and forget)
    try {
      const webhookUrl = 'https://script.google.com/macros/s/AKfycbxIM1-jcgl3NUqhoYt7IQIHY9LI6z0IT7c3WI_ZSJwajYORUbgKLnTnw5GJLBbhj-OY8g/exec';
      fetch(webhookUrl, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', orderId, status: nextStatus, courierStatus, paymentStatus: finalPaymentStatus })
      }).catch(e => console.warn('Google sheets sync warning:', e));
    } catch (sheetErr) {
      console.warn('Google sheets background sync error:', sheetErr);
    }

    return NextResponse.json({ success: true, message: `Order ${orderId || docId} updated to ${nextStatus}`, data, otpGenerated });
  } catch (err) {
    console.error('Error updating order status:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
