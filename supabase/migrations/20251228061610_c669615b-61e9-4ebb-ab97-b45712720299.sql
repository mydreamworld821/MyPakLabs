-- Add approved_tests column to prescriptions table to store the tests approved by admin
ALTER TABLE public.prescriptions 
ADD COLUMN approved_tests jsonb DEFAULT '[]'::jsonb;

-- Add comment for clarity
COMMENT ON COLUMN public.prescriptions.approved_tests IS 'Array of test objects approved by admin: [{test_id, test_name, price}]';