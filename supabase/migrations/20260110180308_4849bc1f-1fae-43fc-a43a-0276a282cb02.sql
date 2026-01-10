-- Allow patients to view prescriptions for their own appointments
-- The prescription is uploaded by the doctor but stored in the prescriptions bucket
-- Patients need access to download prescriptions for their completed appointments

CREATE POLICY "Patients can view prescriptions for their appointments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'prescriptions' AND
  EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.patient_id = auth.uid()
    AND a.prescription_url = storage.filename(name)
  )
);

-- Also allow using the path format (user_id/filename)
CREATE POLICY "Patients can view prescriptions for their appointments v2"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'prescriptions' AND
  EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.patient_id = auth.uid()
    AND a.prescription_url IS NOT NULL
    AND name LIKE '%' || split_part(a.prescription_url, '/', 2) || '%'
  )
);

-- Admins can view all prescriptions
CREATE POLICY "Admins can view all doctor prescriptions"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'prescriptions' AND
  public.has_role(auth.uid(), 'admin')
);