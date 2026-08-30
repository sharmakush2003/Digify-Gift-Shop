const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rppakudcmvwlkcxjhnfn.supabase.co';
const supabaseKey = 'sb_publishable_AUO4h2oUniw9oE4moZm3kw_HHjziI09';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const dbOrder = {
    order_number: "TEST-ORD-" + Date.now(),
    guest_email: "test@test.com",
    guest_phone: "1234567890",
    total_mrp: 100,
    discount_amount: 0,
    taxable_value: 100,
    tax_amount: 18,
    shipping_charge: 0,
    final_total: 118,
    payment_mode: 'UPI',
    payment_status: 'SUCCESS',
    payment_reference_id: "pay_test",
    order_status: 'NEW',
    shipping_address: { street: "1", area: "2", city: "3", state: "4" },
    billing_address: { street: "1", area: "2", city: "3", state: "4" }
  };
  
  const { data, error } = await supabase.from('orders').insert(dbOrder).select();
  console.log("Error:", error ? JSON.stringify(error, null, 2) : null);
  console.log("Data:", data);
}

testInsert();
