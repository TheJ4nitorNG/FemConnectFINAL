import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.femconnect.app',
  appName: 'FemConnect',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    iosScheme: 'https'
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    limitsNavigationsToAppBoundDomains: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0f0f23',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0f0f23'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  }
};

export default config;
