-- Create a function to sync profile name changes to related tables
CREATE OR REPLACE FUNCTION public.sync_profile_name_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Update doctors table if user is a doctor
  UPDATE public.doctors
  SET full_name = NEW.full_name
  WHERE user_id = NEW.user_id
    AND (full_name IS DISTINCT FROM NEW.full_name);

  -- Update nurses table if user is a nurse
  UPDATE public.nurses
  SET full_name = NEW.full_name
  WHERE user_id = NEW.user_id
    AND (full_name IS DISTINCT FROM NEW.full_name);

  -- Update medical_stores table (pharmacy owner) if applicable
  UPDATE public.medical_stores
  SET owner_name = NEW.full_name
  WHERE user_id = NEW.user_id
    AND (owner_name IS DISTINCT FROM NEW.full_name);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS trigger_sync_profile_name ON public.profiles;
CREATE TRIGGER trigger_sync_profile_name
  AFTER UPDATE OF full_name ON public.profiles
  FOR EACH ROW
  WHEN (OLD.full_name IS DISTINCT FROM NEW.full_name)
  EXECUTE FUNCTION public.sync_profile_name_changes();

-- Add comment for documentation
COMMENT ON FUNCTION public.sync_profile_name_changes() IS 'Automatically syncs profile name changes to doctors, nurses, and medical_stores tables';