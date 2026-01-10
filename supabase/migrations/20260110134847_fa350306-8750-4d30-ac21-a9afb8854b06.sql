-- Create nurse_bookings table for booking inquiries
CREATE TABLE public.nurse_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nurse_id UUID NOT NULL REFERENCES public.nurses(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Patient details (for non-logged-in users)
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_address TEXT,
  
  -- Booking details
  service_needed TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TEXT NOT NULL,
  notes TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, completed, cancelled
  nurse_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.nurse_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can create booking inquiries"
ON public.nurse_bookings FOR INSERT
WITH CHECK (true);

CREATE POLICY "Patients can view own bookings"
ON public.nurse_bookings FOR SELECT
USING (auth.uid() = patient_id);

CREATE POLICY "Nurses can view their bookings"
ON public.nurse_bookings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.nurses 
    WHERE nurses.id = nurse_bookings.nurse_id 
    AND nurses.user_id = auth.uid()
  )
);

CREATE POLICY "Nurses can update their bookings"
ON public.nurse_bookings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.nurses 
    WHERE nurses.id = nurse_bookings.nurse_id 
    AND nurses.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all nurse bookings"
ON public.nurse_bookings FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER update_nurse_bookings_updated_at
BEFORE UPDATE ON public.nurse_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();