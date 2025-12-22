import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseSignedUrlOptions {
  bucket?: string;
  expiresIn?: number;
}

export const useSignedUrl = (
  filePath: string | null,
  options: UseSignedUrlOptions = {}
) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { bucket = "prescriptions", expiresIn = 3600 } = options;

  useEffect(() => {
    if (!filePath) {
      setSignedUrl(null);
      return;
    }

    const fetchSignedUrl = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase.functions.invoke("get-signed-url", {
          body: { filePath, bucket, expiresIn },
        });

        if (error) {
          throw error;
        }

        if (data?.signedUrl) {
          setSignedUrl(data.signedUrl);
        } else {
          throw new Error("No signed URL returned");
        }
      } catch (err) {
        console.error("Error fetching signed URL:", err);
        setError(err instanceof Error ? err.message : "Failed to get signed URL");
        setSignedUrl(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSignedUrl();
  }, [filePath, bucket, expiresIn]);

  return { signedUrl, isLoading, error };
};
