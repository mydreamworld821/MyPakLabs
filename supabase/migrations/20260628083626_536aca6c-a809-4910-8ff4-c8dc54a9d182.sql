
-- Public-safe profiles view for anonymous/cross-user display (reviews, comments)
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT user_id, full_name, avatar_url
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Remove broad anonymous SELECT on profiles (contains PHI: phone, age, medical history, etc.)
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Public-safe nurses view exposing only professional info (no CNIC, email, phone, address, DOB, docs)
CREATE OR REPLACE VIEW public.public_nurses
WITH (security_invoker = true) AS
SELECT
  id, user_id, full_name, photo_url, city, gender,
  experience_years, qualification, institute_name,
  services_offered, certifications, languages_spoken,
  rating, review_count, is_featured, featured_order,
  emergency_available, home_visit_radius,
  monthly_package_fee, per_hour_fee, per_visit_fee, fee_negotiable,
  available_days, available_shifts, status, created_at
FROM public.nurses
WHERE status = 'approved';

GRANT SELECT ON public.public_nurses TO anon, authenticated;

-- Restrict full nurses table reads to authenticated users only (drops anonymous PII exposure)
DROP POLICY IF EXISTS "Anyone can view approved nurses" ON public.nurses;
CREATE POLICY "Authenticated can view approved nurses"
ON public.nurses FOR SELECT
TO authenticated
USING (status = 'approved');
