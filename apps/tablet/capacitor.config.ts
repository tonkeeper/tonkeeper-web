import { CapacitorConfig } from '@capacitor/cli';
import { server } from './capacitor.live-reload-config';

const config: CapacitorConfig = {
    appId: 'com.tonapps.tonkeeperpro',
    appName: 'Tonkeeper Pro',
    webDir: 'dist',
    plugins: {
        SplashScreen: {
            launchShowDuration: 0
        },
        CapacitorHttp: {
            enabled: true
        },
        CapacitorCookies: {
            enabled: true
        }
    },
    server
};

export default config;
