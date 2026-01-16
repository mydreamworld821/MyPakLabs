import { cn } from "@/lib/utils";
import { HomepageSection } from "@/hooks/useHomepageSections";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";

interface LivePreviewPaneProps {
  sections: HomepageSection[];
  devicePreview: "desktop" | "tablet" | "mobile";
  selectedIds: string[];
  onSelectSection: (id: string, multiSelect: boolean) => void;
}

const getDeviceStyles = (device: "desktop" | "tablet" | "mobile") => {
  switch (device) {
    case "mobile":
      return { width: 375, scale: 1 };
    case "tablet":
      return { width: 768, scale: 0.8 };
    default:
      return { width: 1280, scale: 0.6 };
  }
};

export const LivePreviewPane = ({
  sections,
  devicePreview,
  selectedIds,
  onSelectSection,
}: LivePreviewPaneProps) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const deviceStyles = getDeviceStyles(devicePreview);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="flex-1 bg-muted/20 overflow-auto flex flex-col">
      {/* Preview Controls */}
      <div className="flex items-center justify-between p-2 border-b bg-background">
        <span className="text-sm text-muted-foreground">
          Live Preview ({devicePreview})
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="h-8 gap-1.5"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Iframe Container */}
      <div className="flex-1 p-4 overflow-auto flex items-start justify-center">
        <div
          className="bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300 origin-top"
          style={{
            width: deviceStyles.width,
            transform: `scale(${deviceStyles.scale})`,
            transformOrigin: "top center",
          }}
        >
          {/* Browser Chrome */}
          <div className="bg-muted border-b px-3 py-2 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 bg-background rounded px-3 py-1 text-xs text-muted-foreground truncate">
              {window.location.origin}/
            </div>
          </div>

          {/* Actual Homepage in Iframe */}
          <iframe
            ref={iframeRef}
            key={refreshKey}
            src="/"
            className="w-full border-0"
            style={{
              height: devicePreview === "mobile" ? "800px" : "900px",
              pointerEvents: "auto",
            }}
            title="Homepage Preview"
          />
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-3 border-t bg-muted/50 text-center">
        <p className="text-xs text-muted-foreground">
          💡 Changes are saved to database. Click <strong>Refresh</strong> to see updates in preview.
        </p>
      </div>
    </div>
  );
};
