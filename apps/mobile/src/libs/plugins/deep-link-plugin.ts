import { registerPlugin } from '@capacitor/core';

interface DeepLinkPlugin {
    canOpen(options: { url: string }): Promise<{ value: boolean }>;
}

export const DeepLink = registerPlugin<DeepLinkPlugin>('DeepLink', {
    web: () => {
        return {
            async canOpen() {
                return false;
            }
        };
    }
});
