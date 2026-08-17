-- ============================================================
-- NovelNest — Revoke email column access from anon/authenticated on profiles
-- ============================================================
-- The profiles table has a public SELECT RLS policy (USING true) that allows
-- all rows to be read. However, the 'email' column should never be exposed
-- publicly. Supabase uses column-level privileges to restrict this.
--
-- REVOKE removes the column privilege, meaning even though the row-level policy
-- allows SELECT, the email column will not be returned (it will be null or
-- cause an error if explicitly selected).

-- Revoke SELECT on the email column from anonymous users
REVOKE SELECT (email) ON public.profiles FROM anon;

-- Revoke SELECT on the email column from authenticated users
-- (authenticated users should only see their own email through auth.users, not profiles)
REVOKE SELECT (email) ON public.profiles FROM authenticated;
