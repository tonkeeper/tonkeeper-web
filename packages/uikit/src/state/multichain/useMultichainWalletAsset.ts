import BigNumber from 'bignumber.js';
import { useQuery } from '@tanstack/react-query';

import { ChainId } from '@tonkeeper/core/dist/chains/types';
import {
    AssetDetailsAsset,
    getTradingAssetsByIds,
    TradingMarketAsset
} from '@tonkeeper/core/dist/service/tradingService';
import {
    getMultichainWalletAsset,
    isForeignAccountAsset,
    MultichainApiHttpError,
    multichainOwnedAccountTypes,
    MultichainWalletAsset
} from '@tonkeeper/core/dist/service/multichainWalletService';
import { ResponseError } from '@tonkeeper/core/dist/tradingApiGenerated';
import { multichainApiWalletCredentials } from '@tonkeeper/core/dist/service/chainkit/walletAuthService';

import { QueryKey } from '../../libs/queryKey';
import { useAssetDetails } from '../trading/useAssetDetails';
import { useActiveAccount } from '../wallet';
import { useUserFiat } from '../fiat';
import { useMultichainWalletAssets } from './useMultichainWalletAssets';

export interface MultichainWalletAssetData {
    asset: MultichainWalletAsset | undefined;
    isFetching: boolean;
    /**
     * A lookup that could have produced the asset failed in a way a retry
     * can fix, so its absence proves nothing — the screen offers a retry
     * instead of "not found".
     */
    isError: boolean;
    refetch: () => void;
}

function chainIdFromAssetId(assetId: string): ChainId | undefined {
    const head = assetId.split('/')[0];
    switch (head) {
        case 'ton':
            return 'ton';
        case 'tron':
            return 'tron';
        case 'eth':
        case 'evm':
        case 'arb':
        case 'base':
        case 'bsc':
        case 'polygon':
        case 'avalanche':
            return 'evm';
        case 'btc':
            return 'btc';
        case 'sol':
            return 'sol';
        default:
            return undefined;
    }
}

/**
 * A 4xx from an asset-addressed lookup means the backend rejected the asset
 * id itself (unknown address, malformed id), so repeating the same request
 * cannot succeed and the asset is as good as absent. Network failures and
 * 5xx stay retryable.
 */
function isRejectedLookup(error: unknown): boolean {
    const status =
        error instanceof MultichainApiHttpError
            ? error.status
            : error instanceof ResponseError
            ? error.response.status
            : undefined;
    return status !== undefined && status >= 400 && status < 500;
}

function fallbackAssetFromDetails(
    assetId: string,
    detailsAsset: AssetDetailsAsset | undefined,
    market: TradingMarketAsset | undefined
): MultichainWalletAsset | undefined {
    if (!detailsAsset) return undefined;
    const chain = chainIdFromAssetId(detailsAsset.assetId);
    if (!chain) return undefined;

    return {
        assetId,
        chain,
        name: detailsAsset.name,
        symbol: detailsAsset.symbol,
        decimals: detailsAsset.decimals,
        image: detailsAsset.image,
        verification: detailsAsset.verification,
        balance: '0',
        isHidden: false,
        price: market?.price ? new BigNumber(market.price) : undefined,
        diff24h: market?.change24hPercent
    };
}

export const useMultichainWalletAsset = (assetId: string): MultichainWalletAssetData => {
    const fiat = useUserFiat();
    const account = useActiveAccount();
    const portfolio = useMultichainWalletAssets();
    const { data, isFetching } = portfolio;
    const detailsQuery = useAssetDetails(assetId);
    const { data: details, isFetching: isDetailsFetching } = detailsQuery;

    const credentials = multichainApiWalletCredentials(account);
    const walletId = credentials?.walletId;
    const tonWalletId = account.type === 'multichain' ? account.activeTonWallet.id : undefined;
    const portfolioAsset = data?.assets.find(a => a.assetId === assetId);

    // The portfolio list carries only the assets the backend shows, so an
    // asset the user hid has to be read one at a time — otherwise its page
    // would fall through to the catalog fallback below and report a zero
    // balance for coins the wallet actually holds.
    const singleQuery = useQuery<MultichainWalletAsset | undefined>(
        [QueryKey.multichainWalletAssets, 'single', walletId, tonWalletId, fiat, assetId],
        () =>
            getMultichainWalletAsset({
                walletId: walletId!,
                walletAuthKey: credentials?.walletAuthKey,
                currency: fiat,
                assetId
            }),
        {
            enabled: !!walletId && !portfolioAsset && !isFetching && !!assetId,
            keepPreviousData: true,
            refetchOnWindowFocus: false,
            retry: false
        }
    );
    // The endpoint answers for any account registered under the wallet id,
    // so a row of a TON version this account doesn't hold is no answer at
    // all — the balance page must not show funds the account can't spend.
    const singleAsset =
        singleQuery.data &&
        account.type === 'multichain' &&
        isForeignAccountAsset(singleQuery.data, multichainOwnedAccountTypes(account))
            ? undefined
            : singleQuery.data;

    // That row answers for every asset the backend indexes for the wallet,
    // priced at 0 for the ones no market quotes — so it only wins when the
    // wallet holds a balance in it. For everything else it contributes just
    // its visibility flag to the catalog fallback further down.
    const heldAsset =
        singleAsset && new BigNumber(singleAsset.balance).isGreaterThan(0)
            ? singleAsset
            : undefined;
    const walletAsset = portfolioAsset ?? heldAsset;

    // The wallet-balances backend only knows held assets; market pages
    // reached from Trade need price/24h-change from the trading API's
    // batch endpoint instead (the details response carries no price).
    const marketQuery = useQuery<TradingMarketAsset | undefined>(
        [QueryKey.tradingAssetMarket, fiat, assetId],
        async () => {
            const assets = await getTradingAssetsByIds({ ids: [assetId], currency: fiat });
            return assets[0];
        },
        {
            enabled: !walletAsset && !!assetId,
            staleTime: 30_000,
            keepPreviousData: true,
            refetchOnWindowFocus: false,
            retry: false
        }
    );
    const { data: market } = marketQuery;

    const catalogAsset = fallbackAssetFromDetails(assetId, details?.asset, market);
    const asset =
        walletAsset ??
        (catalogAsset && singleAsset
            ? { ...catalogAsset, isHidden: singleAsset.isHidden }
            : catalogAsset);

    // Only the lookups that can produce the asset itself count — the market
    // query adds a price to the catalog fallback and fails on its own. The
    // portfolio is not addressed by asset, so any failure of it is retryable.
    const retryableFailure =
        portfolio.isError ||
        (singleQuery.isError && !isRejectedLookup(singleQuery.error)) ||
        (detailsQuery.isError && !isRejectedLookup(detailsQuery.error));
    const isError = !asset && retryableFailure;

    // `refetch` ignores `enabled`, so only the queries that actually failed
    // are re-run — a disabled one would fire without its guard.
    const refetch = () => {
        if (portfolio.isError) void portfolio.refetch();
        if (singleQuery.isError) void singleQuery.refetch();
        if (detailsQuery.isError) void detailsQuery.refetch();
        if (marketQuery.isError) void marketQuery.refetch();
    };

    return {
        asset,
        isFetching:
            isFetching ||
            (!asset && (isDetailsFetching || singleQuery.isFetching || marketQuery.isFetching)),
        isError,
        refetch
    };
};
