import { useQuery } from '@tanstack/react-query';
import { AccountState } from '@tonkeeper/core/dist/entries/account';
import { WalletState } from '@tonkeeper/core/dist/entries/wallet';
import { throttle } from '@tonkeeper/core/dist/utils/common';
import { Analytics, toWalletType } from '@tonkeeper/uikit/dist/hooks/analytics';
import { Amplitude } from '@tonkeeper/uikit/dist/hooks/analytics/amplitude';
import { QueryKey } from '@tonkeeper/uikit/dist/libs/queryKey';
import { useEffect } from 'react';

export const useAppHeight = () => {
    useEffect(() => {
        const appHeight = throttle(() => {
            const doc = document.documentElement;
            doc.style.setProperty('--app-height', `${window.innerHeight}px`);
        }, 50);
        window.addEventListener('resize', appHeight);
        appHeight();

        return () => {
            window.removeEventListener('resize', appHeight);
        };
    }, []);
};

export const useAppWidth = () => {
    useEffect(() => {
        const appWidth = throttle(() => {
            const doc = document.documentElement;
            const app = (document.getElementById('root') as HTMLDivElement).childNodes.item(
                0
            ) as HTMLDivElement;

            doc.style.setProperty('--app-width', `${app.clientWidth}px`);
        }, 50);
        window.addEventListener('resize', appWidth);

        appWidth();

        return () => {
            window.removeEventListener('resize', appWidth);
        };
    }, []);
};

declare const REACT_APP_AMPLITUDE: string;

export const useAnalytics = (
    version: string,
    account?: AccountState,
    wallet?: WalletState | null
) => {
    return useQuery<Analytics>(
        [QueryKey.analytics],
        async () => {
            const tracker = new Amplitude(REACT_APP_AMPLITUDE);
            tracker.init(
                'Desktop',
                toWalletType(wallet),
                account,
                wallet,
                version,
                `${window.backgroundApi.platform()}-${window.backgroundApi.arch()}`
            );

            return tracker;
        },
        { enabled: account != null }
    );
};
