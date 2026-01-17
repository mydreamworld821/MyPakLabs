import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ZoomIn, ZoomOut, RotateCw, Download, Maximize2, X, Move } from "lucide-react";
import { Loader2 } from "lucide-react";

interface PrescriptionImageViewerProps {
  imageUrl: string | null;
  isLoading?: boolean;
  onDownload?: () => void;
}

const PrescriptionImageViewer = ({
  imageUrl,
  isLoading = false,
  onDownload,
}: PrescriptionImageViewerProps) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const MIN_SCALE = 0.5;
  const MAX_SCALE = 5;
  const SCALE_STEP = 0.25;

  const resetView = useCallback(() => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + SCALE_STEP, MAX_SCALE));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - SCALE_STEP, MIN_SCALE));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP;
    setScale((prev) => Math.min(Math.max(prev + delta, MIN_SCALE), MAX_SCALE));
  }, []);

  // Mouse drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [scale, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch handlers for pinch zoom and pan
  const lastTouchDistance = useRef<number | null>(null);
  const lastTouchCenter = useRef<{ x: number; y: number } | null>(null);

  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchCenter = (touches: React.TouchList) => {
    if (touches.length < 2) {
      return { x: touches[0].clientX, y: touches[0].clientY };
    }
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      lastTouchDistance.current = getTouchDistance(e.touches);
      lastTouchCenter.current = getTouchCenter(e.touches);
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  }, [scale, position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 2 && lastTouchDistance.current) {
      // Pinch zoom
      const newDistance = getTouchDistance(e.touches);
      const scaleDelta = (newDistance - lastTouchDistance.current) * 0.01;
      setScale((prev) => Math.min(Math.max(prev + scaleDelta, MIN_SCALE), MAX_SCALE));
      lastTouchDistance.current = newDistance;

      // Pan with pinch
      if (lastTouchCenter.current) {
        const newCenter = getTouchCenter(e.touches);
        setPosition((prev) => ({
          x: prev.x + (newCenter.x - lastTouchCenter.current!.x),
          y: prev.y + (newCenter.y - lastTouchCenter.current!.y),
        }));
        lastTouchCenter.current = newCenter;
      }
    } else if (e.touches.length === 1 && isDragging) {
      // Single finger pan
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart]);

  const handleTouchEnd = useCallback(() => {
    lastTouchDistance.current = null;
    lastTouchCenter.current = null;
    setIsDragging(false);
  }, []);

  const handleDownload = useCallback(async () => {
    if (!imageUrl) return;
    
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `prescription-${Date.now()}.${blob.type.split("/")[1] || "jpg"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      onDownload?.();
    } catch (error) {
      console.error("Error downloading prescription:", error);
    }
  }, [imageUrl, onDownload]);

  // Reset view when image changes
  useEffect(() => {
    resetView();
  }, [imageUrl, resetView]);

  // Close fullscreen on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const ImageContent = ({ inFullscreen = false }: { inFullscreen?: boolean }) => (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-muted rounded-lg ${
        inFullscreen ? "w-full h-full" : "min-h-64"
      } ${isDragging ? "cursor-grabbing" : scale > 1 ? "cursor-grab" : "cursor-default"}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : imageUrl ? (
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Prescription"
          className={`w-full ${inFullscreen ? "h-full object-contain" : "max-h-96 object-contain"} select-none transition-transform duration-100`}
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transformOrigin: "center center",
          }}
          draggable={false}
        />
      ) : (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Unable to load prescription image
        </div>
      )}

      {/* Zoom indicator */}
      {scale !== 1 && (
        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
          {Math.round(scale * 100)}%
        </div>
      )}

      {/* Pan hint when zoomed */}
      {scale > 1 && !isDragging && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <Move className="w-3 h-3" />
          Drag to pan
        </div>
      )}
    </div>
  );

  const ControlButtons = ({ compact = false }: { compact?: boolean }) => (
    <div className={`flex items-center gap-1 ${compact ? "" : "flex-wrap"}`}>
      <Button
        variant="outline"
        size="icon"
        onClick={handleZoomOut}
        disabled={scale <= MIN_SCALE || !imageUrl}
        className="h-8 w-8"
        title="Zoom Out"
      >
        <ZoomOut className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={handleZoomIn}
        disabled={scale >= MAX_SCALE || !imageUrl}
        className="h-8 w-8"
        title="Zoom In"
      >
        <ZoomIn className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={handleRotate}
        disabled={!imageUrl}
        className="h-8 w-8"
        title="Rotate"
      >
        <RotateCw className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsFullscreen(true)}
        disabled={!imageUrl}
        className="h-8 w-8"
        title="Fullscreen"
      >
        <Maximize2 className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={handleDownload}
        disabled={!imageUrl}
        className="h-8 w-8"
        title="Download"
      >
        <Download className="w-4 h-4" />
      </Button>
      {scale !== 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={resetView}
          className="h-8 text-xs"
        >
          Reset
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-2">
      {/* Control bar */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Prescription Image</h3>
        <ControlButtons />
      </div>

      {/* Image container */}
      <div className="border rounded-lg overflow-hidden">
        <ImageContent />
      </div>

      {/* Fullscreen dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
          <DialogHeader className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-white">Prescription Image</DialogTitle>
              <div className="flex items-center gap-2">
                <ControlButtons compact />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsFullscreen(false)}
                  className="h-8 w-8 text-white hover:bg-white/20"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="w-full h-full pt-16">
            <ImageContent inFullscreen />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrescriptionImageViewer;
