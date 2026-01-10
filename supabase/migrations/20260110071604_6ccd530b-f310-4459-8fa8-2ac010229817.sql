-- Add new columns to doctors table for comprehensive registration
ALTER TABLE public.doctors
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS sub_specialty TEXT,
ADD COLUMN IF NOT EXISTS registration_council TEXT,
ADD COLUMN IF NOT EXISTS hospital_name TEXT,
ADD COLUMN IF NOT EXISTS consultation_type TEXT DEFAULT 'both' CHECK (consultation_type IN ('physical', 'online', 'both')),
ADD COLUMN IF NOT EXISTS followup_fee INTEGER,
ADD COLUMN IF NOT EXISTS available_days TEXT[],
ADD COLUMN IF NOT EXISTS available_time_start TEXT,
ADD COLUMN IF NOT EXISTS available_time_end TEXT,
ADD COLUMN IF NOT EXISTS appointment_duration INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS emergency_available BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS video_consultation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS preferred_platform TEXT,
ADD COLUMN IF NOT EXISTS online_consultation_fee INTEGER,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS areas_of_expertise TEXT[],
ADD COLUMN IF NOT EXISTS services_offered TEXT[],
ADD COLUMN IF NOT EXISTS languages_spoken TEXT[],
ADD COLUMN IF NOT EXISTS degree_certificate_url TEXT,
ADD COLUMN IF NOT EXISTS pmc_certificate_url TEXT,
ADD COLUMN IF NOT EXISTS cnic_url TEXT,
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS privacy_accepted BOOLEAN DEFAULT false;

-- Create storage bucket for doctor documents (private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('doctor-documents', 'doctor-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for doctor documents
CREATE POLICY "Authenticated users can upload doctor documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'doctor-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own doctor documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'doctor-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all doctor documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'doctor-documents' AND EXISTS (
  SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Users can delete own doctor documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'doctor-documents' AND auth.uid()::text = (storage.foldername(name))[1]);