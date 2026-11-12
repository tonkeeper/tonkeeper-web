import { FC, useMemo, useState } from 'react';
import { useTranslation } from '../../../hooks/translation';

import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';
import { eqAddresses } from '@tonkeeper/core/dist/utils/address';

import { SkeletonScope, useSkeletonMask } from '../../../primitives';
import { cn } from '../../../libs/css';
import { useAppContext } from '../../../hooks/appContext';
import { formatFiatCurrency } from '../../../hooks/balance';
import { useMultichainWalletAssets } from '../../../state/multichain/useMultichainWalletAssets';
import { useEnsureChainKitReady } from '../../../state/multichain/transfer/useMultichainTransfer';
import { CryptoCatalogModal } from './catalog/CryptoCatalogModal';
import { HomeMultichainActions } from './HomeMultichainActions';
import { HomeMultichainCollectibles } from './collectibles/HomeMultichainCollectibles';
import { HomeMultichainHeaderBar } from './HomeMultichainHeaderBar';
import { HomeMultichainAssetRow } from './HomeMultichainAssetRow';
import { ListTitle } from './ListTitle';
import { MultichainMobileTabBar } from './MultichainMobileTabBar';
import { ManageCryptoModal } from './manage/ManageCryptoModal';
import { MoreAssetsAssetAvatar, MoreAssetsButton } from './MoreAssetsButton';
import { StakingPoolLogo } from './staking/staking-shared';
import {
    HomeMultichainStakedRow,
    HomeStakedRow,
    useHomeStakedRows
} from './staking/HomeMultichainStakedRows';
import { isNativeRow, parseAssetIdHead } from './multichain-utils';
import { PLACEHOLDER_WALLET_ASSETS } from './multichain-placeholders';
import { ModalCenterError } from '../../../components/shared/ModalCenterState';
import IcExclamationmarkCircle28 from '../../../icons/components/IcExclamationmarkCircle28';
import IcSliders16 from '../../../icons/components/IcSliders16';
import { HomeBanners } from './HomeBanners';
import { FinishSetupSection } from './FinishSetupSection';
import { HomeMultichainAddress } from './HomeMultichainAddress';
import { BatteryBalanceButton } from './battery/BatteryBalanceButton';

/**
 * Portfolio-list expansion thresholds. Same algorithm as iOS
 * `WalletBalanceMultichainAssetsListViewModel`:
 *   - ≤ threshold rows → render the whole list.
 *   - > threshold rows → render the first `collapsedVisibleCount`
 *     plus a "More assets" row that, on tap, expands to show every
 *     row. Expansion state stays local and resets when the component
 *     remounts — per the spec, the list re-collapses on a new session.
 *
 * Mobile uses iOS' numbers (6 visible, threshold 7). Desktop shrinks
 * to 4/5 because the column also has to fit the Collectibles section
 * below it without forcing a long scroll — see the desktop mockup
 * showing exactly 4 crypto rows above the NFT carousel.
 *
 * The budget counts every row the card renders, staked positions
 * included: a collapsed card is exactly `collapsedVisibleCount` rows
 * tall whatever it holds, which is what lets the loading state reserve
 * its final height up front.
 */
const COLLAPSED_VISIBLE_COUNT = { full: 6, compact: 4 } as const;
const MORE_ASSETS_THRESHOLD = {
    full: COLLAPSED_VISIBLE_COUNT.full + 1,
    compact: COLLAPSED_VISIBLE_COUNT.compact + 1
} as const;

type PortfolioRow =
    | { kind: 'asset'; key: string; asset: MultichainWalletAsset }
    | { kind: 'staked'; key: string; staked: HomeStakedRow };

export const HomeMultichain: FC<{ compact?: boolean }> = ({ compact = false }) => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    const { data, isError, refetch } = useMultichainWalletAssets();
    const { rows: stakedRows, isLoading: isStakedLoading, hasReportedStake } = useHomeStakedRows();

    // `view` is for rendering only — never for deciding anything. Anything that
    // gates a query, an effect or a navigation must read `data`, which stays
    // undefined until the real assets arrive; a dependent query keyed off the
    // placeholder would fetch against ids that don't exist.
    //
    // Retries are disabled on the assets query, so a failure is terminal: the
    // portfolio shows a retry instead of masking the placeholder forever. The
    // placeholder must never surface unmasked, so the error state replaces both
    // the total and the rows rather than only dropping the mask. A refetch that
    // fails while previous data is cached keeps rendering that data.
    //
    // Staked rows share the list's row budget, so the card only holds its
    // height across the load when they are settled too — otherwise they land
    // after the mask lifts and push the rows below them down.
    const showError = !data && isError;
    const isLoading = (!data && !isError) || isStakedLoading;
    const view = data ?? PLACEHOLDER_WALLET_ASSETS;
    const mask = useSkeletonMask(isLoading);

    // chain-kit's WASM core takes ~2s to initialise; warm it as soon as the
    // wallet home mounts so address validation and fee estimation are ready
    // by the time the user opens the send flow, not blocked behind a cold start.
    useEnsureChainKitReady();

    const [catalogOpen, setCatalogOpen] = useState(false);
    const [manageOpen, setManageOpen] = useState(false);
    const [moreExpanded, setMoreExpanded] = useState(false);

    const total = view.totalFiat;
    // Liquid-staking tokens (tsTON & co) are represented by the "Staked"
    // rows below, so their raw token rows are hidden from the list. Hide
    // only tokens a staked row already covers: a liquid-only wallet has
    // nothing else to render until that row exists, and nothing at all
    // if the matching jetton never resolves.
    const allAssets = useMemo(() => {
        const assets = view.assets;
        const hiddenMasters = stakedRows
            .map(row => row.pool.liquidJettonMaster)
            .filter((master): master is string => !!master);
        if (hiddenMasters.length === 0) return assets;
        return assets.filter(asset => {
            if (parseAssetIdHead(asset.assetId).network !== 'ton') return true;
            const tail = asset.assetId.split('/').pop() ?? '';
            return !hiddenMasters.some(master => {
                try {
                    return eqAddresses(master, tail);
                } catch {
                    return false;
                }
            });
        });
    }, [view.assets, stakedRows]);

    const collapsedCount = compact ? COLLAPSED_VISIBLE_COUNT.compact : COLLAPSED_VISIBLE_COUNT.full;
    const threshold = compact ? MORE_ASSETS_THRESHOLD.compact : MORE_ASSETS_THRESHOLD.full;

    // "Staked" rows sit right below the TON coin row, mirroring the mockup's
    // order. The token rows are sorted by value, so that row can be well down
    // a long list — placing the positions after it would bury them behind
    // "More assets". They move to the top of the card whenever the group
    // wouldn't fit in the collapsed window as a whole.
    const allRows = useMemo<PortfolioRow[]>(() => {
        const assetRows = allAssets.map<PortfolioRow>(asset => ({
            kind: 'asset',
            key: asset.assetId,
            asset
        }));
        const stakedListRows = stakedRows.map<PortfolioRow>(staked => ({
            kind: 'staked',
            key: `staked/${staked.pool.address}`,
            staked
        }));
        if (stakedListRows.length === 0) return assetRows;

        const tonIndex = allAssets.findIndex(
            asset => isNativeRow(asset.assetId) && parseAssetIdHead(asset.assetId).network === 'ton'
        );
        const fitsBelowTon = tonIndex !== -1 && tonIndex + stakedListRows.length < collapsedCount;
        const after = fitsBelowTon ? tonIndex + 1 : 0;
        return [...assetRows.slice(0, after), ...stakedListRows, ...assetRows.slice(after)];
    }, [allAssets, stakedRows, collapsedCount]);

    const showMoreButton = !moreExpanded && allRows.length > threshold;
    const visibleRows = showMoreButton ? allRows.slice(0, collapsedCount) : allRows;
    const previewRows = showMoreButton ? allRows.slice(collapsedCount, collapsedCount + 2) : [];
    const hasFilteredLiquidStake = view.assets.length > allAssets.length;
    const hasPortfolioRows =
        allRows.length > 0 || hasFilteredLiquidStake || hasReportedStake || isStakedLoading;

    return (
        <SkeletonScope loading={isLoading}>
            {!compact && <HomeMultichainHeaderBar />}
            <div
                className={cn(
                    'mx-auto flex w-full max-w-[520px] flex-col px-4 text-textPrimary',
                    compact && 'gap-4 pb-8'
                )}
            >
                {!compact && (
                    // The balance's 44/56 style is above the shared type scale,
                    // and its 28/12 surround is measured from that 56px box.
                    <header className="flex flex-col items-center pb-3 pt-7">
                        <div className="flex items-center gap-2">
                            <div
                                {...mask({ w: 220, h: 40, r: 100 })}
                                className="text-[44px] font-semibold leading-[56px]"
                            >
                                {!showError && total ? formatFiatCurrency(fiat, total) : '—'}
                            </div>
                            <BatteryBalanceButton className="h-14" />
                        </div>
                        <HomeMultichainAddress />
                    </header>
                )}

                <HomeMultichainActions compact={compact} />

                {/* Compact leaves the column's `gap-4` alone: with the 12px
                    `ListTitle` inset it makes the 28px every section header
                    sits below the block above it, whether or not the setup
                    card is between them. */}
                <HomeBanners className={compact ? undefined : 'mb-4 mt-3'} />

                {/* Joins the page once the portfolio is in, like the natives. */}
                {!isLoading && <FinishSetupSection className={compact ? undefined : 'mb-1'} />}

                <section className={cn('flex flex-col', !compact && 'pb-4')}>
                    <ListTitle
                        title={t('wallet_crypto_section')}
                        onClick={() => setCatalogOpen(true)}
                        skeletonRightWidth={55}
                        right={
                            <button
                                type="button"
                                onClick={() => setManageOpen(true)}
                                className="flex cursor-pointer items-center gap-1.5 text-label2 text-textSecondary transition-colors duration-100 hover:text-textPrimary"
                            >
                                <span>{t('wallet_manage_assets')}</span>
                                <IcSliders16 className="size-4" />
                            </button>
                        }
                    />
                    {showError ? (
                        <ModalCenterError
                            icon={<IcExclamationmarkCircle28 />}
                            onRetry={() => refetch()}
                        />
                    ) : !hasPortfolioRows ? (
                        <div className="rounded-medium bg-backgroundContent px-4 py-6 text-center text-body2 text-textSecondary">
                            {'No assets yet'}
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-medium bg-backgroundContent [--tk-skeleton-fill:var(--tk-background-content-tint)]">
                            {visibleRows.map((row, idx) => (
                                <div
                                    key={row.key}
                                    className={idx === 0 ? '' : 'border-t border-separatorCommon'}
                                >
                                    {row.kind === 'asset' ? (
                                        <HomeMultichainAssetRow asset={row.asset} />
                                    ) : (
                                        <HomeMultichainStakedRow row={row.staked} />
                                    )}
                                </div>
                            ))}
                            {showMoreButton && (
                                <div className="border-t border-separatorCommon">
                                    <MoreAssetsButton
                                        previews={previewRows.map(row =>
                                            row.kind === 'asset' ? (
                                                <MoreAssetsAssetAvatar
                                                    key={row.key}
                                                    asset={row.asset}
                                                />
                                            ) : (
                                                <StakingPoolLogo
                                                    key={row.key}
                                                    pool={row.staked.pool}
                                                    className="size-7"
                                                />
                                            )
                                        )}
                                        onClick={() => setMoreExpanded(true)}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </section>

                <HomeMultichainCollectibles compact={compact} />

                {catalogOpen && <CryptoCatalogModal onClose={() => setCatalogOpen(false)} />}
                {manageOpen && <ManageCryptoModal onClose={() => setManageOpen(false)} />}
            </div>
            {!compact && (
                <>
                    {/* Reserves exactly the fixed tab bar: 64px of tabs plus
                        the home-indicator inset it pads itself with. The
                        extension lays the page out as a fixed-height flex
                        column, which would shrink it. */}
                    <div
                        className="h-[calc(4rem+env(safe-area-inset-bottom))] shrink-0"
                        aria-hidden
                    />
                    <MultichainMobileTabBar />
                </>
            )}
        </SkeletonScope>
    );
};
