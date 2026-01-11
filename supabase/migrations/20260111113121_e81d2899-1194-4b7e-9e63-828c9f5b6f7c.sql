-- Create nurse_hospitals junction table to link nurses with hospitals
CREATE TABLE public.nurse_hospitals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nurse_id UUID NOT NULL REFERENCES public.nurses(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  department TEXT,
  is_current BOOLEAN DEFAULT true,
  start_year INTEGER,
  end_year INTEGER,
  schedule TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(nurse_id, hospital_id)
);

-- Add is_current column to hospital_doctors table to distinguish current vs past hospitals
ALTER TABLE public.hospital_doctors 
ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS start_year INTEGER,
ADD COLUMN IF NOT EXISTS end_year INTEGER;

-- Enable RLS on nurse_hospitals
ALTER TABLE public.nurse_hospitals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for nurse_hospitals
CREATE POLICY "Admins can manage nurse hospitals" 
ON public.nurse_hospitals 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view nurse hospitals" 
ON public.nurse_hospitals 
FOR SELECT 
USING (true);

CREATE POLICY "Nurses can manage their own hospital associations" 
ON public.nurse_hospitals 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM nurses 
    WHERE nurses.id = nurse_hospitals.nurse_id 
    AND nurses.user_id = auth.uid()
  )
);

-- Update trigger for nurse_hospitals
CREATE TRIGGER update_nurse_hospitals_updated_at
BEFORE UPDATE ON public.nurse_hospitals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();