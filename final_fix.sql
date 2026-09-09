-- Grant REFERENCES permission on the hidden auth.users table
-- This allows Postgres to validate Foreign Keys without exposing user data
GRANT REFERENCES ON TABLE auth.users TO authenticated, anon;

-- Also ensure public.users has REFERENCES just in case
GRANT REFERENCES ON TABLE public.users TO authenticated, anon;

-- Refresh cache again
NOTIFY pgrst, 'reload schema';
