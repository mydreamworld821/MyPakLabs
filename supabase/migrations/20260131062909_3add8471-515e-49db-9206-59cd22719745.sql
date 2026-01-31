
-- Add new columns to hospital_doctors for multi-location scheduling
ALTER TABLE public.hospital_doctors
ADD COLUMN IF NOT EXISTS consultation_fee integer,
ADD COLUMN IF NOT EXISTS followup_fee integer,
ADD COLUMN IF NOT EXISTS available_days text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS available_time_start time,
ADD COLUMN IF NOT EXISTS available_time_end time,
ADD COLUMN IF NOT EXISTS appointment_duration integer DEFAULT 15,
ADD COLUMN IF NOT EXISTS contact_phone text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Create a table for custom/manual hospital locations (not in hospitals table)
CREATE TABLE IF NOT EXISTS public.doctor_practice_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  location_name text NOT NULL,
  address text,
  city text,
  contact_phone text,
  consultation_fee integer NOT NULL,
  followup_fee integer,
  available_days text[] DEFAULT '{}',
  available_time_start time DEFAULT '09:00:00',
  available_time_end time DEFAULT '17:00:00',
  appointment_duration integer DEFAULT 15,
  is_primary boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add location reference to appointments
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS hospital_doctor_id uuid REFERENCES public.hospital_doctors(id),
ADD COLUMN IF NOT EXISTS practice_location_id uuid REFERENCES public.doctor_practice_locations(id),
ADD COLUMN IF NOT EXISTS location_name text;

-- Enable RLS on new table
ALTER TABLE public.doctor_practice_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for doctor_practice_locations
CREATE POLICY "Anyone can view active practice locations"
ON public.doctor_practice_locations
FOR SELECT
USING (is_active = true);

CREATE POLICY "Doctors can manage their own locations"
ON public.doctor_practice_locations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.doctors
    WHERE doctors.id = doctor_practice_locations.doctor_id
    AND doctors.user_id = auth.uid()
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_practice_location_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_doctor_practice_locations_timestamp ON public.doctor_practice_locations;
CREATE TRIGGER update_doctor_practice_locations_timestamp
  BEFORE UPDATE ON public.doctor_practice_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_practice_location_timestamp();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_doctor_practice_locations_doctor ON public.doctor_practice_locations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_hospital_doctors_active ON public.hospital_doctors(doctor_id, is_active);
CREATE INDEX IF NOT EXISTS idx_appointments_hospital_doctor ON public.appointments(hospital_doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_practice_location ON public.appointments(practice_location_id);

-- Comment for documentation
COMMENT ON TABLE public.doctor_practice_locations IS 'Stores doctor practice locations with individual schedules and fees for multi-hospital support';
