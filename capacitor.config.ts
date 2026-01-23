import type { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'app.lovable.7ecb3c1ced7d4953aa8ce78ec1e56213',
  appName: 'mypaklab',
  webDir: 'dist',
  server: {
    // For development: enables hot-reload from Lovable sandbox
    // Comment out for production builds
    url: 'https://7ecb3c1c-ed7d-4953-aa8c-e78ec1e56213.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
      keystorePassword: undefined,
      keystoreAliasPassword: undefined,
      signingType: 'apksigner'
    }
  },
  ios: {
    scheme: 'mypaklab'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#ffffff'
    }
  }
};

export default config;
