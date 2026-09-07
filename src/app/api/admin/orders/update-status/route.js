import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rppakudcmvwlkcxjhnfn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_AUO4h2oUniw9oE4moZm3kw_HHjziI09';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId, nextStatus, docId, paymentStatus } = body;

    if (!orderId && !docId) {
      return NextResponse.json({ success: false, message: "Order ID or Document ID is required" }, { status: 400 });
    }

    const courierStatus = nextStatus === "Packed" ? "In Warehouse" : (nextStatus === "Shipped" ? "In Transit" : (nextStatus === "Delivered" ? "Delivered" : "In Warehouse"));
    const finalPaymentStatus = nextStatus === "Delivered" ? "SUCCESS" : (paymentStatus === "Paid" || paymentStatus === "SUCCESS" ? "SUCCESS" : "PENDING");

    // Fetch existing shipping address to handle delivery OTP if marking as Shipped
    let otpGenerated = null;
    let updatedShippingAddress = null;

    let targetQuery = supabase.from('orders').select('id, shipping_address');
    if (docId) {
      targetQuery = targetQuery.eq('id', docId);
    } else {
      targetQuery = targetQuery.eq('order_number', orderId);
    }

    const { data: existingOrder } = await targetQuery.maybeSingle();

    if (existingOrder && existingOrder.shipping_address) {
      updatedShippingAddress = typeof existingOrder.shipping_address === 'object' ? { ...existingOrder.shipping_address } : { raw_text: existingOrder.shipping_address };
      if (nextStatus === "Shipped" && !updatedShippingAddress.delivery_otp) {
        otpGenerated = Math.floor(100000 + Math.random() * 900000).toString();
        updatedShippingAddress.delivery_otp = otpGenerated;
      }
    }

    const updateData = {
      order_status: nextStatus === 'Pending' ? 'NEW' : (nextStatus === 'Packed' ? 'PACKED' : (nextStatus === 'Shipped' ? 'DISPATCHED' : 'DELIVERED')),
      payment_status: finalPaymentStatus
    };

    if (updatedShippingAddress) {
      updateData.shipping_address = updatedShippingAddress;
    }

    let updateQuery = supabase.from('orders').update(updateData);
    if (docId) {
      updateQuery = updateQuery.eq('id', docId);
    } else {
      updateQuery = updateQuery.eq('order_number', orderId);
    }

    const { data, error } = await updateQuery.select();

    if (error) {
      console.error("Supabase order status update error:", error);
      throw error;
    }

    // Optional: Trigger Google Sheets Webhook Update
    try {
      const webhookUrl = "https://script.google.com/macros/s/AKfycbxIM1-jcgl3NUqhoYt7IQIHY9LI6z0IT7c3WI_ZSJwajYORUbgKLnTnw5GJLBbhj-OY8g/exec";
      fetch(webhookUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          orderId: orderId,
          status: nextStatus,
          courierStatus: courierStatus,
          paymentStatus: finalPaymentStatus
        })
      }).catch(e => console.warn("Google sheets sync warning:", e));
    } catch (sheetErr) {
      console.warn("Google sheets background sync error:", sheetErr);
    }

    return NextResponse.json({
      success: true,
      message: `Order ${orderId || docId} successfully updated to ${nextStatus}`,
      data,
      otpGenerated
    });

  } catch (err) {
    console.error("Error updating order status:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
