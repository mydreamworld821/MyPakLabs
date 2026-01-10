import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DoctorProfile {
  id: string;
  full_name: string;
  status: string;
  photo_url: string | null;
  specialization?: { name: string } | null;
}

export const useDoctorProfile = () => {
  const { user } = useAuth();
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [isDoctor, setIsDoctor] = useState(false);
  const [isApprovedDoctor, setIsApprovedDoctor] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDoctorProfile = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("doctors")
          .select("id, full_name, status, photo_url, specialization:doctor_specializations(name)")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setDoctorProfile(data);
          setIsDoctor(true);
          setIsApprovedDoctor(data.status === "approved");
        }
      } catch (error) {
        console.error("Error fetching doctor profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctorProfile();
  }, [user]);

  return { doctorProfile, isDoctor, isApprovedDoctor, isLoading };
};
