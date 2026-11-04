import { PluginListenerHandle, registerPlugin } from '@capacitor/core';

interface ScreenshotPlugin {
    addListener(eventName: 'screenshotTaken', listener: () => void): Promise<PluginListenerHandle>;
}

export const Screenshot = registerPlugin<ScreenshotPlugin>('Screenshot');
