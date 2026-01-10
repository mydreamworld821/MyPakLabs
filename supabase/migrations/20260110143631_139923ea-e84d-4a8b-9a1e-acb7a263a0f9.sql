-- Create enum for urgency levels
CREATE TYPE public.emergency_urgency AS ENUM ('critical', 'within_1_hour', 'scheduled');

-- Create enum for emergency request status
CREATE TYPE public.emergency_request_status AS ENUM ('live', 'accepted', 'in_progress', 'completed', 'cancelled');

-- Create enum for nurse offer status
CREATE TYPE public.nurse_offer_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');

-- Emergency Nursing Requests Table
CREATE TABLE public.emergency_nursing_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  location_lat DECIMAL(10, 8) NOT NULL,
  location_lng DECIMAL(11, 8) NOT NULL,
  location_address TEXT,
  city TEXT,
  services_needed TEXT[] NOT NULL DEFAULT '{}',
  urgency public.emergency_urgency NOT NULL DEFAULT 'critical',
  patient_offer_price INTEGER,
  notes TEXT,
  status public.emergency_request_status NOT NULL DEFAULT 'live',
  accepted_offer_id UUID,
  accepted_nurse_id UUID,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  patient_rating INTEGER CHECK (patient_rating >= 1 AND patient_rating <= 5),
  patient_review TEXT,
  tip_amount INTEGER,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Nurse Offers Table
CREATE TABLE public.nurse_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.emergency_nursing_requests(id) ON DELETE CASCADE,
  nurse_id UUID NOT NULL REFERENCES public.nurses(id) ON DELETE CASCADE,
  offered_price INTEGER NOT NULL,
  eta_minutes INTEGER NOT NULL,
  message TEXT,
  status public.nurse_offer_status NOT NULL DEFAULT 'pending',
  nurse_lat DECIMAL(10, 8),
  nurse_lng DECIMAL(11, 8),
  distance_km DECIMAL(6, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(request_id, nurse_id)
);

-- Nurse Tracking Table (for live location updates)
CREATE TABLE public.nurse_emergency_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.emergency_nursing_requests(id) ON DELETE CASCADE,
  nurse_id UUID NOT NULL REFERENCES public.nurses(id) ON DELETE CASCADE,
  current_lat DECIMAL(10, 8) NOT NULL,
  current_lng DECIMAL(11, 8) NOT NULL,
  status TEXT NOT NULL DEFAULT 'on_way', -- on_way, arrived, in_service
  arrived_at TIMESTAMP WITH TIME ZONE,
  service_started_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(request_id, nurse_id)
);

-- Enable RLS on all tables
ALTER TABLE public.emergency_nursing_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nurse_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nurse_emergency_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for emergency_nursing_requests

-- Patients can create their own requests
CREATE POLICY "Patients can create emergency requests"
ON public.emergency_nursing_requests
FOR INSERT
WITH CHECK (auth.uid() = patient_id);

-- Patients can view their own requests
CREATE POLICY "Patients can view own emergency requests"
ON public.emergency_nursing_requests
FOR SELECT
USING (auth.uid() = patient_id);

-- Patients can update their own requests
CREATE POLICY "Patients can update own emergency requests"
ON public.emergency_nursing_requests
FOR UPDATE
USING (auth.uid() = patient_id);

-- Approved nurses can view live requests
CREATE POLICY "Approved nurses can view live requests"
ON public.emergency_nursing_requests
FOR SELECT
USING (
  status = 'live' AND 
  EXISTS (
    SELECT 1 FROM public.nurses 
    WHERE nurses.user_id = auth.uid() 
    AND nurses.status = 'approved'
  )
);

-- Nurses can view requests they've been accepted for
CREATE POLICY "Nurses can view their accepted requests"
ON public.emergency_nursing_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.nurses 
    WHERE nurses.user_id = auth.uid() 
    AND nurses.id = emergency_nursing_requests.accepted_nurse_id
  )
);

-- Nurses can update requests they're assigned to
CREATE POLICY "Nurses can update their assigned requests"
ON public.emergency_nursing_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.nurses 
    WHERE nurses.user_id = auth.uid() 
    AND nurses.id = emergency_nursing_requests.accepted_nurse_id
  )
);

-- Admins can manage all requests
CREATE POLICY "Admins can manage all emergency requests"
ON public.emergency_nursing_requests
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for nurse_offers

-- Nurses can create offers
CREATE POLICY "Nurses can create offers"
ON public.nurse_offers
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.nurses 
    WHERE nurses.user_id = auth.uid() 
    AND nurses.id = nurse_offers.nurse_id
    AND nurses.status = 'approved'
  )
);

-- Nurses can view their own offers
CREATE POLICY "Nurses can view own offers"
ON public.nurse_offers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.nurses 
    WHERE nurses.user_id = auth.uid() 
    AND nurses.id = nurse_offers.nurse_id
  )
);

-- Nurses can update their own offers
CREATE POLICY "Nurses can update own offers"
ON public.nurse_offers
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.nurses 
    WHERE nurses.user_id = auth.uid() 
    AND nurses.id = nurse_offers.nurse_id
  )
);

-- Patients can view offers on their requests
CREATE POLICY "Patients can view offers on their requests"
ON public.nurse_offers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.emergency_nursing_requests 
    WHERE emergency_nursing_requests.id = nurse_offers.request_id
    AND emergency_nursing_requests.patient_id = auth.uid()
  )
);

-- Patients can update offer status (accept/reject)
CREATE POLICY "Patients can update offer status"
ON public.nurse_offers
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.emergency_nursing_requests 
    WHERE emergency_nursing_requests.id = nurse_offers.request_id
    AND emergency_nursing_requests.patient_id = auth.uid()
  )
);

-- Admins can manage all offers
CREATE POLICY "Admins can manage all offers"
ON public.nurse_offers
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for nurse_emergency_tracking

-- Nurses can manage their tracking
CREATE POLICY "Nurses can manage their tracking"
ON public.nurse_emergency_tracking
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.nurses 
    WHERE nurses.user_id = auth.uid() 
    AND nurses.id = nurse_emergency_tracking.nurse_id
  )
);

-- Patients can view tracking for their requests
CREATE POLICY "Patients can view tracking for their requests"
ON public.nurse_emergency_tracking
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.emergency_nursing_requests 
    WHERE emergency_nursing_requests.id = nurse_emergency_tracking.request_id
    AND emergency_nursing_requests.patient_id = auth.uid()
  )
);

-- Admins can manage all tracking
CREATE POLICY "Admins can manage all tracking"
ON public.nurse_emergency_tracking
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create updated_at triggers
CREATE TRIGGER update_emergency_nursing_requests_updated_at
BEFORE UPDATE ON public.emergency_nursing_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nurse_offers_updated_at
BEFORE UPDATE ON public.nurse_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nurse_emergency_tracking_updated_at
BEFORE UPDATE ON public.nurse_emergency_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_nursing_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.nurse_offers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.nurse_emergency_tracking;