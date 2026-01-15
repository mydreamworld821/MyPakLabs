import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Clock, UserRound } from "lucide-react";
import { PageLayoutSettings } from "@/hooks/usePageLayoutSettings";

interface Doctor {
  id: string;
  full_name: string;
  photo_url: string | null;
  qualification: string | null;
  experience_years: number | null;
  consultation_fee: number | null;
  city: string | null;
  clinic_name: string | null;
  availability: string | null;
  rating: number | null;
  review_count: number | null;
  specialization?: { name: string } | null;
}

interface DoctorListCardProps {
  doctor: Doctor;
  settings?: PageLayoutSettings;
  consultationType?: string | null;
}

const DoctorListCard = ({ doctor, settings, consultationType }: DoctorListCardProps) => {
  const cardPadding = settings?.card_padding ?? 20;
  const cardBorderRadius = settings?.card_border_radius ?? 16;
  const cardMinHeight = settings?.card_min_height ?? 280;
  const cardShadow = settings?.card_shadow ?? "md";
  const logoSize = settings?.logo_size ?? 120;
  const logoBorderRadius = settings?.logo_border_radius ?? 60;
  const showLogoBorder = settings?.show_logo_border ?? false;
  const showDescription = settings?.show_description ?? true;
  const showRating = settings?.show_rating ?? true;
  const primaryButtonText = settings?.primary_button_text ?? "Book Appointment";
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
      className={`hover:shadow-lg transition-shadow overflow-hidden ${getShadowClass()}`}
      style={{
        borderRadius: `${cardBorderRadius}px`,
        minHeight: `${cardMinHeight}px`,
      }}
    >
      <CardContent className="p-0" style={{ padding: `${cardPadding}px` }}>
        <div className="flex flex-col items-center text-center">
          {/* Photo */}
          <div 
            className="bg-primary/10 flex items-center justify-center overflow-hidden mb-3"
            style={{
              width: `${logoSize}px`,
              height: `${logoSize}px`,
              borderRadius: `${logoBorderRadius}px`,
              border: showLogoBorder ? "3px solid hsl(var(--primary))" : "none",
            }}
          >
            {doctor.photo_url ? (
              <img
                src={doctor.photo_url}
                alt={doctor.full_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserRound 
                className="text-primary" 
                style={{ width: `${logoSize * 0.4}px`, height: `${logoSize * 0.4}px` }}
              />
            )}
          </div>

          {/* Name & Specialty */}
          <h3 className="font-semibold text-foreground mb-1">{doctor.full_name}</h3>
          <p className="text-xs text-primary mb-1">{doctor.specialization?.name}</p>
          <p className="text-xs text-muted-foreground">{doctor.qualification}</p>

          {/* Rating */}
          {showRating && doctor.rating && doctor.rating > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium">{doctor.rating}</span>
              {doctor.review_count && (
                <span className="text-xs text-muted-foreground">
                  ({doctor.review_count})
                </span>
              )}
            </div>
          )}

          {/* Info */}
          {showDescription && (
            <div className="flex flex-wrap justify-center gap-2 mt-2 text-xs text-muted-foreground">
              {doctor.experience_years && (
                <Badge variant="secondary" className="text-[10px]">
                  {doctor.experience_years} yrs exp
                </Badge>
              )}
              {doctor.city && (
                <span className="flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" />
                  {doctor.city}
                </span>
              )}
            </div>
          )}

          {/* Fee */}
          <p className="text-sm font-semibold text-primary mt-3">
            Rs. {doctor.consultation_fee?.toLocaleString()}
          </p>

          {/* Buttons */}
          <div className="flex flex-col gap-2 mt-3 w-full">
            <Link to={`/doctor/${doctor.id}`} className="w-full">
              <Button 
                className="w-full"
                style={{ minWidth: `${buttonWidth}px` }}
              >
                {primaryButtonText}
              </Button>
            </Link>
            {secondaryButtonText && (
              <Link to={`/doctor/${doctor.id}`} className="w-full">
                <Button 
                  variant="outline" 
                  className="w-full"
                  style={{ minWidth: `${buttonWidth}px` }}
                >
                  {secondaryButtonText}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DoctorListCard;
