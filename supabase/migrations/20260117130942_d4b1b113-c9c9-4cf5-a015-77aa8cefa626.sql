-- Drop the existing policy that only shows approved reviews
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;

-- Create new policy that allows anyone to view all reviews
CREATE POLICY "Anyone can view all reviews" 
ON public.reviews 
FOR SELECT 
USING (true);

-- Update default status to 'approved' so new reviews appear immediately
ALTER TABLE public.reviews 
ALTER COLUMN status SET DEFAULT 'approved'::review_status;