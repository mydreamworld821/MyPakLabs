-- Drop the existing "Admins can manage all reviews" policy that covers ALL commands
-- and create separate policies for each operation

-- First drop the existing ALL policy
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.reviews;

-- Create separate policies for admin operations
CREATE POLICY "Admins can select all reviews"
ON public.reviews
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all reviews"
ON public.reviews
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all reviews"
ON public.reviews
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));