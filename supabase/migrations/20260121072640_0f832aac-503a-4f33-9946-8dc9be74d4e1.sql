-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Nurses can upload own photos" ON storage.objects;
DROP POLICY IF EXISTS "Nurses can update own photos" ON storage.objects;
DROP POLICY IF EXISTS "Nurses can delete own photos" ON storage.objects;

-- Allow nurses to upload their own photos and commission payment screenshots
CREATE POLICY "Nurses can upload own photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'nurse-photos' 
  AND auth.uid() IS NOT NULL
  AND (
    -- Allow uploading to their own folder
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Allow uploading to commission-payments folder if they are a registered nurse
    (
      (storage.foldername(name))[1] = 'commission-payments'
      AND EXISTS (
        SELECT 1 FROM public.nurses WHERE user_id = auth.uid()
      )
    )
  )
);

-- Allow nurses to update their own photos
CREATE POLICY "Nurses can update own photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'nurse-photos' 
  AND auth.uid() IS NOT NULL
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    (
      (storage.foldername(name))[1] = 'commission-payments'
      AND EXISTS (
        SELECT 1 FROM public.nurses WHERE user_id = auth.uid()
      )
    )
  )
);

-- Allow nurses to delete their own photos
CREATE POLICY "Nurses can delete own photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'nurse-photos' 
  AND auth.uid() IS NOT NULL
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    (
      (storage.foldername(name))[1] = 'commission-payments'
      AND EXISTS (
        SELECT 1 FROM public.nurses WHERE user_id = auth.uid()
      )
    )
  )
);