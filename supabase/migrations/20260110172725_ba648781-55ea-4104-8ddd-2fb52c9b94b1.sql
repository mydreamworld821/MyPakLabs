-- Add columns for doctor consultation notes and prescription
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS consultation_notes TEXT,
ADD COLUMN IF NOT EXISTS prescription_url TEXT,
ADD COLUMN IF NOT EXISTS prescription_uploaded_at TIMESTAMP WITH TIME ZONE;