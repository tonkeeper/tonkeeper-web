import { registerPlugin } from '@capacitor/core';

export interface BiometricPlugin {
    canPrompt(): Promise<{ isAvailable: boolean }>;

    prompt(reason: string): Promise<void>;
}

export const Biometric = registerPlugin<BiometricPlugin>('Biometric', {
    web: () => {
        return {
            async canPrompt() {
                return { isAvailable: true };
            },
            async prompt(reason: string) {
                return Promise.resolve(confirm(reason));
            }
        };
    }
});
