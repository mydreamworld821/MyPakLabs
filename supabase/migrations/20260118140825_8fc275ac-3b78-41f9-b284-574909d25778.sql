-- Add tests_included JSON column for manually added tests
ALTER TABLE public.health_packages 
ADD COLUMN IF NOT EXISTS tests_included JSONB DEFAULT '[]'::jsonb;

-- Add comment for clarity
COMMENT ON COLUMN public.health_packages.tests_included IS 'JSON array of manually added tests: [{name: string, details?: string}]';