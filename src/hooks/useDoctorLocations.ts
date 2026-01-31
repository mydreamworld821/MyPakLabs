import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DoctorPracticeLocation {
  id: string;
  type: 'hospital_doctor' | 'practice_location' | 'custom' | 'hospital';
  hospital_id?: string;
  location_name: string;
  address: string | null;
  city: string | null;
  contact_phone: string | null;
  consultation_fee: number;
  followup_fee: number | null;
  available_days: string[];
  available_time_start: string;
  available_time_end: string;
  appointment_duration: number;
  is_primary: boolean;
}

interface UseDoctorLocationsResult {
  locations: DoctorPracticeLocation[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useDoctorLocations = (doctorId: string | undefined): UseDoctorLocationsResult => {
  const [locations, setLocations] = useState<DoctorPracticeLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = async () => {
    if (!doctorId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch hospital_doctors with scheduling info
      const { data: hospitalDoctors, error: hdError } = await supabase
        .from("hospital_doctors")
        .select(`
          id,
          hospital_id,
          department,
          consultation_fee,
          followup_fee,
          available_days,
          available_time_start,
          available_time_end,
          appointment_duration,
          contact_phone,
          address,
          city,
          is_primary,
          is_active,
          hospital:hospitals(id, name, address, city, contact_phone)
        `)
        .eq("doctor_id", doctorId)
        .eq("is_current", true)
        .eq("is_active", true);

      if (hdError) throw hdError;

      // Fetch custom practice locations
      const { data: practiceLocations, error: plError } = await supabase
        .from("doctor_practice_locations")
        .select("*")
        .eq("doctor_id", doctorId)
        .eq("is_active", true);

      if (plError) throw plError;

      // Combine and format locations
      const allLocations: DoctorPracticeLocation[] = [];

      // Add hospital locations (only if they have scheduling info)
      (hospitalDoctors || []).forEach((hd: any) => {
        if (hd.consultation_fee && hd.available_days?.length > 0) {
          allLocations.push({
            id: hd.id,
            type: 'hospital_doctor',
            hospital_id: hd.hospital_id,
            location_name: hd.hospital?.name || 'Unknown Hospital',
            address: hd.address || hd.hospital?.address || null,
            city: hd.city || hd.hospital?.city || null,
            contact_phone: hd.contact_phone || hd.hospital?.contact_phone || null,
            consultation_fee: hd.consultation_fee,
            followup_fee: hd.followup_fee,
            available_days: hd.available_days || [],
            available_time_start: hd.available_time_start || '09:00',
            available_time_end: hd.available_time_end || '17:00',
            appointment_duration: hd.appointment_duration || 15,
            is_primary: hd.is_primary || false,
          });
        }
      });

      // Add custom practice locations
      (practiceLocations || []).forEach((pl: any) => {
        allLocations.push({
          id: pl.id,
          type: 'practice_location',
          location_name: pl.location_name,
          address: pl.address,
          city: pl.city,
          contact_phone: pl.contact_phone,
          consultation_fee: pl.consultation_fee,
          followup_fee: pl.followup_fee,
          available_days: pl.available_days || [],
          available_time_start: pl.available_time_start || '09:00',
          available_time_end: pl.available_time_end || '17:00',
          appointment_duration: pl.appointment_duration || 15,
          is_primary: pl.is_primary || false,
        });
      });

      // Sort: primary first, then by name
      allLocations.sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return a.location_name.localeCompare(b.location_name);
      });

      setLocations(allLocations);
    } catch (err: any) {
      console.error("Error fetching doctor locations:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [doctorId]);

  return {
    locations,
    isLoading,
    error,
    refetch: fetchLocations,
  };
};

export default useDoctorLocations;
