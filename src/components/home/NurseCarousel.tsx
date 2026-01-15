import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Star, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface Nurse {
  id: string;
  full_name: string;
  photo_url: string | null;
  experience_years: number | null;
  per_visit_fee: number | null;
  rating: number | null;
  services_offered: string[];
}

const NurseCarousel = () => {
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNurses = async () => {
      const { data } = await supabase
        .from("nurses")
        .select("id, full_name, photo_url, experience_years, per_visit_fee, rating, services_offered")
        .eq("status", "approved")
        .eq("is_featured", true)
        .order("featured_order", { ascending: true })
        .limit(10);

      if (data && data.length > 0) {
        setNurses(data);
      } else {
        const { data: fallback } = await supabase
          .from("nurses")
          .select("id, full_name, photo_url, experience_years, per_visit_fee, rating, services_offered")
          .eq("status", "approved")
          .order("rating", { ascending: false })
          .limit(10);
        if (fallback) setNurses(fallback);
      }
      setLoading(false);
    };
    fetchNurses();
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

  if (nurses.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-bold text-foreground">Home Nurses</h2>
        <Link 
          to="/find-nurses" 
          className="text-xs font-medium text-primary flex items-center gap-0.5 hover:underline"
        >
          See all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
        <CarouselContent className="-ml-3">
          {nurses.map((nurse) => (
            <CarouselItem key={nurse.id} className="pl-3 basis-[160px] md:basis-[180px]">
              <Link to={`/nurse/${nurse.id}`} className="block">
                <div className="bg-gradient-to-br from-rose-500 to-rose-400 rounded-2xl p-3 text-white hover:shadow-xl transition-all duration-300 h-full">
                  <div className="w-16 h-16 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-2 overflow-hidden border-2 border-white/30">
                    {nurse.photo_url ? (
                      <img 
                        src={nurse.photo_url} 
                        alt={nurse.full_name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <User className="w-8 h-8 text-white/70" />
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-center line-clamp-1 mb-0.5">
                    {nurse.full_name}
                  </h3>
                  <div className="flex flex-wrap justify-center gap-1 mb-1.5">
                    {nurse.services_offered?.slice(0, 2).map((service, idx) => (
                      <Badge 
                        key={idx} 
                        variant="secondary" 
                        className="text-[8px] px-1 py-0 bg-white/20 text-white border-0"
                      >
                        {service}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-2 text-[10px]">
                    {nurse.rating && nurse.rating > 0 && (
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {nurse.rating.toFixed(1)}
                      </div>
                    )}
                    <span className="text-white/70">
                      {nurse.experience_years || 0}y exp
                    </span>
                  </div>
                  {nurse.per_visit_fee && (
                    <p className="text-center font-bold text-sm mt-2">
                      Rs. {nurse.per_visit_fee.toLocaleString()}/visit
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

export default NurseCarousel;
