import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export function useNativePlatform() {
  const [isNative, setIsNative] = useState(false);
  const [platform, setPlatform] = useState<'web' | 'ios' | 'android'>('web');

  useEffect(() => {
    const checkPlatform = () => {
      const native = Capacitor.isNativePlatform();
      setIsNative(native);
      
      if (native) {
        const p = Capacitor.getPlatform();
        setPlatform(p as 'ios' | 'android');
      } else {
        setPlatform('web');
      }
    };

    checkPlatform();
  }, []);

  return { isNative, platform };
}
