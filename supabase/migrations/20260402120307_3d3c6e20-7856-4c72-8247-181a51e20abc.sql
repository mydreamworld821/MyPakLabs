
CREATE OR REPLACE FUNCTION public.increment_download_count(version_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE app_versions SET download_count = download_count + 1 WHERE id = version_id;
END;
$$;
