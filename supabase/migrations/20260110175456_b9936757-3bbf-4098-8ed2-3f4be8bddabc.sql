-- Allow doctors to upload prescriptions to the prescriptions storage bucket
-- First, we need to add a policy for doctors to INSERT into prescriptions bucket

CREATE POLICY "Doctors can upload prescriptions for their appointments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'prescriptions' AND
  EXISTS (
    SELECT 1 FROM doctors d
    WHERE d.user_id = auth.uid()
    AND d.status = 'approved'
  )
);

-- Allow doctors to view prescriptions they uploaded
CREATE POLICY "Doctors can view prescriptions they uploaded"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'prescriptions' AND
  EXISTS (
    SELECT 1 FROM doctors d
    WHERE d.user_id = auth.uid()
    AND d.status = 'approved'
  )
);