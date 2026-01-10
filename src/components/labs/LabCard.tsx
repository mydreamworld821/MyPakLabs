import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, ArrowRight } from "lucide-react";

interface Lab {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  discount_percentage: number | null;
  rating: number | null;
  review_count: number | null;
  cities: string[] | null;
  branches: unknown;
  popular_tests: string[] | null;
}

interface LabCardProps {
  lab: Lab;
}

const LabCard = ({ lab }: LabCardProps) => {
  const discount = lab.discount_percentage || 0;
  const cities = lab.cities || [];
  const popularTests = lab.popular_tests || [];

  return (
    <Link to={`/labs/${lab.id}`} className="block">
      <Card variant="interactive" className="overflow-hidden group cursor-pointer h-full relative">
        {/* Header with Logo/Discount - Compact */}
        <div className="relative h-20 gradient-hero flex items-center justify-center">
          {lab.logo_url ? (
            <img 
              src={lab.logo_url} 
              alt={lab.name}
              className="w-12 h-12 object-contain rounded-lg bg-white p-1"
            />
          ) : (
            <div className="text-center text-primary-foreground">
              <div className="text-2xl font-bold">{discount}%</div>
              <div className="text-[10px] opacity-90">OFF</div>
            </div>
          )}
          {discount > 0 && (
            <Badge 
              variant="discount" 
              className="absolute top-1.5 right-1.5 bg-card/95 backdrop-blur text-[10px] px-1.5 py-0.5"
            >
              {discount}% OFF
            </Badge>
          )}
        </div>

        <CardContent className="p-3">
          <div className="space-y-2">
            {/* Lab Name */}
            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {lab.name}
            </h3>
            
            {/* Rating & City */}
            <div className="flex items-center gap-2 flex-wrap">
              {lab.rating && (
                <div className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-medical-orange text-medical-orange" />
                  <span className="text-xs font-medium">{lab.rating}</span>
                </div>
              )}
              {cities.length > 0 && (
                <div className="flex items-center gap-0.5 text-muted-foreground">
                  <MapPin className="w-2.5 h-2.5" />
                  <span className="text-[10px]">{cities[0]}</span>
                </div>
              )}
            </div>

            {/* Discount Badge */}
            {discount > 0 && (
              <div className="text-[10px] text-primary font-medium">
                Save up to {discount}%
              </div>
            )}
          </div>
        </CardContent>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-3">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground line-clamp-2">
              {lab.name}
            </h3>
            
            {/* Popular Tests */}
            {popularTests.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground font-medium">Popular Tests:</span>
                <div className="flex flex-wrap gap-1">
                  {popularTests.slice(0, 3).map((test) => (
                    <Badge key={test} variant="secondary" className="text-[9px] px-1.5 py-0">
                      {test}
                    </Badge>
                  ))}
                  {popularTests.length > 3 && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                      +{popularTests.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Rating on hover */}
            {lab.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-medical-orange text-medical-orange" />
                <span className="text-xs font-medium">{lab.rating}</span>
                {lab.review_count && (
                  <span className="text-[10px] text-muted-foreground">
                    ({lab.review_count.toLocaleString()} reviews)
                  </span>
                )}
              </div>
            )}
          </div>

          <Button size="sm" className="w-full text-xs h-7 mt-2">
            View Details
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </Card>
    </Link>
  );
};

export default LabCard;
