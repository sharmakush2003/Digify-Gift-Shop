-- ====================================================================
-- ORIENT CROCKERY - EMERGENCY ROLLBACK SCRIPT
-- RUN THIS ONLY IF YOU NEED TO REVERT TO THE OLD INSECURE RULES
-- ====================================================================

-- 1. Drop the new strict policies
DROP POLICY IF EXISTS "Public Read Products" ON public.products;
DROP POLICY IF EXISTS "Admin Full Access Products" ON public.products;
DROP POLICY IF EXISTS "Admin Full Access Coupons" ON public.coupons;
DROP POLICY IF EXISTS "Customer Select Own Profile" ON public.customers;
DROP POLICY IF EXISTS "Customer Update Own Profile" ON public.customers;
DROP POLICY IF EXISTS "Customer Insert Own Profile" ON public.customers;
DROP POLICY IF EXISTS "User Select Own Record" ON public.users;
DROP POLICY IF EXISTS "User Insert Own Record" ON public.users;
DROP POLICY IF EXISTS "User Update Own Record" ON public.users;
DROP POLICY IF EXISTS "Customer Select Own Orders" ON public.orders;
DROP POLICY IF EXISTS "Customer Insert Own Orders" ON public.orders;
DROP POLICY IF EXISTS "Admin Update Orders" ON public.orders;
DROP POLICY IF EXISTS "Customer Select Own Order Items" ON public.order_items;
DROP FUNCTION IF EXISTS public.check_user_exists(text, text);

-- 2. Restore your old policies (from your screenshots)
-- Coupons
CREATE POLICY "Admins can delete coupons" ON public.coupons FOR DELETE TO public USING (true);
CREATE POLICY "Admins can insert coupons" ON public.coupons FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins can update coupons" ON public.coupons FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public can view coupons" ON public.coupons FOR SELECT TO public USING (true);

-- Order Items
CREATE POLICY "Anyone can create order items" ON public.order_items FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "View order items if can view order" ON public.order_items FOR SELECT TO public USING (true);

-- Orders
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Users view own orders and Admins view all" ON public.orders FOR SELECT TO public USING (true);

-- Products
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE TO public USING (true);
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous insert/update on products" ON public.products FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous select on products" ON public.products FOR SELECT TO public USING (true);
CREATE POLICY "Enable read access for all users" ON public.products FOR SELECT TO public USING (true);
CREATE POLICY "Public can view products" ON public.products FOR SELECT TO public USING (true);

-- Users
CREATE POLICY "Allow anonymous all on users" ON public.users FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Users update own profile" ON public.users FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Users view own profile" ON public.users FOR SELECT TO public USING (true);
