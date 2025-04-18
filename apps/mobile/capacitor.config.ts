import { CapacitorConfig } from '@capacitor/cli';
import { server } from './capacitor.live-reload-config';

const config: CapacitorConfig = {
    appId: 'com.tonapps.tonkeeperpro',
    appName: 'Tonkeeper Pro',
    webDir: 'dist',
    plugins: {
        SplashScreen: {
            launchAutoHide: false
        },
        CapacitorHttp: {
            enabled: true
        },
        CapacitorCookies: {
            enabled: true
        },
        BluetoothPlugin: {}
    },
    server
};

export default config;
