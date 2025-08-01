import { useQuery } from '@tanstack/react-query';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { seeIfValidTonAddress, throttle } from '@tonkeeper/core/dist/utils/common';
import { Analytics, toWalletType, Aptabase } from '@tonkeeper/uikit/dist/hooks/analytics';
import { QueryKey } from '@tonkeeper/uikit/dist/libs/queryKey';
import { useActiveTonNetwork } from '@tonkeeper/uikit/dist/state/wallet';
import { useEffect, useState } from 'react';
import { useSwapFromAsset, useSwapToAsset } from '@tonkeeper/uikit/dist/state/swap/useSwapForm';
import { useAllSwapAssets } from '@tonkeeper/uikit/dist/state/swap/useSwapAssets';
import { tonAssetAddressToString } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { Address } from '@ton/core';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';

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

export const useAppWidth = (standalone: boolean) => {
    useEffect(() => {
        const appWidth = throttle(() => {
            if (standalone) {
                const doc = document.documentElement;
                doc.style.setProperty('--app-width', `${window.innerWidth}px`);
            } else {
                const doc = document.documentElement;
                const app = (document.getElementById('root') as HTMLDivElement).childNodes.item(
                    0
                ) as HTMLDivElement;

                doc.style.setProperty('--app-width', `${app.clientWidth}px`);
            }
        }, 50);
        window.addEventListener('resize', appWidth);

        appWidth();

        return () => {
            window.removeEventListener('resize', appWidth);
        };
    }, [standalone]);
};

export const useAnalytics = (
    activeAccount: Account | undefined,
    accounts: Account[] | undefined,
    version: string
) => {
    const network = useActiveTonNetwork();
    const sdk = useAppSdk();
    return useQuery<Analytics>(
        [QueryKey.analytics, network],
        async () => {
            const tracker = new Aptabase({
                host: import.meta.env.VITE_APP_APTABASE_HOST,
                key: import.meta.env.VITE_APP_APTABASE,
                appVersion: version,
                userIdentity: sdk.userIdentity
            });

            tracker.init({
                application: 'Swap-widget-web',
                walletType: toWalletType(activeAccount?.activeTonWallet),
                activeAccount: activeAccount!,
                accounts: accounts!,
                network
            });

            return tracker;
        },
        { enabled: accounts != null && activeAccount != null }
    );
};

export const useApplyQueryParams = () => {
    const [_, setFromAsset] = useSwapFromAsset();
    const [__, setToAsset] = useSwapToAsset();
    const { data: allAssets } = useAllSwapAssets();
    const [isApplied, setIsApplied] = useState(false);

    useEffect(() => {
        if (!allAssets || isApplied) {
            return;
        }
        setIsApplied(true);
        const searchParams = new URLSearchParams(window.location.search);
        const fromAssetParam = searchParams.get('ft');
        const toAssetParam = searchParams.get('tt');

        const fromAssetToSet =
            fromAssetParam && seeIfValidTonAddress(fromAssetParam)
                ? allAssets.find(
                      asset =>
                          tonAssetAddressToString(asset.address).toLowerCase() ===
                          Address.parse(fromAssetParam).toRawString()
                  )
                : fromAssetParam?.toLowerCase() === 'ton'
                ? TON_ASSET
                : undefined;
        if (fromAssetToSet) {
            setFromAsset(fromAssetToSet);
        }

        const toAssetToSet =
            toAssetParam && seeIfValidTonAddress(toAssetParam)
                ? allAssets.find(
                      asset =>
                          tonAssetAddressToString(asset.address).toLowerCase() ===
                          Address.parse(toAssetParam).toRawString()
                  )
                : toAssetParam?.toLowerCase() === 'ton'
                ? TON_ASSET
                : undefined;
        if (toAssetToSet) {
            setToAsset(toAssetToSet);
        }
    }, [allAssets, isApplied]);

    return isApplied;
};
