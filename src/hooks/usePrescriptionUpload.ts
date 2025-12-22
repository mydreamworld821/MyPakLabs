import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UploadResult {
  path: string;
  fullPath: string;
}

export const usePrescriptionUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadPrescription = async (file: File): Promise<UploadResult | null> => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        toast.error("Please sign in to upload prescriptions");
        return null;
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to storage
      const { data, error: uploadError } = await supabase.storage
        .from('prescriptions')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error("Failed to upload prescription");
        return null;
      }

      setUploadProgress(100);
      toast.success("Prescription uploaded successfully");

      return {
        path: filePath,
        fullPath: data.path,
      };
    } catch (error) {
      console.error('Unexpected upload error:', error);
      toast.error("An error occurred while uploading");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const deletePrescription = async (filePath: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from('prescriptions')
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        toast.error("Failed to delete prescription");
        return false;
      }

      toast.success("Prescription removed");
      return true;
    } catch (error) {
      console.error('Unexpected delete error:', error);
      toast.error("An error occurred while deleting");
      return false;
    }
  };

  return {
    uploadPrescription,
    deletePrescription,
    isUploading,
    uploadProgress,
  };
};
