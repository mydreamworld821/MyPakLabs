-- Fix foreign key constraints to allow lab deletion
-- Drop and recreate prescriptions foreign key with SET NULL
ALTER TABLE public.prescriptions 
DROP CONSTRAINT IF EXISTS prescriptions_lab_id_fkey;

ALTER TABLE public.prescriptions
ADD CONSTRAINT prescriptions_lab_id_fkey 
FOREIGN KEY (lab_id) REFERENCES public.labs(id) ON DELETE SET NULL;

-- Drop and recreate orders foreign key with SET NULL
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_lab_id_fkey;

ALTER TABLE public.orders
ADD CONSTRAINT orders_lab_id_fkey 
FOREIGN KEY (lab_id) REFERENCES public.labs(id) ON DELETE SET NULL;