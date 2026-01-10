-- Add icon_url column to store uploaded specialization icons
ALTER TABLE public.doctor_specializations 
ADD COLUMN IF NOT EXISTS icon_url TEXT;