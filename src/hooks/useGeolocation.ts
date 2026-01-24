import { useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation, PermissionStatus } from '@capacitor/geolocation';
import { toast } from '@/hooks/use-toast';

interface GeolocationResult {
  latitude: number;
  longitude: number;
}

interface UseGeolocationReturn {
  getCurrentPosition: () => Promise<GeolocationResult | null>;
  watchPosition: (callback: (position: GeolocationResult) => void, errorCallback?: (error: any) => void) => Promise<string | number | null>;
  clearWatch: (watchId: string | number | null) => void;
  loading: boolean;
  error: string | null;
}

export function useGeolocation(): UseGeolocationReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNative = Capacitor.isNativePlatform();

  // Request permissions for native platforms
  const requestNativePermissions = async (): Promise<boolean> => {
    try {
      let status: PermissionStatus = await Geolocation.checkPermissions();
      
      if (status.location === 'prompt' || status.location === 'prompt-with-rationale') {
        status = await Geolocation.requestPermissions();
      }

      if (status.location === 'denied') {
        toast({
          title: "Location Permission Denied",
          description: "Please enable location permissions in your device settings to use this feature.",
          variant: "destructive",
        });
        return false;
      }

      if (status.location === 'granted' || status.coarseLocation === 'granted') {
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error requesting location permissions:', err);
      return false;
    }
  };

  const getCurrentPosition = useCallback(async (): Promise<GeolocationResult | null> => {
    setLoading(true);
    setError(null);

    try {
      if (isNative) {
        // Native platform - use Capacitor Geolocation
        const hasPermission = await requestNativePermissions();
        if (!hasPermission) {
          setLoading(false);
          setError('Location permission denied');
          return null;
        }

        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000,
        });

        setLoading(false);
        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      } else {
        // Web platform - use browser geolocation
        if (!navigator.geolocation) {
          setLoading(false);
          setError('Geolocation is not supported by your browser');
          toast({
            title: "Error",
            description: "Geolocation is not supported by your browser",
            variant: "destructive",
          });
          return null;
        }

        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setLoading(false);
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            },
            (err) => {
              setLoading(false);
              setError(err.message);
              toast({
                title: "Location Error",
                description: err.message,
                variant: "destructive",
              });
              resolve(null);
            },
            { enableHighAccuracy: true, timeout: 15000 }
          );
        });
      }
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.message || 'Failed to get location';
      setError(errorMessage);
      toast({
        title: "Location Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  }, [isNative]);

  const watchPosition = useCallback(async (
    callback: (position: GeolocationResult) => void,
    errorCallback?: (error: any) => void
  ): Promise<string | number | null> => {
    try {
      if (isNative) {
        const hasPermission = await requestNativePermissions();
        if (!hasPermission) {
          errorCallback?.({ message: 'Location permission denied' });
          return null;
        }

        const watchId = await Geolocation.watchPosition(
          { enableHighAccuracy: true },
          (position, err) => {
            if (err) {
              errorCallback?.(err);
              return;
            }
            if (position) {
              callback({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            }
          }
        );
        return watchId;
      } else {
        if (!navigator.geolocation) {
          errorCallback?.({ message: 'Geolocation not supported' });
          return null;
        }

        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            callback({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (err) => {
            errorCallback?.(err);
          },
          { enableHighAccuracy: true }
        );
        return watchId;
      }
    } catch (err) {
      errorCallback?.(err);
      return null;
    }
  }, [isNative]);

  const clearWatch = useCallback((watchId: string | number | null) => {
    if (watchId === null) return;

    if (isNative) {
      Geolocation.clearWatch({ id: watchId as string });
    } else {
      navigator.geolocation.clearWatch(watchId as number);
    }
  }, [isNative]);

  return {
    getCurrentPosition,
    watchPosition,
    clearWatch,
    loading,
    error,
  };
}
