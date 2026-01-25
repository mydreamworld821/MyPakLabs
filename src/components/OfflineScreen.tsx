import { WifiOff, RefreshCw, Signal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OfflineScreenProps {
  onRetry: () => void;
  isChecking: boolean;
}

const OfflineScreen = ({ onRetry, isChecking }: OfflineScreenProps) => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
        {/* Animated Icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
            <WifiOff className="w-12 h-12 text-muted-foreground" />
          </div>
          <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-destructive flex items-center justify-center">
            <Signal className="w-4 h-4 text-destructive-foreground" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground mb-2">
          No Internet Connection
        </h1>

        {/* Description */}
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Please check your internet connection and try again. 
          Make sure you're connected to Wi-Fi or mobile data.
        </p>

        {/* Retry Button */}
        <Button 
          onClick={onRetry} 
          disabled={isChecking}
          size="lg"
          className="min-w-[200px]"
        >
          {isChecking ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </>
          )}
        </Button>

        {/* Tips */}
        <div className="mt-8 p-4 bg-muted rounded-lg text-left w-full">
          <p className="text-sm font-medium text-foreground mb-2">Tips:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Check if Wi-Fi or mobile data is enabled</li>
            <li>• Try moving to an area with better signal</li>
            <li>• Restart your device if the problem persists</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OfflineScreen;
