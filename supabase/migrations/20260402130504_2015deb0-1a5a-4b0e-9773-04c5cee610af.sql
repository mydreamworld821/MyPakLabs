
-- Drop the restrictive policy that blocks anonymous profile reads
DROP POLICY IF EXISTS "Require authentication for profiles access" ON public.profiles;

-- Add a public SELECT policy so anyone (including anonymous) can view basic profile info
CREATE POLICY "Anyone can view profiles"
ON public.profiles
FOR SELECT
USING (true);

-- Add a restrictive policy only for write operations (INSERT, UPDATE, DELETE)
CREATE POLICY "Require auth for profile writes"
ON public.profiles
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow the existing SELECT policies to still work by making the restrictive only apply to non-SELECT
-- Actually, RESTRICTIVE on ALL will also restrict SELECT. Let's use a different approach:
-- Drop the write-restrictive and instead rely on the existing permissive policies for writes

DROP POLICY IF EXISTS "Require auth for profile writes" ON public.profiles;
