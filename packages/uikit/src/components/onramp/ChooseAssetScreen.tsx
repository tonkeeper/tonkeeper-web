import { FC, useEffect, useMemo, useRef, useState } from 'react';
import type { OnrampAsset } from '@tonkeeper/core/dist/onrampApi';
import { MULTICHAIN_CHAIN_DISPLAY_ORDER } from '@tonkeeper/core/dist/chains/multichain-chain-order';
import { isSameAssetId } from '@tonkeeper/core/dist/service/chainkit/multichainSwapService';

import { ChainChip, SkeletonScope } from '../../primitives';
import { Modal } from '../../primitives/Modal';
import { SearchField } from '../../primitives/SearchField';
import { useTranslation } from '../../hooks/translation';
import {
    isNativeRow,
    networkLabel,
    parseAssetIdHead
} from '../../pages/home/multichain/multichain-utils';
import { MultichainChainChips } from '../../pages/home/multichain/MultichainChainChips';
import { TokenCell, TokenCellIcon } from '../../pages/home/multichain/TokenCell';
import IcDonemarkOutline28 from '../../icons/components/IcDonemarkOutline28';
import IcExclamationmarkCircle28 from '../../icons/components/IcExclamationmarkCircle28';
import { ModalCenterError } from '../shared/ModalCenterState';
import { InlineRetryRow } from '../shared/InlineRetryRow';
import { useOnrampCatalog, useOnrampChains } from '../../state/onramp';

/** Purchasable asset row derived from an `OnrampAsset`. */
export interface OnrampAssetRow {
    /** First-segment chain identifier (e.g. `ton`, `eth`, `btc`). */
    chain: string;
    assetId: string;
    symbol: string;
    /** Display name; absent when the backend has none. */
    name?: string;
    image?: string;
}

export interface ChooseAssetScreenProps {
    isOpen: boolean;
    onClose: () => void;
    /** Called when the user taps an asset row. */
    onSelect: (asset: OnrampAssetRow) => void;
    /**
     * Called when the user taps the back arrow. When omitted, no back
     * arrow is shown.
     */
    onBack?: () => void;
    /** Currently-picked asset — shows a check when re-opened from a later step. */
    selectedAssetId?: string;
    /** Loaded pages, flattened; `undefined` until the first page lands. */
    assets?: OnrampAsset[];
    /** Chain chips, as first asset-id segments. */
    chains?: readonly string[];
    search: string;
    onSearchChange: (search: string) => void;
    /** `undefined` = the "All" chip. */
    chain?: string;
    onChainChange: (chain?: string) => void;
    isLoading?: boolean;
    /**
     * The last request failed. With nothing loaded this is the full-screen
     * error; otherwise a retry row under the rows already shown.
     */
    isError?: boolean;
    onRetry?: () => void;
    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
    onLoadMore?: () => void;
}

export type ChooseAssetContentProps = Omit<ChooseAssetScreenProps, 'isOpen' | 'onClose' | 'onBack'>;

const buildRows = (assets: OnrampAsset[]): OnrampAssetRow[] =>
    assets.map(a => ({
        chain: parseAssetIdHead(a.assetId).network,
        assetId: a.assetId,
        symbol: a.symbol,
        name: a.name || undefined,
        image: a.image
    }));

const AssetRow: FC<{ row: OnrampAssetRow; selected: boolean; onClick: () => void }> = ({
    row,
    selected,
    onClick
}) => (
    <TokenCell
        onClick={onClick}
        selected={selected}
        className="transition-colors hover:bg-backgroundContentTint"
        icon={<TokenCellIcon assetId={row.assetId} image={row.image} />}
        title={row.symbol}
        titleExtras={!isNativeRow(row.assetId) && <ChainChip label={networkLabel(row.chain)} />}
        subtitle={row.name}
        accessory={
            selected && (
                <span className="shrink-0 text-textAccent">
                    <IcDonemarkOutline28 className="h-6 w-6" />
                </span>
            )
        }
    />
);

const PLACEHOLDER_ROWS: OnrampAssetRow[] = Array.from({ length: 8 }, (_, index) => ({
    chain: 'placeholder',
    assetId: `placeholder/mainnet/token/${index}`,
    symbol: 'TOKEN',
    name: 'Token name'
}));

const PLACEHOLDER_CHAINS = MULTICHAIN_CHAIN_DISPLAY_ORDER;

export const ChooseAssetContent: FC<ChooseAssetContentProps> = ({
    onSelect,
    selectedAssetId,
    assets,
    chains,
    search,
    onSearchChange,
    chain,
    onChainChange,
    isLoading,
    isError,
    onRetry,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore
}) => {
    const { t } = useTranslation();

    const rows = useMemo(() => (assets ? buildRows(assets) : undefined), [assets]);
    const showError = Boolean(isError) && rows === undefined;
    const showSkeleton = Boolean(isLoading) && rows === undefined && !showError;
    const viewRows = showSkeleton ? PLACEHOLDER_ROWS : rows ?? [];
    const chainFilters = showSkeleton ? PLACEHOLDER_CHAINS : chains ?? [];

    // A failed page must not re-arm the observer: the sentinel is still in
    // view, so it would refire the same request in a loop. The footer's
    // Retry is the only way forward after an error.
    const sentinelRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel || !hasNextPage || isError || !onLoadMore) return;
        const observer = new IntersectionObserver(entries => {
            if (entries.some(e => e.isIntersecting) && !isFetchingNextPage) {
                onLoadMore();
            }
        });
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, onLoadMore, isError]);

    return (
        <>
            {showError && (
                <ModalCenterError
                    icon={<IcExclamationmarkCircle28 />}
                    onRetry={() => onRetry?.()}
                />
            )}
            {!showError && (
                <SkeletonScope loading={showSkeleton}>
                    <div className="flex h-full flex-col">
                        <div className="flex shrink-0 flex-col gap-3 pb-3">
                            <SearchField
                                value={search}
                                onChange={onSearchChange}
                                placeholder={t('send_choose_asset_search')}
                                className="!p-0"
                            />

                            <MultichainChainChips
                                value={chain}
                                onChange={onChainChange}
                                chains={chainFilters}
                            />
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            <div className="overflow-hidden rounded-medium bg-backgroundContent">
                                {viewRows.length === 0 && !isError ? (
                                    <p className="py-8 text-center text-body2 text-textSecondary">
                                        {t('add_funds_no_assets_found')}
                                    </p>
                                ) : (
                                    viewRows.map((row, idx) => (
                                        <div
                                            key={row.assetId}
                                            className={
                                                idx === 0 ? '' : 'border-t border-separatorCommon'
                                            }
                                        >
                                            <AssetRow
                                                row={row}
                                                selected={
                                                    !!selectedAssetId &&
                                                    isSameAssetId(row.assetId, selectedAssetId)
                                                }
                                                onClick={() => onSelect(row)}
                                            />
                                        </div>
                                    ))
                                )}
                                {isError && rows !== undefined && onRetry && (
                                    <InlineRetryRow
                                        onRetry={onRetry}
                                        className={
                                            viewRows.length > 0
                                                ? 'border-t border-separatorCommon'
                                                : undefined
                                        }
                                    />
                                )}
                            </div>
                            {hasNextPage && !isError && <div ref={sentinelRef} className="h-px" />}
                        </div>
                    </div>
                </SkeletonScope>
            )}
        </>
    );
};

export interface OnrampAssetPickerProps {
    onSelect: (asset: OnrampAssetRow) => void;
    selectedAssetId?: string;
    /** Sent to the backend, which narrows the list to assets buyable with it. */
    fiat?: string;
    /** Called once, with the first unfiltered page, when the list is first shown. */
    onViewed?: (assetIds: string[]) => void;
}

export const OnrampAssetPicker: FC<OnrampAssetPickerProps> = ({
    onSelect,
    selectedAssetId,
    fiat,
    onViewed
}) => {
    const [search, setSearch] = useState('');
    const [chain, setChain] = useState<string | undefined>(undefined);

    const { data: chains } = useOnrampChains(fiat);
    const {
        assets,
        isLoading,
        isError,
        isPreviousData,
        refetch,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage
    } = useOnrampCatalog({ search, chain, fiat });

    const viewedRef = useRef(false);
    useEffect(() => {
        if (viewedRef.current || !assets || isPreviousData) return;
        if (search.trim() || chain) return;
        viewedRef.current = true;
        onViewed?.(assets.map(a => a.assetId));
    }, [assets, isPreviousData, search, chain, onViewed]);

    // Rows shown under a new filter are the previous filter's until its own
    // first page lands, so a failure there is a first-page retry, not a
    // next-page one.
    const retry = () => (isPreviousData || !hasNextPage ? refetch() : fetchNextPage());

    return (
        <ChooseAssetContent
            onSelect={onSelect}
            selectedAssetId={selectedAssetId}
            assets={assets}
            chains={chains}
            search={search}
            onSearchChange={setSearch}
            chain={chain}
            onChainChange={setChain}
            isLoading={isLoading}
            isError={isError}
            onRetry={retry}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={fetchNextPage}
        />
    );
};

export const ChooseAssetScreen: FC<ChooseAssetScreenProps> = ({
    isOpen,
    onClose,
    onBack,
    ...contentProps
}) => {
    const { t } = useTranslation();

    return (
        // `variant="content"` + `mobileHeight="full"` keep the sheet a constant size while the
        // user filters — otherwise the modal grows/shrinks with the result count,
        // which is jarring (the search field jumps under the cursor). The search +
        // chips stick to the top; only the result list scrolls.
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            onBack={onBack}
            topBarTitle={t('add_funds_choose_asset_title')}
            variant="content"
            mobileHeight="full"
        >
            <ChooseAssetContent {...contentProps} />
        </Modal>
    );
};
