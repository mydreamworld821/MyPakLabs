-- Create medical_stores table
CREATE TABLE public.medical_stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  license_number TEXT NOT NULL,
  cnic TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  city TEXT NOT NULL,
  area TEXT NOT NULL,
  full_address TEXT NOT NULL,
  location_lat NUMERIC,
  location_lng NUMERIC,
  logo_url TEXT,
  cover_image_url TEXT,
  delivery_available BOOLEAN DEFAULT true,
  is_24_hours BOOLEAN DEFAULT false,
  opening_time TEXT DEFAULT '9:00 AM',
  closing_time TEXT DEFAULT '10:00 PM',
  is_featured BOOLEAN DEFAULT false,
  featured_order INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medicine_orders table
CREATE TABLE public.medicine_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unique_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  store_id UUID NOT NULL REFERENCES public.medical_stores(id),
  prescription_url TEXT,
  medicines JSONB DEFAULT '[]'::jsonb,
  delivery_address TEXT NOT NULL,
  delivery_lat NUMERIC,
  delivery_lng NUMERIC,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  pharmacy_notes TEXT,
  estimated_price NUMERIC,
  final_price NUMERIC,
  estimated_delivery_time TEXT,
  prepared_at TIMESTAMP WITH TIME ZONE,
  dispatched_at TIMESTAMP WITH TIME ZONE,
  pharmacy_confirmed_at TIMESTAMP WITH TIME ZONE,
  user_confirmed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medical_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_orders ENABLE ROW LEVEL SECURITY;

-- RLS policies for medical_stores
CREATE POLICY "Admins can manage medical stores"
  ON public.medical_stores FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view approved active stores"
  ON public.medical_stores FOR SELECT
  USING (status = 'approved' AND is_active = true);

CREATE POLICY "Authenticated users can create store registration"
  ON public.medical_stores FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Store owners can view own store"
  ON public.medical_stores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Store owners can update own store"
  ON public.medical_stores FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS policies for medicine_orders
CREATE POLICY "Admins can manage all medicine orders"
  ON public.medicine_orders FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create medicine orders"
  ON public.medicine_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own orders"
  ON public.medicine_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own orders"
  ON public.medicine_orders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Store owners can view their store orders"
  ON public.medicine_orders FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM medical_stores
    WHERE medical_stores.id = medicine_orders.store_id
    AND medical_stores.user_id = auth.uid()
  ));

CREATE POLICY "Store owners can update their store orders"
  ON public.medicine_orders FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM medical_stores
    WHERE medical_stores.id = medicine_orders.store_id
    AND medical_stores.user_id = auth.uid()
  ));

-- Create trigger for updated_at
CREATE TRIGGER update_medical_stores_updated_at
  BEFORE UPDATE ON public.medical_stores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medicine_orders_updated_at
  BEFORE UPDATE ON public.medicine_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage buckets for pharmacy
INSERT INTO storage.buckets (id, name, public) VALUES ('pharmacy-images', 'pharmacy-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('pharmacy-documents', 'pharmacy-documents', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('medicine-prescriptions', 'medicine-prescriptions', false);

-- Storage policies for pharmacy-images (public)
CREATE POLICY "Anyone can view pharmacy images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pharmacy-images');

CREATE POLICY "Authenticated users can upload pharmacy images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pharmacy-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own pharmacy images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'pharmacy-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for pharmacy-documents (private)
CREATE POLICY "Users can view own pharmacy documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pharmacy-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can upload pharmacy documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pharmacy-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view all pharmacy documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pharmacy-documents' AND has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for medicine-prescriptions
CREATE POLICY "Users can view own medicine prescriptions"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'medicine-prescriptions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can upload medicine prescriptions"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'medicine-prescriptions' AND auth.uid() IS NOT NULL);

CREATE POLICY "Store owners can view prescriptions for their orders"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'medicine-prescriptions' AND has_role(auth.uid(), 'pharmacy'::app_role));

CREATE POLICY "Admins can view all medicine prescriptions"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'medicine-prescriptions' AND has_role(auth.uid(), 'admin'::app_role));