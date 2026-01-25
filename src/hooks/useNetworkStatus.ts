import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Network, ConnectionStatus } from '@capacitor/network';

interface NetworkState {
  isOnline: boolean;
  connectionType: string;
  isChecking: boolean;
}

export const useNetworkStatus = () => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: true, // Assume online initially
    connectionType: 'unknown',
    isChecking: true,
  });

  useEffect(() => {
    const checkNetwork = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          // Native platform - use Capacitor Network plugin
          const status = await Network.getStatus();
          setNetworkState({
            isOnline: status.connected,
            connectionType: status.connectionType,
            isChecking: false,
          });
        } else {
          // Web platform - use navigator.onLine
          setNetworkState({
            isOnline: navigator.onLine,
            connectionType: navigator.onLine ? 'wifi' : 'none',
            isChecking: false,
          });
        }
      } catch (error) {
        console.error('Error checking network status:', error);
        // Fallback to navigator.onLine
        setNetworkState({
          isOnline: navigator.onLine,
          connectionType: 'unknown',
          isChecking: false,
        });
      }
    };

    // Initial check
    checkNetwork();

    // Set up listeners
    if (Capacitor.isNativePlatform()) {
      // Native platform listener
      const handleNetworkChange = (status: ConnectionStatus) => {
        console.log('Network status changed:', status);
        setNetworkState({
          isOnline: status.connected,
          connectionType: status.connectionType,
          isChecking: false,
        });
      };

      Network.addListener('networkStatusChange', handleNetworkChange);

      return () => {
        Network.removeAllListeners();
      };
    } else {
      // Web platform listeners
      const handleOnline = () => {
        setNetworkState({
          isOnline: true,
          connectionType: 'wifi',
          isChecking: false,
        });
      };

      const handleOffline = () => {
        setNetworkState({
          isOnline: false,
          connectionType: 'none',
          isChecking: false,
        });
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const retryConnection = async () => {
    setNetworkState(prev => ({ ...prev, isChecking: true }));
    
    try {
      if (Capacitor.isNativePlatform()) {
        const status = await Network.getStatus();
        setNetworkState({
          isOnline: status.connected,
          connectionType: status.connectionType,
          isChecking: false,
        });
      } else {
        setNetworkState({
          isOnline: navigator.onLine,
          connectionType: navigator.onLine ? 'wifi' : 'none',
          isChecking: false,
        });
      }
    } catch (error) {
      setNetworkState({
        isOnline: navigator.onLine,
        connectionType: 'unknown',
        isChecking: false,
      });
    }
  };

  return { ...networkState, retryConnection };
};
