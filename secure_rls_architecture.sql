-- ====================================================================
-- ORIENT CROCKERY - PRODUCTION ENTERPRISE RLS & PERMISSION ARCHITECTURE
-- Run this in your Supabase Dashboard -> SQL Editor -> New Query
-- ====================================================================

-- 1. Enable Row-Level Security on all core tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- 2. HARDENED is_admin() FUNCTION
-- Schema-qualified, explicit search_path, immediate NULL check, security definer
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- --------------------------------------------------------------------
-- 3. ANTI-PRIVILEGE ESCALATION TRIGGERS
-- Prevents customers from promoting themselves to 'admin'
-- Prevents customers from tampering with loyalty_points
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Privilege escalation forbidden: Only administrators can modify roles.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_user_role ON public.users;
CREATE TRIGGER trg_protect_user_role
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.protect_user_role();

CREATE OR REPLACE FUNCTION public.protect_customer_loyalty()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    IF NEW.loyalty_points IS DISTINCT FROM OLD.loyalty_points AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Unauthorized: Loyalty points can only be updated by administrators.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_customer_loyalty ON public.customers;
CREATE TRIGGER trg_protect_customer_loyalty
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.protect_customer_loyalty();

-- --------------------------------------------------------------------
-- 4. CLEAN UP LEGACY POLICIES
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Public Read Products" ON public.products;
DROP POLICY IF EXISTS "Admin Full Access Products" ON public.products;
DROP POLICY IF EXISTS "Allow update products" ON public.products;
DROP POLICY IF EXISTS "Allow insert products" ON public.products;
DROP POLICY IF EXISTS "Allow anonymous insert/update on products" ON public.products;
DROP POLICY IF EXISTS "Allow anonymous select on products" ON public.products;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;
DROP POLICY IF EXISTS "Public can view products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

DROP POLICY IF EXISTS "Customer Select Own Orders" ON public.orders;
DROP POLICY IF EXISTS "Customer Insert Own Orders" ON public.orders;
DROP POLICY IF EXISTS "Customer Insert Orders" ON public.orders;
DROP POLICY IF EXISTS "Public and Customers Can Insert Orders" ON public.orders;
DROP POLICY IF EXISTS "Admin Full Access Orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users view own orders and Admins view all" ON public.orders;

DROP POLICY IF EXISTS "Customer Select Own Order Items" ON public.order_items;
DROP POLICY IF EXISTS "Customer Insert Order Items" ON public.order_items;
DROP POLICY IF EXISTS "Public and Customers Can Insert Order Items" ON public.order_items;
DROP POLICY IF EXISTS "Admin Full Access Order Items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
DROP POLICY IF EXISTS "View order items if can view order" ON public.order_items;

DROP POLICY IF EXISTS "Customer Select Own Profile" ON public.customers;
DROP POLICY IF EXISTS "Customer Update Own Profile" ON public.customers;
DROP POLICY IF EXISTS "Customer Insert Own Profile" ON public.customers;
DROP POLICY IF EXISTS "Customer Access Own Record" ON public.customers;
DROP POLICY IF EXISTS "Customer Select Own Record" ON public.customers;
DROP POLICY IF EXISTS "Customer Upsert Own Record" ON public.customers;
DROP POLICY IF EXISTS "Customer Update Own Record" ON public.customers;
DROP POLICY IF EXISTS "Allow Insert Customers" ON public.customers;
DROP POLICY IF EXISTS "Admin Full Access Customers" ON public.customers;

DROP POLICY IF EXISTS "User Select Own Record" ON public.users;
DROP POLICY IF EXISTS "User Update Own Record" ON public.users;
DROP POLICY IF EXISTS "User Insert Own Record" ON public.users;
DROP POLICY IF EXISTS "User Access Own Record" ON public.users;
DROP POLICY IF EXISTS "User Upsert Own Record" ON public.users;
DROP POLICY IF EXISTS "Admin Delete Users" ON public.users;
DROP POLICY IF EXISTS "Admin Full Access Users" ON public.users;
DROP POLICY IF EXISTS "Allow anonymous all on users" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users update own profile" ON public.users;
DROP POLICY IF EXISTS "Users view own profile" ON public.users;

DROP POLICY IF EXISTS "Public Read Coupons" ON public.coupons;
DROP POLICY IF EXISTS "Public Read Active Coupons" ON public.coupons;
DROP POLICY IF EXISTS "Public Read Active Coupons Only" ON public.coupons;
DROP POLICY IF EXISTS "Admin Full Access Coupons" ON public.coupons;
DROP POLICY IF EXISTS "Public can view coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can insert coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can update coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can delete coupons" ON public.coupons;

-- --------------------------------------------------------------------
-- 5. PRODUCTS POLICIES
-- Public & Visitors: READ ONLY (Catalogue display, search, filters)
-- Admins: FULL CRUD ACCESS
-- --------------------------------------------------------------------
CREATE POLICY "Public Read Products" 
ON public.products 
FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Admin Full Access Products" 
ON public.products 
FOR ALL 
TO authenticated 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- --------------------------------------------------------------------
-- 6. ORDERS POLICIES
-- Customers: View own orders (matched by user ID or customer email)
-- Public / Checkout: Insert orders during checkout
-- Admin: Full read/write/status update control
-- --------------------------------------------------------------------
CREATE POLICY "Customer Select Own Orders" 
ON public.orders 
FOR SELECT 
TO authenticated 
USING (
  customer_id = auth.uid() 
  OR guest_email = (auth.jwt() ->> 'email')
  OR public.is_admin()
);

CREATE POLICY "Public and Customers Can Insert Orders" 
ON public.orders 
FOR INSERT 
TO public 
WITH CHECK (
  customer_id = auth.uid() 
  OR customer_id IS NULL 
  OR public.is_admin()
);

CREATE POLICY "Admin Full Access Orders" 
ON public.orders 
FOR ALL 
TO authenticated 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- --------------------------------------------------------------------
-- 7. ORDER_ITEMS POLICIES
-- Customers: View items for own orders
-- Public / Checkout: Insert items associated with a valid order
-- Admin: Full access to all order items
-- --------------------------------------------------------------------
CREATE POLICY "Customer Select Own Order Items" 
ON public.order_items 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND (
      orders.customer_id = auth.uid() 
      OR orders.guest_email = (auth.jwt() ->> 'email') 
      OR public.is_admin()
    )
  )
);

CREATE POLICY "Public and Customers Can Insert Order Items" 
ON public.order_items 
FOR INSERT 
TO public 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id
  )
);

CREATE POLICY "Admin Full Access Order Items" 
ON public.order_items 
FOR ALL 
TO authenticated 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- --------------------------------------------------------------------
-- 8. CUSTOMERS POLICIES (GRANULAR - NO FOR ALL)
-- Customers: Can select own profile, update own contact details
-- Public / Checkout: Can insert new customer row (loyalty_points initialized to 0)
-- Admin: Full management (can delete, manage points, view all)
-- --------------------------------------------------------------------
CREATE POLICY "Customer Select Own Record" 
ON public.customers 
FOR SELECT 
TO authenticated 
USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Allow Insert Customers" 
ON public.customers 
FOR INSERT 
TO public 
WITH CHECK (
  loyalty_points = 0 OR loyalty_points IS NULL OR public.is_admin()
);

CREATE POLICY "Customer Update Own Record" 
ON public.customers 
FOR UPDATE 
TO authenticated 
USING (id = auth.uid() OR public.is_admin()) 
WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY "Admin Full Access Customers" 
ON public.customers 
FOR ALL 
TO authenticated 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- --------------------------------------------------------------------
-- 9. USERS POLICIES (GRANULAR - NO FOR ALL)
-- Customers: Can view own record, insert own initial customer row, update wishlist/profile
-- Customers CANNOT promote themselves to admin (guaranteed by WITH CHECK + trigger)
-- Customers CANNOT delete any user
-- Admin: Full access
-- --------------------------------------------------------------------
CREATE POLICY "User Select Own Record" 
ON public.users 
FOR SELECT 
TO authenticated 
USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "User Insert Own Record" 
ON public.users 
FOR INSERT 
TO authenticated 
WITH CHECK (
  (id = auth.uid() AND (role = 'customer' OR role IS NULL)) 
  OR public.is_admin()
);

CREATE POLICY "User Update Own Record" 
ON public.users 
FOR UPDATE 
TO authenticated 
USING (id = auth.uid() OR public.is_admin()) 
WITH CHECK (
  (id = auth.uid() AND (role = 'customer' OR public.is_admin())) 
  OR public.is_admin()
);

CREATE POLICY "Admin Delete Users" 
ON public.users 
FOR DELETE 
TO authenticated 
USING (public.is_admin());

CREATE POLICY "Admin Full Access Users" 
ON public.users 
FOR ALL 
TO authenticated 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- --------------------------------------------------------------------
-- 10. COUPONS POLICIES
-- Public: Read ACTIVE coupons only (internal/inactive coupons are hidden)
-- Public / Customers: Zero write/delete permissions
-- Admin: Full create, toggle, delete management
-- --------------------------------------------------------------------
CREATE POLICY "Public Read Active Coupons Only" 
ON public.coupons 
FOR SELECT 
TO public 
USING (is_active = true OR public.is_admin());

CREATE POLICY "Admin Full Access Coupons" 
ON public.coupons 
FOR ALL 
TO authenticated 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- --------------------------------------------------------------------
-- 11. AUTOMATIC AUTH USER -> CUSTOMERS & USERS PROVISIONING TRIGGER
-- Guarantees that newly registered users always exist in customers & users
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.users (id, role, full_name)
  VALUES (new.id, 'customer', COALESCE(new.raw_user_meta_data->>'full_name', 'Patron'))
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

  INSERT INTO public.customers (id, full_name, email, phone_number, loyalty_points)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'Patron'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    0
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

