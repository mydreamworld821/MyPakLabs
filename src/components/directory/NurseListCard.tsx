import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Star, MapPin, Clock, Phone } from "lucide-react";
import { PageLayoutSettings } from "@/hooks/usePageLayoutSettings";

interface Nurse {
  id: string;
  full_name: string;
  photo_url: string | null;
  qualification: string;
  experience_years: number;
  city: string;
  area_of_service: string | null;
  services_offered: string[];
  available_shifts: string[];
  emergency_available: boolean;
  per_visit_fee: number;
  per_hour_fee: number | null;
  rating: number;
  review_count: number;
  gender: string;
}

interface NurseListCardProps {
  nurse: Nurse;
  settings?: PageLayoutSettings;
}

const NurseListCard = ({ nurse, settings }: NurseListCardProps) => {
  const cardPadding = settings?.card_padding ?? 20;
  const cardBorderRadius = settings?.card_border_radius ?? 16;
  const cardMinHeight = settings?.card_min_height ?? 300;
  const cardShadow = settings?.card_shadow ?? "md";
  const logoSize = settings?.logo_size ?? 100;
  const logoBorderRadius = settings?.logo_border_radius ?? 50;
  const showLogoBorder = settings?.show_logo_border ?? false;
  const showDescription = settings?.show_description ?? true;
  const showRating = settings?.show_rating ?? true;
  const descriptionLines = settings?.description_lines ?? 2;
  const primaryButtonText = settings?.primary_button_text ?? "Book Nurse";
  const secondaryButtonText = settings?.secondary_button_text ?? "View Profile";
  const buttonWidth = settings?.button_width ?? 140;

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
      className={`hover:shadow-lg transition-shadow h-full ${getShadowClass()}`}
      style={{
        borderRadius: `${cardBorderRadius}px`,
        minHeight: `${cardMinHeight}px`,
      }}
    >
      <CardContent className="p-0" style={{ padding: `${cardPadding}px` }}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex gap-3 mb-3">
            <div 
              className="bg-rose-100 flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{
                width: `${logoSize}px`,
                height: `${logoSize}px`,
                borderRadius: `${logoBorderRadius}px`,
                border: showLogoBorder ? "3px solid hsl(var(--primary))" : "none",
              }}
            >
              {nurse.photo_url ? (
                <img 
                  src={nurse.photo_url} 
                  alt={nurse.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Heart 
                  className="text-rose-600" 
                  style={{ width: `${logoSize * 0.3}px`, height: `${logoSize * 0.3}px` }}
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold truncate">{nurse.full_name}</h3>
              <p className="text-xs text-muted-foreground">{nurse.qualification}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-[10px]">
                  {nurse.experience_years} yrs exp
                </Badge>
                {nurse.emergency_available && (
                  <Badge variant="destructive" className="text-[10px]">
                    Emergency
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Details */}
          {showDescription && (
            <div className="space-y-1.5 mb-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>{nurse.city}{nurse.area_of_service ? `, ${nurse.area_of_service}` : ""}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{nurse.available_shifts?.join(", ") || "Flexible"}</span>
              </div>
              {showRating && (
                <div className="flex items-center gap-1.5 text-xs">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span>{nurse.rating || "New"}</span>
                  <span className="text-muted-foreground">
                    ({nurse.review_count || 0} reviews)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Services */}
          <div className="flex flex-wrap gap-1 mb-3">
            {nurse.services_offered?.slice(0, 3).map((service, idx) => (
              <Badge key={idx} variant="outline" className="text-[10px] px-1.5">
                {service.split(" ")[0]}
              </Badge>
            ))}
            {nurse.services_offered?.length > 3 && (
              <Badge variant="outline" className="text-[10px] px-1.5">
                +{nurse.services_offered.length - 3}
              </Badge>
            )}
          </div>

          {/* Footer */}
          <div className="mt-auto pt-3 border-t flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Per Visit</p>
              <p className="text-sm font-bold text-rose-600">
                PKR {nurse.per_visit_fee?.toLocaleString()}
              </p>
            </div>
            <Link to={`/nurse/${nurse.id}`}>
              <Button 
                size="sm" 
                className="text-xs bg-rose-600 hover:bg-rose-700"
                style={{ minWidth: `${buttonWidth}px` }}
              >
                <Phone className="w-3 h-3 mr-1" />
                {primaryButtonText}
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NurseListCard;
