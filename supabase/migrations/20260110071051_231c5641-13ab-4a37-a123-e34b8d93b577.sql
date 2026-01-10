-- Create doctor specializations table (admin managed)
CREATE TABLE public.doctor_specializations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_name TEXT DEFAULT 'Stethoscope',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create doctors table
CREATE TABLE public.doctors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  pmc_number TEXT NOT NULL UNIQUE,
  specialization_id UUID REFERENCES public.doctor_specializations(id) ON DELETE SET NULL,
  experience_years INTEGER,
  qualification TEXT,
  clinic_name TEXT,
  clinic_address TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  consultation_fee INTEGER,
  availability TEXT,
  photo_url TEXT,
  about TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_featured BOOLEAN DEFAULT false,
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.doctor_specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- RLS policies for doctor_specializations
CREATE POLICY "Anyone can view active specializations"
ON public.doctor_specializations
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage specializations"
ON public.doctor_specializations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for doctors
CREATE POLICY "Anyone can view approved doctors"
ON public.doctors
FOR SELECT
USING (status = 'approved');

CREATE POLICY "Admins can view all doctors"
ON public.doctors
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage doctors"
ON public.doctors
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Doctors can view own profile"
ON public.doctors
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Doctors can update own profile"
ON public.doctors
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create doctor profile"
ON public.doctors
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Triggers for updated_at
CREATE TRIGGER update_doctor_specializations_updated_at
BEFORE UPDATE ON public.doctor_specializations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at
BEFORE UPDATE ON public.doctors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for doctor photos
INSERT INTO storage.buckets (id, name, public) VALUES ('doctor-photos', 'doctor-photos', true);

-- Storage policies
CREATE POLICY "Anyone can view doctor photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'doctor-photos');

CREATE POLICY "Authenticated users can upload doctor photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'doctor-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own doctor photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'doctor-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own doctor photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'doctor-photos' AND auth.uid()::text = (storage.foldername(name))[1]);