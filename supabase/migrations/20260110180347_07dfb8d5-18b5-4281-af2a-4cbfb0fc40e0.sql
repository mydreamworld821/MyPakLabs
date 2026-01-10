-- Drop the previous policies that had incorrect matching logic
DROP POLICY IF EXISTS "Patients can view prescriptions for their appointments" ON storage.objects;
DROP POLICY IF EXISTS "Patients can view prescriptions for their appointments v2" ON storage.objects;

-- Create a simpler, correct policy: patient can view prescription if file name matches their appointment's prescription_url
CREATE POLICY "Patients can view prescriptions for their appointments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'prescriptions' AND
  EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.patient_id = auth.uid()
    AND a.prescription_url IS NOT NULL
    AND name = a.prescription_url
  )
);