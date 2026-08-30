require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rppakudcmvwlkcxjhnfn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_AUO4h2oUniw9oE4moZm3kw_HHjziI09';
const supabase = createClient(supabaseUrl, supabaseKey);

async function alterDb() {
  const { error } = await supabase.rpc('execute_sql', {
    sql_string: `
      ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
    `
  });

  if (error) {
     console.error("RPC failed:", error.message);
  } else {
     console.log("Success disabled RLS");
  }
}

alterDb();
