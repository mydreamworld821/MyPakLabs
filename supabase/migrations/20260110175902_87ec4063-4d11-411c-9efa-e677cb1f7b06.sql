-- Make medicine-prescriptions bucket public so URLs work
UPDATE storage.buckets SET public = true WHERE id = 'medicine-prescriptions';

-- Add policy for pharmacy staff to view prescriptions (if not exists, we'll use CREATE OR REPLACE pattern)
DO $$
BEGIN
  -- Drop and recreate to avoid conflicts
  DROP POLICY IF EXISTS "Pharmacy staff can view prescriptions for their orders" ON storage.objects;
  
  CREATE POLICY "Pharmacy staff can view prescriptions for their orders"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'medicine-prescriptions' AND
    EXISTS (
      SELECT 1 FROM medicine_orders mo
      JOIN medical_stores ms ON mo.store_id = ms.id
      WHERE ms.user_id = auth.uid()
      AND mo.prescription_url LIKE '%' || storage.filename(name) || '%'
    )
  );
END $$;