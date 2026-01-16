import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GripVertical,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Trash2,
  Settings2,
  LayoutGrid,
  Users,
  FlaskConical,
  Heart,
  Stethoscope,
  Scissors,
  Grid3X3,
  Sparkles,
} from "lucide-react";
import { HomepageSection } from "@/hooks/useHomepageSections";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  section: HomepageSection;
  isSelected: boolean;
  onSelect: (multiSelect: boolean) => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onOpenSettings: () => void;
}

const getSectionIcon = (sectionKey: string) => {
  const icons: Record<string, React.ReactNode> = {
    service_cards: <Grid3X3 className="w-4 h-4" />,
    featured_labs: <FlaskConical className="w-4 h-4" />,
    featured_doctors: <Stethoscope className="w-4 h-4" />,
    featured_nurses: <Heart className="w-4 h-4" />,
    surgeries: <Scissors className="w-4 h-4" />,
    consult_specialists: <Users className="w-4 h-4" />,
    search_by_condition: <Sparkles className="w-4 h-4" />,
    quick_access: <LayoutGrid className="w-4 h-4" />,
  };
  return icons[sectionKey] || <LayoutGrid className="w-4 h-4" />;
};

const isCoreSection = (sectionKey: string) => {
  const coreSections = [
    "service_cards",
    "featured_labs",
    "featured_doctors",
    "featured_nurses",
    "surgeries",
    "consult_specialists",
    "search_by_condition",
    "quick_access",
  ];
  return coreSections.includes(sectionKey);
};

export const SectionCard = ({
  section,
  isSelected,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onDuplicate,
  onDelete,
  onOpenSettings,
}: SectionCardProps) => {
  const isLocked = (section.custom_content as Record<string, unknown>)?.locked === true;
  const isCore = isCoreSection(section.section_key);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id, disabled: isLocked });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleClick = (e: React.MouseEvent) => {
    onSelect(e.ctrlKey || e.metaKey);
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={cn(
          "relative group transition-all duration-200 cursor-pointer",
          isSelected && "ring-2 ring-primary ring-offset-2",
          !section.is_visible && "opacity-50",
          isLocked && "bg-muted/50"
        )}
        onClick={handleClick}
      >
        <div className="flex items-center gap-3 p-4">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className={cn(
              "cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded",
              isLocked && "cursor-not-allowed opacity-50"
            )}
            disabled={isLocked}
          >
            <GripVertical className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Section Icon */}
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
            {getSectionIcon(section.section_key)}
          </div>

          {/* Section Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium truncate">{section.title}</h3>
              {isCore && (
                <Badge variant="secondary" className="text-xs">
                  Core
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {section.section_key} • {section.section_type}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility();
              }}
              title={section.is_visible ? "Hide section" : "Show section"}
            >
              {section.is_visible ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onToggleLock();
              }}
              title={isLocked ? "Unlock section" : "Lock section"}
            >
              {isLocked ? (
                <Lock className="w-4 h-4 text-amber-500" />
              ) : (
                <Unlock className="w-4 h-4" />
              )}
            </Button>

            {!isCore && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate();
                  }}
                  title="Duplicate section"
                >
                  <Copy className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  title="Delete section"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onOpenSettings();
              }}
              title="Section settings"
            >
              <Settings2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
