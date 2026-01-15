import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FlaskConical, Star, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface Lab {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  rating: number | null;
  discount_percentage: number | null;
}

const LabCarousel = () => {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLabs = async () => {
      const { data } = await supabase
        .from("labs")
        .select("id, name, slug, logo_url, rating, discount_percentage")
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("featured_order", { ascending: true })
        .limit(8);

      if (data && data.length > 0) {
        setLabs(data);
      } else {
        const { data: fallback } = await supabase
          .from("labs")
          .select("id, name, slug, logo_url, rating, discount_percentage")
          .eq("is_active", true)
          .order("rating", { ascending: false })
          .limit(8);
        if (fallback) setLabs(fallback);
      }
      setLoading(false);
    };
    fetchLabs();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-24 bg-muted rounded animate-pulse" />
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-28 h-32 bg-muted rounded-2xl animate-pulse shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (labs.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-bold text-foreground">Featured Labs</h2>
        <Link 
          to="/labs" 
          className="text-xs font-medium text-primary flex items-center gap-0.5 hover:underline"
        >
          See all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      
      <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
        <CarouselContent className="-ml-2">
          {labs.map((lab) => (
            <CarouselItem key={lab.id} className="pl-2 basis-[120px] md:basis-[140px]">
              <Link to={`/lab/${lab.slug}`} className="block">
                <div className="bg-card border border-border/50 rounded-2xl p-3 hover:shadow-lg hover:border-primary/30 transition-all duration-300 h-full">
                  <div className="w-14 h-14 mx-auto rounded-xl bg-muted/50 flex items-center justify-center mb-2 overflow-hidden">
                    {lab.logo_url ? (
                      <img 
                        src={lab.logo_url} 
                        alt={lab.name} 
                        className="w-full h-full object-contain p-1" 
                      />
                    ) : (
                      <FlaskConical className="w-7 h-7 text-primary" />
                    )}
                  </div>
                  <h3 className="font-semibold text-xs text-center line-clamp-2 mb-1.5 leading-tight">
                    {lab.name}
                  </h3>
                  <div className="flex items-center justify-center gap-1.5">
                    {lab.rating && (
                      <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {lab.rating}
                      </div>
                    )}
                    {lab.discount_percentage && lab.discount_percentage > 0 && (
                      <Badge className="text-[9px] px-1.5 py-0 h-4 bg-green-500 hover:bg-green-500">
                        {lab.discount_percentage}% OFF
                      </Badge>
                    )}
                  </div>
                </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default LabCarousel;
