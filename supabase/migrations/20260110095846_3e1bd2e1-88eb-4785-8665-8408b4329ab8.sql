-- Add featured columns to labs table
ALTER TABLE public.labs 
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS featured_order integer DEFAULT 0;

-- Create index for featured labs queries
CREATE INDEX IF NOT EXISTS idx_labs_featured ON public.labs (is_featured, featured_order) WHERE is_featured = true;