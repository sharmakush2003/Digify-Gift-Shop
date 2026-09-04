require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rppakudcmvwlkcxjhnfn.supabase.co';
const supabaseKey = 'sb_publishable_AUO4h2oUniw9oE4moZm3kw_HHjziI09';
const supabase = createClient(supabaseUrl, supabaseKey);

async function alterDb() {
  const { error } = await supabase.rpc('execute_sql', {
    sql_string: `
      ALTER TABLE public.products ADD COLUMN IF NOT EXISTS warranty TEXT DEFAULT '1 Year Brand Warranty';
      UPDATE public.products SET warranty = '1 Year Brand Warranty' WHERE warranty IS NULL OR warranty = '' OR warranty = 'No Warranty';
    `
  });

  if (error) {
     console.error("RPC failed:", error?.message);
  } else {
     console.log("Successfully added 'warranty' column to Supabase products table!");
  }
}

alterDb();
