import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Building2 } from "lucide-react";

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

interface LabListCardProps {
  lab: Lab;
}

const LabListCard = ({ lab }: LabListCardProps) => {
  const discount = lab.discount_percentage || 0;
  const cities = lab.cities || [];
  const branches = Array.isArray(lab.branches) ? lab.branches as any[] : [];

  return (
    <Card className="p-4 md:p-6 hover:shadow-lg transition-shadow">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        {/* Logo */}
        <div className="flex-shrink-0 flex items-center justify-center">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden border-2 border-border">
            {lab.logo_url ? (
              <img 
                src={lab.logo_url} 
                alt={lab.name}
                className="max-w-full max-h-full object-contain p-2"
              />
            ) : (
              <Building2 className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Lab Info */}
        <div className="flex-1 min-w-0">
          <Link to={`/labs/${lab.id}`} className="hover:underline">
            <h3 className="text-lg md:text-xl font-semibold text-primary mb-1">
              {lab.name}
            </h3>
          </Link>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mb-2">
            {branches.length > 0 && (
              <span className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {branches.length} Branch{branches.length !== 1 ? 'es' : ''}
              </span>
            )}
            {cities.length > 0 && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Available in {cities.length} Cit{cities.length !== 1 ? 'ies' : 'y'}
              </span>
            )}
          </div>

          {/* Rating */}
          {lab.rating && (
            <div className="flex items-center gap-1 mb-2">
              <Star className="w-4 h-4 fill-medical-orange text-medical-orange" />
              <span className="text-sm font-medium">{lab.rating}</span>
              {lab.review_count && (
                <span className="text-xs text-muted-foreground">
                  ({lab.review_count.toLocaleString()} reviews)
                </span>
              )}
            </div>
          )}

          {/* Description - only on larger screens */}
          {lab.description && (
            <p className="hidden md:block text-sm text-muted-foreground line-clamp-2">
              {lab.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-2 sm:gap-3 flex-shrink-0">
          {discount > 0 && (
            <Badge variant="outline" className="text-primary border-primary font-medium">
              Avail Discount: <span className="font-bold ml-1">{discount}% OFF</span>
            </Badge>
          )}
          
          <Link to={`/labs/${lab.id}`} className="w-full sm:w-auto">
            <Button className="w-full sm:w-40">
              Get Discount
            </Button>
          </Link>
          
          <Link to={`/labs/${lab.id}`} className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-40">
              View Test Prices
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};

export default LabListCard;
