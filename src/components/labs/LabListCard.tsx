import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Building2 } from "lucide-react";
import { PageLayoutSettings } from "@/hooks/usePageLayoutSettings";

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
  settings?: PageLayoutSettings;
}

const LabListCard = ({ lab, settings }: LabListCardProps) => {
  const discount = lab.discount_percentage || 0;
  const cities = lab.cities || [];
  const branches = Array.isArray(lab.branches) ? lab.branches as any[] : [];

  // Default values if settings not provided
  const cardPadding = settings?.card_padding ?? 24;
  const cardBorderRadius = settings?.card_border_radius ?? 12;
  const cardMinHeight = settings?.card_min_height ?? 120;
  const cardShadow = settings?.card_shadow ?? "md";
  const logoSize = settings?.logo_size ?? 96;
  const logoBorderRadius = settings?.logo_border_radius ?? 8;
  const showLogoBorder = settings?.show_logo_border ?? true;
  const showDescription = settings?.show_description ?? true;
  const showRating = settings?.show_rating ?? true;
  const showBranchCount = settings?.show_branch_count ?? true;
  const descriptionLines = settings?.description_lines ?? 2;
  const primaryButtonText = settings?.primary_button_text ?? "Get Discount";
  const secondaryButtonText = settings?.secondary_button_text ?? "View Test Prices";
  const buttonWidth = settings?.button_width ?? 160;

  const getShadowStyle = () => {
    switch (cardShadow) {
      case "none": return "shadow-none";
      case "sm": return "shadow-sm";
      case "lg": return "shadow-lg";
      default: return "shadow-md";
    }
  };

  return (
    <Card 
      className={`hover:shadow-lg transition-shadow ${getShadowStyle()}`}
      style={{
        padding: `${cardPadding}px`,
        borderRadius: `${cardBorderRadius}px`,
        minHeight: `${cardMinHeight}px`,
      }}
    >
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        {/* Logo */}
        <div className="flex-shrink-0 flex items-center justify-center">
          <div 
            className="bg-muted/50 flex items-center justify-center overflow-hidden"
            style={{
              width: `${logoSize}px`,
              height: `${logoSize}px`,
              borderRadius: `${logoBorderRadius}px`,
              border: showLogoBorder ? "2px solid hsl(var(--border))" : "none",
            }}
          >
            {lab.logo_url ? (
              <img 
                src={lab.logo_url} 
                alt={lab.name}
                className="max-w-full max-h-full object-contain p-2"
              />
            ) : (
              <Building2 
                className="text-muted-foreground" 
                style={{ 
                  width: `${logoSize * 0.4}px`, 
                  height: `${logoSize * 0.4}px` 
                }} 
              />
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
          
          {showBranchCount && (branches.length > 0 || cities.length > 0) && (
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
          )}

          {/* Rating */}
          {showRating && lab.rating && (
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

          {/* Description */}
          {showDescription && lab.description && (
            <p 
              className="hidden md:block text-sm text-muted-foreground"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: descriptionLines,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
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
            <Button 
              className="w-full"
              style={{ width: window.innerWidth >= 640 ? `${buttonWidth}px` : '100%' }}
            >
              {primaryButtonText}
            </Button>
          </Link>
          
          {secondaryButtonText && (
            <Link to={`/labs/${lab.id}`} className="w-full sm:w-auto">
              <Button 
                variant="outline" 
                className="w-full"
                style={{ width: window.innerWidth >= 640 ? `${buttonWidth}px` : '100%' }}
              >
                {secondaryButtonText}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
};

export default LabListCard;