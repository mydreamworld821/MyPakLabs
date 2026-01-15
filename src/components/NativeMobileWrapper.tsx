import { useState } from "react";
import { useNativePlatform } from "@/hooks/useNativePlatform";
import NativeBottomNavigation from "./NativeBottomNavigation";
import GlobalSearch from "./GlobalSearch";

/**
 * Wrapper component for native mobile app bottom UI.
 * Shows bottom navigation bar and handles search modal integration.
 * Only renders on native platforms (iOS/Android via Capacitor).
 */
const NativeMobileWrapper = () => {
  const { isNative } = useNativePlatform();
  const [searchOpen, setSearchOpen] = useState(false);

  // Only render on native platforms
  if (!isNative) {
    return null;
  }

  return (
    <>
      {/* Bottom Navigation */}
      <NativeBottomNavigation onSearchClick={() => setSearchOpen(true)} />
      
      {/* Search Modal - controlled by bottom nav */}
      <GlobalSearch 
        position="bottom-fixed"
        externalOpen={searchOpen}
        onOpenChange={setSearchOpen}
        className="hidden" // Hide trigger, only show modal
      />
    </>
  );
};

export default NativeMobileWrapper;
