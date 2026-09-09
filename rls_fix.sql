-- Grant basic permissions for the users table to authenticated and anon roles
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.users TO service_role;

-- Grant permissions for customers table just in case
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.customers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.customers TO service_role;

-- Ensure is_admin is properly set to bypass RLS internally
ALTER FUNCTION public.is_admin() SECURITY DEFINER;
