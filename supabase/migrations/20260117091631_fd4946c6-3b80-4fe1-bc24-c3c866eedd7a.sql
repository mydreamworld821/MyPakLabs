-- Add unique_id column to appointments table
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS unique_id TEXT;

-- Add unique_id column to nurse_bookings table
ALTER TABLE public.nurse_bookings 
ADD COLUMN IF NOT EXISTS unique_id TEXT;

-- Create indexes for unique_id lookups
CREATE INDEX IF NOT EXISTS idx_appointments_unique_id ON public.appointments(unique_id);
CREATE INDEX IF NOT EXISTS idx_nurse_bookings_unique_id ON public.nurse_bookings(unique_id);

-- Create function to generate booking unique ID
-- Doctor: MPL-DD-DR-NNNNN
-- Nurse: MPL-DD-NS-NNNNN
CREATE OR REPLACE FUNCTION public.generate_booking_unique_id(booking_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today_day TEXT;
  prefix TEXT;
  next_seq INTEGER;
  table_name TEXT;
  existing_count INTEGER;
BEGIN
  -- Get current day (2 digits) in Pakistan timezone
  today_day := TO_CHAR(NOW() AT TIME ZONE 'Asia/Karachi', 'DD');
  
  -- Set prefix based on booking type
  IF booking_type = 'doctor' THEN
    prefix := 'MPL-' || today_day || '-DR';
    table_name := 'appointments';
  ELSIF booking_type = 'nurse' THEN
    prefix := 'MPL-' || today_day || '-NS';
    table_name := 'nurse_bookings';
  ELSE
    RAISE EXCEPTION 'Invalid booking type. Use "doctor" or "nurse"';
  END IF;
  
  -- Get next sequence number by counting existing records with same prefix
  IF table_name = 'appointments' THEN
    SELECT COUNT(*) INTO existing_count 
    FROM appointments 
    WHERE unique_id LIKE prefix || '-%';
  ELSE
    SELECT COUNT(*) INTO existing_count 
    FROM nurse_bookings 
    WHERE unique_id LIKE prefix || '-%';
  END IF;
  
  next_seq := existing_count + 1;
  
  -- Return formatted unique ID
  RETURN prefix || '-' || LPAD(next_seq::TEXT, 5, '0');
END;
$$;