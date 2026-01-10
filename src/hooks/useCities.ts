import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Province {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
}

export interface City {
  id: string;
  name: string;
  province_id: string;
  display_order: number;
  is_active: boolean;
  province?: Province;
}

export const useCities = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [citiesRes, provincesRes] = await Promise.all([
          supabase
            .from("cities")
            .select(`*, provinces(*)`)
            .eq("is_active", true)
            .order("display_order", { ascending: true }),
          supabase
            .from("provinces")
            .select("*")
            .eq("is_active", true)
            .order("display_order", { ascending: true })
        ]);

        if (citiesRes.data) {
          setCities(citiesRes.data.map(c => ({
            ...c,
            province: c.provinces as Province
          })));
        }
        if (provincesRes.data) {
          setProvinces(provincesRes.data);
        }
      } catch (error) {
        console.error("Error fetching cities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getCitiesByProvince = (provinceId: string) => {
    return cities.filter(c => c.province_id === provinceId);
  };

  const getCityNames = () => {
    return cities.map(c => c.name);
  };

  return { cities, provinces, loading, getCitiesByProvince, getCityNames };
};

export default useCities;
