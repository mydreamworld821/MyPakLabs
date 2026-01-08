import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, ArrowRight, Building2 } from "lucide-react";

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
  const branches = Array.isArray(lab.branches) ? lab.branches as any[] : [];
  const popularTests = lab.popular_tests || [];
  const cities = lab.cities || [];

  return (
    <Link to={`/labs/${lab.id}`} className="block">
      <Card variant="interactive" className="overflow-hidden group cursor-pointer">
        {/* Header with Logo/Discount */}
        <div className="relative h-32 gradient-hero flex items-center justify-center">
          {lab.logo_url ? (
            <img 
              src={lab.logo_url} 
              alt={lab.name}
              className="w-20 h-20 object-contain rounded-lg bg-white p-2"
            />
          ) : (
            <div className="text-center text-primary-foreground">
              <div className="text-4xl font-bold">{discount}%</div>
              <div className="text-sm opacity-90">DISCOUNT</div>
            </div>
          )}
          {discount > 0 && (
            <Badge 
              variant="discount" 
              className="absolute top-3 right-3 bg-card/95 backdrop-blur"
            >
              Save up to {discount}%
            </Badge>
          )}
        </div>

        <CardContent className="p-5">
          <div className="space-y-4">
            {/* Lab Name & Rating */}
            <div>
              <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                {lab.name}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                {lab.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-medical-orange text-medical-orange" />
                    <span className="text-sm font-semibold">{lab.rating}</span>
                    {lab.review_count && (
                      <span className="text-xs text-muted-foreground">({lab.review_count.toLocaleString()})</span>
                    )}
                  </div>
                )}
                {cities.length > 0 && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span className="text-xs">{cities[0]}{cities.length > 1 ? ` +${cities.length - 1}` : ''}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {lab.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {lab.description}
              </p>
            )}

            {/* Popular Tests */}
            {popularTests.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {popularTests.slice(0, 3).map((test) => (
                  <Badge key={test} variant="secondary" className="text-xs">
                    {test}
                  </Badge>
                ))}
                {popularTests.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{popularTests.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {/* Discount Availability */}
            {discount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                <MapPin className="w-3 h-3" />
                <span>Discount available across Pakistan</span>
              </div>
            )}

            {/* CTA */}
            <Button className="w-full group/btn">
              View Details & Book Tests
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default LabCard;
