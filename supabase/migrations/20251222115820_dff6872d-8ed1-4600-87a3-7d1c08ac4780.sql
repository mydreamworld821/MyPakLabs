-- Add restrictive policies to explicitly require authentication for sensitive tables

-- Profiles: Require authentication for all operations
CREATE POLICY "Require authentication for profiles access"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- Prescriptions: Require authentication for all operations
CREATE POLICY "Require authentication for prescriptions access"
ON public.prescriptions
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- Orders: Also add restrictive policy for completeness (contains user data)
CREATE POLICY "Require authentication for orders access"
ON public.orders
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);