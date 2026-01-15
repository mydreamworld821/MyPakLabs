import { useNativePlatform } from "@/hooks/useNativePlatform";
import GlobalSearch from "./GlobalSearch";

/**
 * This component renders the GlobalSearch at the bottom of the screen
 * ONLY when running as a native mobile app (iOS/Android via Capacitor).
 * On web, it renders nothing - the inline search bar is shown in HeroSection.
 */
const NativeBottomSearch = () => {
  const { isNative } = useNativePlatform();

  // Only render on native platforms
  if (!isNative) {
    return null;
  }

  return <GlobalSearch position="bottom-fixed" />;
};

export default NativeBottomSearch;
