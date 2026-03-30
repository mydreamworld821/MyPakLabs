DROP POLICY "Require authentication for orders access" ON public.orders;

CREATE POLICY "Require authentication for orders access"
ON public.orders
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);