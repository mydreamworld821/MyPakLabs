-- Add columns to track if user availed the discount
ALTER TABLE public.orders
ADD COLUMN is_availed boolean DEFAULT false,
ADD COLUMN availed_at timestamp with time zone DEFAULT NULL;

-- Allow users to update their own order's availed status
CREATE POLICY "Users can update own order availed status"
ON public.orders
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);