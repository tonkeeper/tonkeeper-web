import { registerPlugin } from '@capacitor/core';

interface CountryInfoPlugin {
    getInfo(): Promise<{ deviceCountryCode: string | null; storeCountryCode: string | null }>;
}

export const CountryInfo = registerPlugin<CountryInfoPlugin>('CountryInfo', {
    web: () => {
        return {
            async getInfo() {
                return {
                    deviceCountryCode: null,
                    storeCountryCode: null
                };
            }
        };
    }
});
