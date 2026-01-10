-- Create hospitals table
CREATE TABLE public.hospitals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  city TEXT,
  address TEXT,
  specialties TEXT[] DEFAULT '{}',
  contact_phone TEXT,
  contact_email TEXT,
  website TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  description TEXT,
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  opening_time TEXT DEFAULT '8:00 AM',
  closing_time TEXT DEFAULT '10:00 PM',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  featured_order INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active hospitals"
ON public.hospitals
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage hospitals"
ON public.hospitals
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_hospitals_updated_at
BEFORE UPDATE ON public.hospitals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add some sample hospitals
INSERT INTO public.hospitals (name, slug, city, address, specialties, contact_phone, description, rating, review_count) VALUES
('Aga Khan University Hospital', 'aga-khan-university-hospital', 'Karachi', 'Stadium Road, Karachi', ARRAY['Cardiology', 'Oncology', 'Neurology', 'Orthopedics', 'Pediatrics'], '021-111-911-911', 'A leading tertiary care hospital providing comprehensive healthcare services.', 4.8, 1250),
('Shaukat Khanum Memorial Hospital', 'shaukat-khanum-memorial-hospital', 'Lahore', 'Johar Town, Lahore', ARRAY['Oncology', 'Radiology', 'Pathology', 'Surgery'], '042-35905000', 'Pakistan''s leading cancer treatment and research hospital.', 4.9, 2100),
('Jinnah Hospital', 'jinnah-hospital', 'Lahore', 'Allama Iqbal Medical College, Lahore', ARRAY['Emergency', 'General Surgery', 'Medicine', 'Gynecology'], '042-99231401', 'A major public sector hospital providing quality healthcare.', 4.2, 890),
('Pakistan Institute of Medical Sciences', 'pims-islamabad', 'Islamabad', 'G-8/3, Islamabad', ARRAY['Cardiology', 'Nephrology', 'Neurosurgery', 'Orthopedics'], '051-9261170', 'One of the largest public hospitals in the capital.', 4.3, 750),
('Liaquat National Hospital', 'liaquat-national-hospital', 'Karachi', 'Stadium Road, Karachi', ARRAY['Cardiology', 'Gastroenterology', 'Pulmonology', 'Urology'], '021-111-456-456', 'A premier healthcare institution with state-of-the-art facilities.', 4.6, 980),
('Indus Hospital', 'indus-hospital', 'Karachi', 'Korangi Crossing, Karachi', ARRAY['Emergency', 'Pediatrics', 'Oncology', 'Dialysis'], '021-35112709', 'A free healthcare facility providing quality treatment to all.', 4.7, 1500);