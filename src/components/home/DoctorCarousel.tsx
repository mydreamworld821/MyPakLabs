import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Star, ChevronRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface Doctor {
  id: string;
  full_name: string;
  photo_url: string | null;
  experience_years: number | null;
  consultation_fee: number | null;
  rating: number | null;
  specialization?: { name: string } | null;
}

const DoctorCarousel = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      const { data } = await supabase
        .from("doctors")
        .select(`
          id, full_name, photo_url, experience_years, 
          consultation_fee, rating, doctor_specializations (name)
        `)
        .eq("status", "approved")
        .eq("is_featured", true)
        .order("featured_order", { ascending: true })
        .limit(10);

      if (data) {
        const formatted = data.map(doc => ({
          ...doc,
          specialization: doc.doctor_specializations
        }));
        setDoctors(formatted);
      }
      setLoading(false);
    };
    fetchDoctors();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-28 bg-muted rounded animate-pulse" />
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-40 h-48 bg-muted rounded-2xl animate-pulse shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (doctors.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-bold text-foreground">Top Doctors</h2>
        <Link 
          to="/find-doctors" 
          className="text-xs font-medium text-primary flex items-center gap-0.5 hover:underline"
        >
          See all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
        <CarouselContent className="-ml-3">
          {doctors.map((doctor) => (
            <CarouselItem key={doctor.id} className="pl-3 basis-[160px] md:basis-[180px]">
              <Link to={`/doctor/${doctor.id}`} className="block">
                <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-3 text-white hover:shadow-xl transition-all duration-300 h-full">
                  <div className="w-16 h-16 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-2 overflow-hidden border-2 border-white/30">
                    {doctor.photo_url ? (
                      <img 
                        src={doctor.photo_url} 
                        alt={doctor.full_name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <User className="w-8 h-8 text-white/70" />
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-center line-clamp-1 mb-0.5">
                    {doctor.full_name}
                  </h3>
                  <p className="text-[10px] text-white/80 text-center line-clamp-1 mb-1.5">
                    {doctor.specialization?.name || "General Physician"}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-[10px]">
                    {doctor.rating && doctor.rating > 0 && (
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {doctor.rating.toFixed(1)}
                      </div>
                    )}
                    <span className="text-white/70">
                      {doctor.experience_years || 0}y exp
                    </span>
                  </div>
                  {doctor.consultation_fee && (
                    <p className="text-center font-bold text-sm mt-2">
                      Rs. {doctor.consultation_fee.toLocaleString()}
                    </p>
                  )}
                </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default DoctorCarousel;
