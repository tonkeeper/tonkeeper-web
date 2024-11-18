import { CapacitorConfig } from '@capacitor/cli';
import { server } from "./capacitor.live-reload-config";

const config: CapacitorConfig = {
  appId: 'com.tonkeeper.pro.app',
  appName: 'Tonkeeper Pro',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  },
  server
};

export default config;