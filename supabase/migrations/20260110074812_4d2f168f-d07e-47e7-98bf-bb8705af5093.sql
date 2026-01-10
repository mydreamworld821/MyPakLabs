-- Create enum for appointment status
CREATE TYPE public.appointment_status AS ENUM (
  'pending',
  'confirmed',
  'cancelled',
  'completed',
  'no_show'
);

-- Create enum for consultation type
CREATE TYPE public.consultation_type AS ENUM (
  'physical',
  'online'
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  consultation_type public.consultation_type NOT NULL DEFAULT 'physical',
  status public.appointment_status NOT NULL DEFAULT 'pending',
  fee INTEGER NOT NULL,
  notes TEXT,
  cancellation_reason TEXT,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Patients can view own appointments"
ON public.appointments
FOR SELECT
USING (auth.uid() = patient_id);

CREATE POLICY "Patients can create appointments"
ON public.appointments
FOR INSERT
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can cancel own appointments"
ON public.appointments
FOR UPDATE
USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view their appointments"
ON public.appointments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.doctors 
    WHERE id = doctor_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Doctors can update their appointments"
ON public.appointments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.doctors 
    WHERE id = doctor_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all appointments"
ON public.appointments
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_status ON public.appointments(status);