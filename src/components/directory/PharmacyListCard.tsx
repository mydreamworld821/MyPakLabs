import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Store, Star, MapPin, Clock, Truck, Phone } from "lucide-react";
import { PageLayoutSettings } from "@/hooks/usePageLayoutSettings";

interface MedicalStore {
  id: string;
  name: string;
  logo_url: string | null;
  city: string;
  area: string;
  full_address: string;
  phone: string;
  delivery_available: boolean;
  is_24_hours: boolean;
  opening_time: string;
  closing_time: string;
  rating: number;
  review_count: number;
  is_featured: boolean;
}

interface PharmacyListCardProps {
  store: MedicalStore;
  settings?: PageLayoutSettings;
}

const PharmacyListCard = ({ store, settings }: PharmacyListCardProps) => {
  const navigate = useNavigate();
  
  const cardPadding = settings?.card_padding ?? 24;
  const cardBorderRadius = settings?.card_border_radius ?? 12;
  const cardMinHeight = settings?.card_min_height ?? 120;
  const cardShadow = settings?.card_shadow ?? "md";
  const logoSize = settings?.logo_size ?? 72;
  const logoBorderRadius = settings?.logo_border_radius ?? 8;
  const showLogoBorder = settings?.show_logo_border ?? true;
  const showDescription = settings?.show_description ?? true;
  const showRating = settings?.show_rating ?? true;
  const showBranchCount = settings?.show_branch_count ?? true;
  const primaryButtonText = settings?.primary_button_text ?? "Order Medicine";
  const secondaryButtonText = settings?.secondary_button_text ?? "View Details";
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
      className={`cursor-pointer hover:shadow-lg transition-shadow ${getShadowClass()}`}
      style={{
        borderRadius: `${cardBorderRadius}px`,
        minHeight: `${cardMinHeight}px`,
      }}
      onClick={() => navigate(`/pharmacy/${store.id}`)}
    >
      <CardContent className="p-0" style={{ padding: `${cardPadding}px` }}>
        <div className="flex gap-3">
          {/* Logo */}
          <div 
            className="bg-emerald-100 flex items-center justify-center overflow-hidden flex-shrink-0"
            style={{
              width: `${logoSize}px`,
              height: `${logoSize}px`,
              borderRadius: `${logoBorderRadius}px`,
              border: showLogoBorder ? "2px solid hsl(var(--border))" : "none",
            }}
          >
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
            ) : (
              <Store 
                className="text-emerald-600" 
                style={{ width: `${logoSize * 0.4}px`, height: `${logoSize * 0.4}px` }}
              />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-sm truncate">{store.name}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {store.area}, {store.city}
                </p>
              </div>
              {store.is_featured && (
                <Badge className="bg-amber-100 text-amber-700 text-[10px]">Featured</Badge>
              )}
            </div>
            
            {showDescription && (
              <div className="flex flex-wrap gap-2 mt-2">
                {showBranchCount && store.delivery_available && (
                  <Badge variant="outline" className="text-[10px] bg-blue-50">
                    <Truck className="w-3 h-3 mr-1" />
                    Delivery
                  </Badge>
                )}
                <Badge variant="outline" className="text-[10px]">
                  <Clock className="w-3 h-3 mr-1" />
                  {store.is_24_hours ? "24/7" : `${store.opening_time} - ${store.closing_time}`}
                </Badge>
                {showRating && store.rating > 0 && (
                  <Badge variant="outline" className="text-[10px]">
                    <Star className="w-3 h-3 mr-1 fill-amber-400 text-amber-400" />
                    {store.rating.toFixed(1)}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-3 flex justify-between items-center">
          <a 
            href={`tel:${store.phone}`} 
            className="text-xs text-primary flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="w-3 h-3" />
            {store.phone}
          </a>
          <Button 
            size="sm" 
            className="h-7 text-xs"
            style={{ minWidth: `${buttonWidth}px` }}
          >
            {primaryButtonText}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PharmacyListCard;
