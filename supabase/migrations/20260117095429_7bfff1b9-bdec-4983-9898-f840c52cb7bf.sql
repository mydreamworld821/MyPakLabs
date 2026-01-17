-- Add house_address column for detailed manual address (house no, street, sector, area)
ALTER TABLE public.emergency_nursing_requests 
ADD COLUMN IF NOT EXISTS house_address TEXT;