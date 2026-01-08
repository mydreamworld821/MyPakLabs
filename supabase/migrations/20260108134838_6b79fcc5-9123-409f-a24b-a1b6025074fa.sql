-- Create policy for moderators to view all prescriptions
CREATE POLICY "Moderators can view all prescriptions" 
ON public.prescriptions 
FOR SELECT 
USING (has_role(auth.uid(), 'moderator'::app_role));

-- Create policy for moderators to update prescriptions (approve/reject)
CREATE POLICY "Moderators can update prescriptions" 
ON public.prescriptions 
FOR UPDATE 
USING (has_role(auth.uid(), 'moderator'::app_role));