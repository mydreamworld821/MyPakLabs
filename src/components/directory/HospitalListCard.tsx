import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Star, MapPin, Clock, Phone } from "lucide-react";
import { PageLayoutSettings } from "@/hooks/usePageLayoutSettings";

interface Hospital {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  address: string | null;
  specialties: string[] | null;
  departments: string[] | null;
  contact_phone: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  description: string | null;
  rating: number | null;
  review_count: number | null;
  opening_time: string | null;
  closing_time: string | null;
  emergency_available: boolean | null;
}

interface HospitalListCardProps {
  hospital: Hospital;
  settings?: PageLayoutSettings;
}

const HospitalListCard = ({ hospital, settings }: HospitalListCardProps) => {
  const cardPadding = settings?.card_padding ?? 24;
  const cardBorderRadius = settings?.card_border_radius ?? 12;
  const cardMinHeight = settings?.card_min_height ?? 140;
  const cardShadow = settings?.card_shadow ?? "md";
  const logoSize = settings?.logo_size ?? 80;
  const logoBorderRadius = settings?.logo_border_radius ?? 8;
  const showLogoBorder = settings?.show_logo_border ?? true;
  const showDescription = settings?.show_description ?? true;
  const showRating = settings?.show_rating ?? true;
  const showBranchCount = settings?.show_branch_count ?? true;
  const descriptionLines = settings?.description_lines ?? 2;
  const primaryButtonText = settings?.primary_button_text ?? "View Details";
  const secondaryButtonText = settings?.secondary_button_text ?? "Contact";
  const buttonWidth = settings?.button_width ?? 150;

  const getShadowClass = () => {
    switch (cardShadow) {
      case "none": return "";
      case "sm": return "shadow-sm";
      case "lg": return "shadow-lg";
      default: return "shadow-md";
    }
  };

  return (
    <Card 
      className={`hover:shadow-lg transition-shadow overflow-hidden ${getShadowClass()}`}
      style={{
        borderRadius: `${cardBorderRadius}px`,
        minHeight: `${cardMinHeight}px`,
      }}
    >
      <CardContent className="p-0" style={{ padding: `${cardPadding}px` }}>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Logo */}
          <div className="flex-shrink-0 flex justify-center sm:justify-start">
            <div 
              className="bg-muted/50 flex items-center justify-center overflow-hidden"
              style={{
                width: `${logoSize}px`,
                height: `${logoSize}px`,
                borderRadius: `${logoBorderRadius}px`,
                border: showLogoBorder ? "2px solid hsl(var(--border))" : "none",
              }}
            >
              {hospital.logo_url ? (
                <img 
                  src={hospital.logo_url} 
                  alt={hospital.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 
                  className="text-muted-foreground" 
                  style={{ width: `${logoSize * 0.4}px`, height: `${logoSize * 0.4}px` }}
                />
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <Link to={`/hospital/${hospital.slug}`} className="hover:underline">
                <h3 className="text-lg font-semibold text-primary">{hospital.name}</h3>
              </Link>
              {hospital.emergency_available && (
                <Badge className="bg-red-500 text-white text-[10px]">24/7 Emergency</Badge>
              )}
            </div>

            {/* Location */}
            {hospital.address && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="line-clamp-1">{hospital.address}</span>
              </div>
            )}

            {/* Rating & Hours */}
            {(showRating || showBranchCount) && (
              <div className="flex items-center gap-3 text-sm mt-2">
                {showRating && hospital.rating && hospital.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{hospital.rating}</span>
                    {hospital.review_count && (
                      <span className="text-muted-foreground">({hospital.review_count})</span>
                    )}
                  </div>
                )}
                {showBranchCount && hospital.opening_time && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs">{hospital.opening_time} - {hospital.closing_time}</span>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {showDescription && hospital.description && (
              <p 
                className="text-sm text-muted-foreground mt-2"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: descriptionLines,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {hospital.description}
              </p>
            )}

            {/* Departments */}
            {hospital.departments && hospital.departments.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {hospital.departments.slice(0, 4).map((dept) => (
                  <Badge key={dept} variant="outline" className="text-xs px-2 py-0">
                    {dept}
                  </Badge>
                ))}
                {hospital.departments.length > 4 && (
                  <Badge variant="secondary" className="text-xs px-2 py-0">
                    +{hospital.departments.length - 4}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <Link to={`/hospital/${hospital.slug}`}>
              <Button 
                className="w-full sm:w-auto"
                style={{ minWidth: `${buttonWidth}px` }}
              >
                {primaryButtonText}
              </Button>
            </Link>
            {secondaryButtonText && hospital.contact_phone && (
              <a href={`tel:${hospital.contact_phone}`}>
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto"
                  style={{ minWidth: `${buttonWidth}px` }}
                >
                  <Phone className="w-4 h-4 mr-1" />
                  {secondaryButtonText}
                </Button>
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HospitalListCard;
