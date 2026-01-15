import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { HomepageSection } from "@/hooks/useHomepageSections";

interface ConfigurableSectionProps {
  config: HomepageSection | null;
  children: ReactNode;
  viewAllLink?: string;
  className?: string;
  loading?: boolean;
}

const ConfigurableSection = ({ 
  config, 
  children, 
  viewAllLink, 
  className = "",
  loading = false
}: ConfigurableSectionProps) => {
  if (!config || !config.is_visible) return null;

  const sectionStyle: React.CSSProperties = {
    paddingTop: `${config.section_padding_y}px`,
    paddingBottom: `${config.section_padding_y}px`,
  };

  const backgroundClass = config.background_gradient 
    ? `bg-gradient-to-r ${config.background_gradient}` 
    : config.background_color !== 'transparent' 
      ? '' 
      : '';

  const backgroundStyle: React.CSSProperties = {
    backgroundColor: config.background_color !== 'transparent' ? config.background_color : undefined,
  };

  const textColorStyle: React.CSSProperties = {
    color: config.text_color !== 'inherit' ? config.text_color : undefined,
  };

  // Generate grid classes based on config
  const getGridClasses = () => {
    const colsMap: Record<number, string> = {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
      5: "grid-cols-5",
      6: "grid-cols-6",
    };
    const mdColsMap: Record<number, string> = {
      1: "md:grid-cols-1",
      2: "md:grid-cols-2",
      3: "md:grid-cols-3",
      4: "md:grid-cols-4",
      5: "md:grid-cols-5",
      6: "md:grid-cols-6",
    };
    const lgColsMap: Record<number, string> = {
      1: "lg:grid-cols-1",
      2: "lg:grid-cols-2",
      3: "lg:grid-cols-3",
      4: "lg:grid-cols-4",
      5: "lg:grid-cols-5",
      6: "lg:grid-cols-6",
    };

    return `grid ${colsMap[config.columns_mobile] || "grid-cols-1"} ${mdColsMap[config.columns_tablet] || "md:grid-cols-2"} ${lgColsMap[config.columns_desktop] || "lg:grid-cols-4"}`;
  };

  return (
    <section 
      className={`${backgroundClass} ${className}`} 
      style={{ ...sectionStyle, ...backgroundStyle }}
    >
      <div className="container mx-auto px-4" style={textColorStyle}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base md:text-lg font-semibold">
              {config.title}
            </h2>
            {config.subtitle && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {config.subtitle}
              </p>
            )}
          </div>
          {viewAllLink && (
            <Link 
              to={viewAllLink} 
              className="text-primary text-sm font-medium flex items-center gap-1 hover:underline"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {loading ? (
          <div 
            className={getGridClasses()} 
            style={{ gap: `${config.items_gap}px` }}
          >
            {[...Array(config.max_items)].map((_, i) => (
              <div 
                key={i} 
                className="bg-muted rounded-lg animate-pulse"
                style={{ 
                  height: `${config.card_height}px`,
                  borderRadius: `${config.card_border_radius}px`
                }}
              />
            ))}
          </div>
        ) : (
          <div 
            className={config.section_type === 'grid' ? getGridClasses() : 'flex overflow-x-auto gap-4 pb-2 scrollbar-hide'} 
            style={{ gap: `${config.items_gap}px` }}
          >
            {children}
          </div>
        )}
      </div>
    </section>
  );
};

export default ConfigurableSection;

// Helper component for configurable cards
export interface ConfigurableCardProps {
  config: HomepageSection | null;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const ConfigurableCard = ({ config, children, className = "", onClick }: ConfigurableCardProps) => {
  if (!config) return <div className={className}>{children}</div>;

  const shadowClass = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
  }[config.card_shadow] || "shadow-md";

  return (
    <div 
      className={`bg-card border overflow-hidden hover:shadow-lg transition-all duration-300 ${shadowClass} ${className}`}
      style={{
        height: config.card_height ? `${config.card_height}px` : 'auto',
        borderRadius: `${config.card_border_radius}px`,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// Helper for configurable images
export interface ConfigurableImageProps {
  config: HomepageSection | null;
  src: string;
  alt: string;
  className?: string;
  fallback?: ReactNode;
}

export const ConfigurableImage = ({ config, src, alt, className = "", fallback }: ConfigurableImageProps) => {
  if (!config) {
    return src ? (
      <img src={src} alt={alt} className={className} />
    ) : (
      <>{fallback}</>
    );
  }

  const imageStyle: React.CSSProperties = {
    height: config.image_height ? `${config.image_height}px` : 'auto',
    width: config.image_width === 'full' ? '100%' : config.image_width,
    objectPosition: `${config.image_position_x}% ${config.image_position_y}%`,
    objectFit: config.image_fit as React.CSSProperties['objectFit'],
    borderRadius: `${config.image_border_radius}px`,
  };

  if (!src) {
    return <div style={imageStyle} className={`bg-muted flex items-center justify-center ${className}`}>{fallback}</div>;
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className={`object-cover ${className}`}
      style={imageStyle}
      onError={(e) => {
        if (fallback) {
          e.currentTarget.style.display = 'none';
        }
      }}
    />
  );
};
