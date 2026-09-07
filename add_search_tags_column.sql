-- ====================================================================
-- ORIENT CROCKERY - ADD SEARCH TAGS / KEYWORDS COLUMN TO PRODUCTS
-- Run this in your Supabase Dashboard -> SQL Editor -> New Query
-- ====================================================================

-- 1. Add the search_tags column (TEXT format, defaults to empty string)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS search_tags TEXT DEFAULT '';

-- 2. Add documentation comment
COMMENT ON COLUMN public.products.search_tags IS 'Comma-separated keywords/search tags to enhance catalog & admin searchability';
