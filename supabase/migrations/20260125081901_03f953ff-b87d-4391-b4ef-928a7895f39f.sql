-- Drop the existing check constraint
ALTER TABLE public.doctors DROP CONSTRAINT IF EXISTS doctors_status_check;

-- Add the updated check constraint with "suspended" status
ALTER TABLE public.doctors ADD CONSTRAINT doctors_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'));