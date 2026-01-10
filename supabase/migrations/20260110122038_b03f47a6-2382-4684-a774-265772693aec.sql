-- Create hospital_doctors junction table for many-to-many relationship
CREATE TABLE public.hospital_doctors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  department TEXT,
  schedule TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(hospital_id, doctor_id)
);

-- Enable RLS
ALTER TABLE public.hospital_doctors ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view hospital doctors"
ON public.hospital_doctors
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage hospital doctors"
ON public.hospital_doctors
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_hospital_doctors_updated_at
BEFORE UPDATE ON public.hospital_doctors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for hospital images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('hospital-images', 'hospital-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for hospital images
CREATE POLICY "Anyone can view hospital images"
ON storage.objects FOR SELECT
USING (bucket_id = 'hospital-images');

CREATE POLICY "Admins can upload hospital images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'hospital-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update hospital images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'hospital-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete hospital images"
ON storage.objects FOR DELETE
USING (bucket_id = 'hospital-images' AND has_role(auth.uid(), 'admin'::app_role));