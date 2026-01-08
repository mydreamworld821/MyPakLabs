-- Add unique_id column to prescriptions table for lab-based discount IDs
ALTER TABLE public.prescriptions 
ADD COLUMN IF NOT EXISTS unique_id text;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_prescriptions_unique_id ON public.prescriptions(unique_id);

-- Add constraint to ensure unique_id is unique when set
ALTER TABLE public.prescriptions 
ADD CONSTRAINT prescriptions_unique_id_unique UNIQUE (unique_id);