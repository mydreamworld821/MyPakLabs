import { cn } from "@/lib/utils";
import { HomepageSection } from "@/hooks/useHomepageSections";

interface LivePreviewPaneProps {
  sections: HomepageSection[];
  devicePreview: "desktop" | "tablet" | "mobile";
  selectedIds: string[];
  onSelectSection: (id: string, multiSelect: boolean) => void;
}

const getDeviceWidth = (device: "desktop" | "tablet" | "mobile") => {
  switch (device) {
    case "mobile":
      return "max-w-[375px]";
    case "tablet":
      return "max-w-[768px]";
    default:
      return "max-w-full";
  }
};

const getSectionPreview = (section: HomepageSection) => {
  // Simplified preview representation
  const cols = {
    desktop: section.columns_desktop,
    tablet: section.columns_tablet,
    mobile: section.columns_mobile,
  };

  return (
    <div
      className="bg-muted/30 rounded-lg p-4"
      style={{
        backgroundColor: section.background_color !== "transparent" ? section.background_color : undefined,
        background: section.background_gradient || undefined,
        padding: `${section.section_padding_y}px ${section.section_padding_x}px`,
      }}
    >
      <div className="mb-3">
        <h3 
          className="text-sm font-semibold truncate"
          style={{ color: section.text_color || 'inherit' }}
        >
          {section.title}
        </h3>
        {section.subtitle && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {section.subtitle}
          </p>
        )}
      </div>
      
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${cols.desktop}, 1fr)`,
          gap: `${section.items_gap}px`,
        }}
      >
        {Array.from({ length: Math.min(section.max_items, 6) }).map((_, i) => (
          <div
            key={i}
            className="bg-background border"
            style={{
              height: `${Math.min(section.card_height, 100)}px`,
              borderRadius: `${section.card_border_radius}px`,
            }}
          >
            <div
              className="bg-muted"
              style={{
                height: `${Math.min(section.image_height, 60)}px`,
                borderRadius: `${section.image_border_radius}px`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export const LivePreviewPane = ({
  sections,
  devicePreview,
  selectedIds,
  onSelectSection,
}: LivePreviewPaneProps) => {
  const visibleSections = sections.filter((s) => s.is_visible);

  return (
    <div className="flex-1 bg-muted/20 overflow-auto">
      <div className="p-4 min-h-full">
        <div
          className={cn(
            "mx-auto bg-background rounded-lg shadow-lg overflow-hidden transition-all duration-300",
            getDeviceWidth(devicePreview)
          )}
        >
          {/* Fake Hero */}
          <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <div className="text-center">
              <div className="h-6 w-48 bg-foreground/20 rounded mx-auto mb-2" />
              <div className="h-4 w-32 bg-foreground/10 rounded mx-auto" />
            </div>
          </div>

          {/* Sections */}
          <div className="p-4 space-y-4">
            {visibleSections.map((section) => (
              <div
                key={section.id}
                className={cn(
                  "relative cursor-pointer transition-all duration-200 rounded-lg",
                  selectedIds.includes(section.id) && "ring-2 ring-primary ring-offset-2"
                )}
                onClick={(e) => onSelectSection(section.id, e.ctrlKey || e.metaKey)}
              >
                <div className="absolute -top-2 -left-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  {section.title}
                </div>
                {getSectionPreview(section)}
              </div>
            ))}
          </div>

          {/* Fake Footer */}
          <div className="h-32 bg-muted flex items-center justify-center">
            <div className="h-4 w-24 bg-foreground/10 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};
