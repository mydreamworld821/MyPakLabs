-- Add timing and contact fields to labs table
ALTER TABLE public.labs 
ADD COLUMN IF NOT EXISTS opening_time text DEFAULT '7:00 AM',
ADD COLUMN IF NOT EXISTS closing_time text DEFAULT '10:00 PM',
ADD COLUMN IF NOT EXISTS contact_phone text,
ADD COLUMN IF NOT EXISTS contact_email text;