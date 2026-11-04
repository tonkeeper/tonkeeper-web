import { Address } from '@ton/core';
import { useEffect, useRef } from 'react';

import { AnalyticsEvent } from '@tonkeeper/core/dist/analytics';
import {
    AnalyticsAssetId,
    normalizeAnalyticsAssetId,
    toAnalyticsAssetId,
    tonCoinAssetId,
    tonExtraCurrencyAssetId,
    tonJettonAssetId
} from '@tonkeeper/core/dist/analytics/asset-id';
import { toWalletMode } from '@tonkeeper/core/dist/analytics/wallet-mapping';
import { TRON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { seeIfValidTonAddress } from '@tonkeeper/core/dist/utils/common';

import { useActiveAccount, useActiveTonNetwork } from '../../state/wallet';
import { useAppContext } from '../appContext';
import { useAnalyticsTrack } from './index';

type AssetViewEvent = Extract<AnalyticsEvent, { eventName: 'asset_view' }>;

export type AssetViewSource = AssetViewEvent['from'];

/**
 * Entry point of the asset page the app is about to navigate to. The page is a
 * route and the router carries no state through the Ionic shell, so the source
 * is latched by whatever navigates and consumed on arrival. Anything that
 * doesn't declare itself is a tap on the wallet screen.
 */
let pendingAssetViewSource: AssetViewSource = 'wallet_screen';

export const setAssetViewSource = (from: AssetViewSource) => {
    pendingAssetViewSource = from;
};

const consumeAssetViewSource = (): AssetViewSource => {
    const from = pendingAssetViewSource;
    pendingAssetViewSource = 'wallet_screen';
    return from;
};

/**
 * Asset ID for a `/coins/:name` route param, which is one of `ton`, a TRON
 * asset id, a jetton address, or an extra-currency id.
 */
const coinRouteAssetId = (name: string, network: Network): AnalyticsAssetId => {
    const decoded = decodeURIComponent(name);

    if (decoded === 'ton') {
        return tonCoinAssetId(network);
    }

    if (decoded === TRON_USDT_ASSET.id) {
        return toAnalyticsAssetId(TRON_USDT_ASSET, network);
    }

    if (seeIfValidTonAddress(decoded)) {
        return tonJettonAssetId(Address.parse(decoded), network);
    }

    return tonExtraCurrencyAssetId(decoded, network);
};

const useTrackAssetViewId = (assetId: AnalyticsAssetId | undefined) => {
    const { tracker } = useAppContext();
    const track = useAnalyticsTrack();
    const account = useActiveAccount();

    const reportedAssetId = useRef<string | undefined>(undefined);

    useEffect(() => {
        // `track` no-ops until the tracker resolves — landing straight on an
        // asset page must not latch the event as reported before then.
        if (!tracker || !assetId || reportedAssetId.current === assetId) return;
        reportedAssetId.current = assetId;

        track({
            eventName: 'asset_view',
            from: consumeAssetViewSource(),
            asset: assetId,
            wallet_mode: toWalletMode(account)
        });
    }, [tracker, assetId, account, track]);
};

/** Multichain asset page — its route param already is a backend-minted Asset ID. */
export const useTrackAssetView = (assetId: string | undefined) =>
    useTrackAssetViewId(assetId ? normalizeAnalyticsAssetId(assetId) : undefined);

/** Legacy per-coin pages, which address the asset by `/coins/:name`. */
export const useTrackCoinRouteAssetView = (name: string | undefined) => {
    const network = useActiveTonNetwork();
    useTrackAssetViewId(name ? coinRouteAssetId(name, network) : undefined);
};
