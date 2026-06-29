CREATE OR REPLACE VIEW public.public_nurses AS
SELECT id, user_id, full_name, photo_url, city, gender, experience_years,
       qualification, institute_name, services_offered, certifications,
       languages_spoken, rating, review_count, is_featured, featured_order,
       emergency_available, home_visit_radius, monthly_package_fee,
       per_hour_fee, per_visit_fee, fee_negotiable, available_days,
       available_shifts, status, created_at
FROM public.nurses
WHERE status IN ('approved', 'suspended');