require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rppakudcmvwlkcxjhnfn.supabase.co';
const supabaseKey = 'sb_publishable_AUO4h2oUniw9oE4moZm3kw_HHjziI09';
const supabase = createClient(supabaseUrl, supabaseKey);

async function alterDb() {
  const { error } = await supabase.rpc('execute_sql', {
    sql_string: "ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_otp TEXT;"
  });
  
  // Create a function to alter orders table to add coupon_id
  const { error: rpcError2 } = await supabase.rpc('execute_sql', {
    sql_string: `
      ALTER TABLE public.orders 
      ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.coupons(id);
    `
  });

  if (error || rpcError2) {
     console.error("RPC failed:", error?.message || rpcError2?.message);
  } else {
     console.log("Success");
  }
}

alterDb();
