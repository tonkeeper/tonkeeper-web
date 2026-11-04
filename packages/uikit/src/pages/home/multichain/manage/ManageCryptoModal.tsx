import { FC, useEffect, useMemo, useRef, useState } from 'react';

import { Loader, SearchField, SkeletonScope } from '../../../../primitives';
import { Modal } from '../../../../primitives/Modal';
import { InlineRetryRow } from '../../../../components/shared/InlineRetryRow';
import { ModalCenterError } from '../../../../components/shared/ModalCenterState';
import IcExclamationmarkCircle28 from '../../../../icons/components/IcExclamationmarkCircle28';
import { useIsFullWidthMode } from '../../../../hooks/useIsFullWidthMode';
import { useTranslation } from '../../../../hooks/translation';
import { useManageMultichainAssets } from '../../../../state/multichain/useManageMultichainAssets';
import {
    AssetVisibilityMap,
    isAssetVisible,
    usePendingAssetVisibility,
    useSetAssetVisibility
} from '../../../../state/multichain/useMultichainAssetVisibility';
import { useDustFilters, useMutateDustFilters } from '../../../../state/multichain/useDustFilters';
import { MultichainChainChips } from '../MultichainChainChips';
import { MultichainFiltersSheet } from '../MultichainFiltersSheet';
import { PLACEHOLDER_ASSETS } from '../multichain-placeholders';
import { ManageCryptoHeader } from './ManageCryptoHeader';
import { ManageCryptoRow } from './ManageCryptoRow';
import { ManageCryptoSaveBar } from './ManageCryptoSaveBar';

export const ManageCryptoModal: FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t } = useTranslation();
    const isFullWidth = useIsFullWidthMode();
    const [chain, setChain] = useState<string | undefined>(undefined);
    const [search, setSearch] = useState('');
    const [filtersOpen, setFiltersOpen] = useState(false);
    const { data: dustFilters } = useDustFilters();
    const { mutate: mutateDustFilters } = useMutateDustFilters();
    const hideDustAssets = dustFilters?.hideDustBalances === true;

    const { assets, hasNextPage, isFetchingNextPage, fetchNextPage, isError, refetch } =
        useManageMultichainAssets({
            chain,
            search
        });
    const persistedVisibility = usePendingAssetVisibility();
    const { mutateAsync: setVisibility, isLoading: isSaving } = useSetAssetVisibility();

    /** Per-session visibility edits, on top of the persisted overrides. */
    const [draft, setDraft] = useState<AssetVisibilityMap>({});

    // Flipping the dust filter swaps the list under the draft — entries for
    // assets no longer on screen would still go up with Save, so the
    // pending edits are dropped with the rows they belonged to.
    useEffect(() => {
        setDraft({});
    }, [hideDustAssets]);

    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        scrollRef.current?.scrollTo(0, 0);
    }, [chain, search]);

    // Rendering only — the toggle/save logic reads `assets`, which stays
    // undefined until the real list arrives (a placeholder row must never
    // enter the draft or a save payload; `TokenCell` also disables masked
    // rows).
    //
    // Retries are disabled on the query, so an error is final: with nothing
    // loaded the list area shows a retry instead of staying masked, and rows
    // already on screen stay put when a later page fails — that error lands
    // in the list footer.
    const showError = !assets && isError;
    const isLoading = !assets && !isError;
    const viewAssets = assets ?? PLACEHOLDER_ASSETS;
    const retryLoadMore = () => (hasNextPage ? fetchNextPage() : refetch());

    // The loading mockup masks the search field and the chips too, but only
    // on the way in: once the screen has rendered a list, a chain switch
    // refetches and the controls the user is operating have to stay live.
    const [hasLoaded, setHasLoaded] = useState(false);
    useEffect(() => {
        if (assets) setHasLoaded(true);
    }, [assets]);

    // A failed page must not re-arm the observer: the sentinel is still in
    // view, so it would refire the same request in a loop. The footer's
    // Retry is the only way forward after an error.
    const sentinelRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel || !hasNextPage || isError) return;
        const observer = new IntersectionObserver(entries => {
            if (entries.some(e => e.isIntersecting) && !isFetchingNextPage) {
                fetchNextPage();
            }
        });
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, isError]);

    // An edit that puts the asset back where it already was leaves the draft
    // instead of being recorded as a no-op change, so the draft doubles as
    // the "unsaved changes" flag and survives switching chains — its entries
    // are self-describing, unlike a diff against the currently loaded page.
    const toggle = (assetId: string, current: boolean, saved: boolean) =>
        setDraft(prev => {
            const next = { ...prev };
            if (!current === saved) {
                delete next[assetId];
            } else {
                next[assetId] = !current;
            }
            return next;
        });

    const changes = useMemo(
        () => Object.entries(draft).map(([assetId, visible]) => ({ assetId, visible })),
        [draft]
    );
    const dirty = changes.length > 0;

    const handleSave = async () => {
        if (!dirty) return;
        try {
            await setVisibility(changes);
        } catch {
            // Swallow — the choice is persisted locally either way and goes
            // up again with the next save.
        }
        setDraft({});
        onClose();
    };

    return (
        <Modal isOpen onClose={onClose} bare>
            <ManageCryptoHeader onClose={onClose} onOpenFilters={() => setFiltersOpen(true)} />
            <SkeletonScope loading={isLoading && !hasLoaded}>
                <div className="px-4 pb-3">
                    <SearchField
                        value={search}
                        onChange={setSearch}
                        placeholder={t('crypto_catalog_search_placeholder')}
                        className="!p-0"
                    />
                </div>
                <div className="px-4 pb-3">
                    <MultichainChainChips value={chain} onChange={setChain} />
                </div>
            </SkeletonScope>
            <SkeletonScope loading={isLoading}>
                {/* The rounded container is pinned inside the card and the rows
                    scroll within it, so its corners stay crisp while scrolling.
                    When the save bar is shown it overlaps the container bottom,
                    and the in-container padding lets the last row scroll out
                    from behind it. The fill sits on an inner wrapper so that
                    padding stays transparent and the card doesn't grow when
                    the bar appears. */}
                <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
                    {showError ? (
                        <div className="pt-16">
                            <ModalCenterError
                                icon={<IcExclamationmarkCircle28 />}
                                onRetry={() => refetch()}
                            />
                        </div>
                    ) : (
                        <div
                            ref={scrollRef}
                            className={`hide-scrollbar min-h-0 overflow-y-auto rounded-medium [--tk-skeleton-fill:var(--tk-background-content-tint)] ${
                                dirty ? 'pb-28' : ''
                            }`}
                        >
                            <div className="rounded-medium bg-backgroundContent">
                                {viewAssets.length > 0 ? (
                                    <>
                                        {viewAssets.map((asset, idx) => {
                                            const saved = isAssetVisible(
                                                asset,
                                                persistedVisibility
                                            );
                                            const visible = draft[asset.assetId] ?? saved;
                                            return (
                                                <div
                                                    key={asset.assetId}
                                                    className={
                                                        idx === 0
                                                            ? ''
                                                            : 'border-t border-separatorCommon'
                                                    }
                                                >
                                                    <ManageCryptoRow
                                                        asset={asset}
                                                        visible={visible}
                                                        onToggle={() =>
                                                            toggle(asset.assetId, visible, saved)
                                                        }
                                                    />
                                                </div>
                                            );
                                        })}
                                        <div ref={sentinelRef} aria-hidden />
                                        {isFetchingNextPage && (
                                            <div className="flex justify-center py-4">
                                                <Loader size="small" />
                                            </div>
                                        )}
                                        {isError && !isFetchingNextPage && (
                                            <InlineRetryRow onRetry={retryLoadMore} />
                                        )}
                                    </>
                                ) : (
                                    <div className="px-4 py-6 text-center text-body2 text-textSecondary">
                                        {t('add_funds_no_assets_found')}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </SkeletonScope>
            {dirty && (
                <ManageCryptoSaveBar
                    onSave={handleSave}
                    isSaving={isSaving}
                    compact={isFullWidth}
                />
            )}
            <MultichainFiltersSheet
                isOpen={filtersOpen}
                onClose={() => setFiltersOpen(false)}
                toggles={[
                    {
                        title: t('hide_no_cost_assets'),
                        subtitle: t('hide_no_cost_assets_desc'),
                        checked: hideDustAssets,
                        onChange: checked => mutateDustFilters({ hideDustBalances: checked })
                    }
                ]}
            />
        </Modal>
    );
};
