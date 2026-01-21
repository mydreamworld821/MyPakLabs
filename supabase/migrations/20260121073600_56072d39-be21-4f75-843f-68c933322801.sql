-- Allow moderators to view and manage prescriptions
DROP POLICY IF EXISTS "Moderators can view all prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Moderators can update prescriptions" ON public.prescriptions;

CREATE POLICY "Moderators can view all prescriptions"
ON public.prescriptions
FOR SELECT
USING (has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Moderators can update prescriptions"
ON public.prescriptions
FOR UPDATE
USING (has_role(auth.uid(), 'moderator'::app_role));