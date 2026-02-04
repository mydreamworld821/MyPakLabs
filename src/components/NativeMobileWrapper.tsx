import { useNativePlatform } from "@/hooks/useNativePlatform";
import NativeBottomNavigation from "./NativeBottomNavigation";

/**
 * Wrapper component for native mobile app bottom UI.
 * Shows bottom navigation bar on native platforms (iOS/Android via Capacitor).
 */
const NativeMobileWrapper = () => {
  const { isNative } = useNativePlatform();

  // Only render on native platforms
  if (!isNative) {
    return null;
  }

  return <NativeBottomNavigation />;
};

export default NativeMobileWrapper;
