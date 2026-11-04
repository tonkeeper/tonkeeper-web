import { useMemo } from 'react';
import type { Platform } from '@tonkeeper/core/dist/onrampApi';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { useUserCountry } from '../country';
import { useActiveAccount } from '../wallet';

export interface OnrampClientContext {
    deviceCountryCode?: string;
    timezone?: string;
    lang?: string;
    /**
     * Available swagger values are `ios | android | desktop`. Only the
     * Capacitor shell (`targetEnv === 'mobile' | 'tablet'`) is a real
     * native iOS app and sends `ios`; every web runtime — SPA, extension,
     * TWA, desktop electron — sends `desktop`. `AppContext.ios` is a
     * userAgent heuristic (true for Safari-on-Mac) and is the wrong
     * discriminator here.
     */
    platform: Platform;
    build?: string;
    /**
     * Sent as `X-Wallet-ID`; the backend picks which providers a wallet is
     * offered by it. Only multichain accounts have one.
     */
    walletId?: string;
}

export const useOnrampClientContext = (): OnrampClientContext => {
    const { i18n } = useTranslation();
    const sdk = useAppSdk();
    const { data: country } = useUserCountry();
    const account = useActiveAccount();
    const walletId = account.type === 'multichain' ? account.multichainWalletId : undefined;

    return useMemo<OnrampClientContext>(() => {
        const isCapacitor = sdk.targetEnv === 'mobile' || sdk.targetEnv === 'tablet';
        return {
            deviceCountryCode: country ?? undefined,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || undefined,
            lang: i18n.language || undefined,
            platform: isCapacitor ? 'ios' : 'desktop',
            build: sdk.version || undefined,
            walletId
        };
    }, [country, i18n.language, sdk.targetEnv, sdk.version, walletId]);
};
