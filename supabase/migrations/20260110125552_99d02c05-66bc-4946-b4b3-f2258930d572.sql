-- Add featured_order column to doctors table for admin management
ALTER TABLE public.doctors 
ADD COLUMN IF NOT EXISTS featured_order integer DEFAULT 0;

-- Create index for efficient featured doctors queries
CREATE INDEX IF NOT EXISTS idx_doctors_featured ON public.doctors(is_featured, featured_order) WHERE is_featured = true;