-- Create surgery inquiries table
CREATE TABLE public.surgery_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  surgery_id UUID REFERENCES public.surgeries(id) ON DELETE SET NULL,
  surgery_name TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT,
  question TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.surgery_inquiries ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an inquiry (no auth required for lead generation)
CREATE POLICY "Anyone can create surgery inquiries"
ON public.surgery_inquiries
FOR INSERT
WITH CHECK (true);

-- Only admins can view and manage inquiries
CREATE POLICY "Admins can view all surgery inquiries"
ON public.surgery_inquiries
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update surgery inquiries"
ON public.surgery_inquiries
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete surgery inquiries"
ON public.surgery_inquiries
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_surgery_inquiries_updated_at
BEFORE UPDATE ON public.surgery_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();