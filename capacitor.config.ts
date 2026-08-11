import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'uk.co.driveready.academy',
  appName: 'UK Driving Licence Prep',
  webDir: 'www',
  android: {
    // App content owns the status bar area (ThemeService sets its style
    // to match light/dark), rather than the OS drawing a plain bar behind it.
    adjustMarginsForEdgeToEdge: 'auto'
  },
  plugins: {
    StatusBar: {
      // ThemeService sets Style.Light/Dark itself once the app boots and
      // knows the resolved theme; this is just the pre-boot default.
      style: 'DEFAULT',
      overlaysWebView: false
    },
    Keyboard: {
      resizeOnFullScreen: true
    }
  }
};

export default config;
