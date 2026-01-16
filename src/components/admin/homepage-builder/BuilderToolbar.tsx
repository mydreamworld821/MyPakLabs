import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Undo2,
  Redo2,
  Plus,
  Save,
  Eye,
  Monitor,
  Tablet,
  Smartphone,
  Grid3X3,
  Loader2,
} from "lucide-react";

interface BuilderToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onAddSection: () => void;
  onSave: () => void;
  onPreview: () => void;
  devicePreview: "desktop" | "tablet" | "mobile";
  onDeviceChange: (device: "desktop" | "tablet" | "mobile") => void;
  gridSnap: boolean;
  onToggleGridSnap: () => void;
  saving: boolean;
  hasChanges: boolean;
}

export const BuilderToolbar = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onAddSection,
  onSave,
  onPreview,
  devicePreview,
  onDeviceChange,
  gridSnap,
  onToggleGridSnap,
  saving,
  hasChanges,
}: BuilderToolbarProps) => {
  return (
    <div className="flex items-center justify-between p-3 bg-background border-b sticky top-0 z-10">
      <div className="flex items-center gap-2">
        {/* Undo/Redo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onUndo}
              disabled={!canUndo}
            >
              <Undo2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRedo}
              disabled={!canRedo}
            >
              <Redo2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6" />

        {/* Add Section */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={onAddSection}>
              <Plus className="w-4 h-4 mr-2" />
              Add Section
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add a new section</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center gap-2">
        {/* Device Preview */}
        <div className="flex items-center bg-muted rounded-lg p-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={devicePreview === "desktop"}
                onPressedChange={() => onDeviceChange("desktop")}
                size="sm"
                className="data-[state=on]:bg-background"
              >
                <Monitor className="w-4 h-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Desktop preview</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={devicePreview === "tablet"}
                onPressedChange={() => onDeviceChange("tablet")}
                size="sm"
                className="data-[state=on]:bg-background"
              >
                <Tablet className="w-4 h-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Tablet preview</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={devicePreview === "mobile"}
                onPressedChange={() => onDeviceChange("mobile")}
                size="sm"
                className="data-[state=on]:bg-background"
              >
                <Smartphone className="w-4 h-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Mobile preview</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Grid Snap */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              pressed={gridSnap}
              onPressedChange={onToggleGridSnap}
              size="sm"
              variant="outline"
            >
              <Grid3X3 className="w-4 h-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>Grid snap {gridSnap ? "on" : "off"}</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6" />

        {/* Preview & Save */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={onPreview}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          </TooltipTrigger>
          <TooltipContent>Open live preview</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              onClick={onSave}
              disabled={saving || !hasChanges}
              className="min-w-[100px]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Save changes (Ctrl+S)</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};
