import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rppakudcmvwlkcxjhnfn.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_AUO4h2oUniw9oE4moZm3kw_HHjziI09";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

