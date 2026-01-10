-- Create nurses table for home nursing services
CREATE TABLE public.nurses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Basic Personal Information
  full_name TEXT NOT NULL,
  cnic TEXT,
  gender TEXT,
  date_of_birth DATE,
  photo_url TEXT,
  phone TEXT,
  whatsapp_number TEXT,
  email TEXT,
  city TEXT,
  area_of_service TEXT,
  home_visit_radius INTEGER DEFAULT 10,
  
  -- Professional Qualification
  qualification TEXT NOT NULL, -- LPN, RN, BSc Nursing, Post-RN BSc, Diploma
  institute_name TEXT,
  year_of_completion INTEGER,
  pnc_number TEXT NOT NULL, -- Pakistan Nursing Council
  pnc_expiry_date DATE,
  degree_certificate_url TEXT,
  pnc_card_url TEXT,
  
  -- Experience Details
  experience_years INTEGER DEFAULT 0,
  current_employment TEXT, -- Hospital, Clinic, Home Care, Freelance
  previous_workplaces TEXT[],
  department_experience TEXT[], -- ICU, Emergency, OT, Medical Ward, etc.
  
  -- Nursing Services Offered
  services_offered TEXT[] NOT NULL DEFAULT '{}',
  
  -- Availability & Charges
  available_days TEXT[] DEFAULT '{}',
  available_shifts TEXT[] DEFAULT '{}', -- Morning, Evening, Night
  emergency_available BOOLEAN DEFAULT false,
  per_visit_fee INTEGER,
  per_hour_fee INTEGER,
  monthly_package_fee INTEGER,
  fee_negotiable BOOLEAN DEFAULT true,
  
  -- Skills & Certifications
  certifications TEXT[] DEFAULT '{}',
  certificate_urls TEXT[] DEFAULT '{}',
  
  -- Languages
  languages_spoken TEXT[] DEFAULT '{Urdu}',
  
  -- Legal & Consent
  terms_accepted BOOLEAN DEFAULT false,
  background_check_consent BOOLEAN DEFAULT false,
  ethics_accepted BOOLEAN DEFAULT false,
  
  -- Status & Moderation
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, suspended
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Ratings
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  
  -- Featured
  is_featured BOOLEAN DEFAULT false,
  featured_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.nurses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view approved nurses"
ON public.nurses FOR SELECT
USING (status = 'approved');

CREATE POLICY "Nurses can view own profile"
ON public.nurses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create nurse profile"
ON public.nurses FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Nurses can update own profile"
ON public.nurses FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all nurses"
ON public.nurses FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage nurses"
ON public.nurses FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER update_nurses_updated_at
BEFORE UPDATE ON public.nurses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for nurse documents
INSERT INTO storage.buckets (id, name, public) VALUES ('nurse-documents', 'nurse-documents', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('nurse-photos', 'nurse-photos', true);

-- Storage policies for nurse documents (private - only owner and admin)
CREATE POLICY "Nurses can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'nurse-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Nurses can view own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'nurse-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all nurse documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'nurse-documents' AND 
  has_role(auth.uid(), 'admin')
);

-- Storage policies for nurse photos (public)
CREATE POLICY "Anyone can view nurse photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'nurse-photos');

CREATE POLICY "Nurses can upload own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'nurse-photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Nurses can update own photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'nurse-photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Nurses can delete own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'nurse-photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);