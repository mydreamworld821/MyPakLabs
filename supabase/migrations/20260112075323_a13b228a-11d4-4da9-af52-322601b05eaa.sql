-- Allow deleting labs while preserving historical orders
-- orders.lab_id must be nullable because FK is ON DELETE SET NULL
ALTER TABLE public.orders
ALTER COLUMN lab_id DROP NOT NULL;

-- (Optional safety) keep prescriptions.lab_id nullable (already is) and ensure FK exists
ALTER TABLE public.prescriptions
ALTER COLUMN lab_id DROP NOT NULL;