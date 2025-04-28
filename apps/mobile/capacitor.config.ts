import { CapacitorConfig } from '@capacitor/cli';
import { server } from './capacitor.live-reload-config';
import { KeyboardResize } from "@capacitor/keyboard";

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
        BluetoothPlugin: {},
        Keyboard: {
            resize: KeyboardResize.None
        },
    },
    server
};

export default config;
