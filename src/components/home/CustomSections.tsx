import { useHomepageSections, HomepageSection } from "@/hooks/useHomepageSections";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, Layers } from "lucide-react";
import { Link } from "react-router-dom";

interface CustomSectionsProps {
  className?: string;
}

const CustomSections = ({ className = "" }: CustomSectionsProps) => {
  const { sections, loading } = useHomepageSections();

  // Filter only custom sections (those starting with custom_section_)
  const customSections = sections.filter(
    (s) => s.section_key.startsWith("custom_section_") && s.is_visible
  );

  if (loading || customSections.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {customSections.map((section) => (
        <CustomSectionRenderer key={section.id} section={section} />
      ))}
    </div>
  );
};

interface CustomSectionRendererProps {
  section: HomepageSection;
}

const CustomSectionRenderer = ({ section }: CustomSectionRendererProps) => {
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

    return `grid ${colsMap[section.columns_mobile] || "grid-cols-1"} ${mdColsMap[section.columns_tablet] || "md:grid-cols-2"} ${lgColsMap[section.columns_desktop] || "lg:grid-cols-4"}`;
  };

  const shadowClass = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
  }[section.card_shadow] || "shadow-md";

  const sectionStyle: React.CSSProperties = {
    paddingTop: `${section.section_padding_y}px`,
    paddingBottom: `${section.section_padding_y}px`,
    paddingLeft: `${section.section_padding_x}px`,
    paddingRight: `${section.section_padding_x}px`,
    backgroundColor: section.background_color !== 'transparent' ? section.background_color : undefined,
  };

  // Get custom content items if available
  const customContent = section.custom_content as { items?: Array<{ title: string; subtitle?: string; image_url?: string; link?: string }> } | null;
  const items = customContent?.items || [];

  return (
    <div className="mb-8" style={sectionStyle}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 
            className="text-base md:text-lg font-semibold"
            style={{ color: section.text_color !== 'inherit' ? section.text_color : undefined }}
          >
            {section.title}
          </h2>
          {section.subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {section.subtitle}
            </p>
          )}
        </div>
      </div>

      <div 
        className={getGridClasses()} 
        style={{ gap: `${section.items_gap}px` }}
      >
        {items.length > 0 ? (
          items.slice(0, section.max_items).map((item, index) => (
            <Card 
              key={index}
              className={`overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group ${shadowClass}`}
              style={{
                height: section.card_height ? `${section.card_height}px` : 'auto',
                borderRadius: `${section.card_border_radius}px`,
              }}
            >
              {item.image_url && (
                <div 
                  className="overflow-hidden"
                  style={{ 
                    height: section.image_height ? `${section.image_height}px` : '120px',
                  }}
                >
                  <img 
                    src={item.image_url} 
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    style={{
                      objectPosition: `${section.image_position_x}% ${section.image_position_y}%`,
                      objectFit: section.image_fit as React.CSSProperties['objectFit'],
                      borderRadius: `${section.image_border_radius}px`,
                    }}
                  />
                </div>
              )}
              <CardContent className="p-3">
                <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                {item.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {item.subtitle}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          // Placeholder cards when no items configured
          [...Array(Math.min(section.max_items, 4))].map((_, index) => (
            <Card 
              key={index}
              className={`overflow-hidden ${shadowClass}`}
              style={{
                height: section.card_height ? `${section.card_height}px` : '160px',
                borderRadius: `${section.card_border_radius}px`,
              }}
            >
              <CardContent className="p-4 h-full flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
                  <Layers className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {section.title}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Configure content in admin
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CustomSections;
