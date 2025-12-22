-- Create a private storage bucket for prescriptions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'prescriptions',
  'prescriptions',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
);

-- Allow authenticated users to upload their own prescriptions
CREATE POLICY "Users can upload own prescriptions"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'prescriptions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own prescriptions
CREATE POLICY "Users can view own prescriptions"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'prescriptions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own prescriptions
CREATE POLICY "Users can delete own prescriptions"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'prescriptions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to view all prescriptions
CREATE POLICY "Admins can view all prescriptions"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'prescriptions' 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Allow admins to delete any prescription
CREATE POLICY "Admins can delete any prescription"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'prescriptions' 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);