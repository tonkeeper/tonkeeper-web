import { FC, useCallback, useLayoutEffect, useRef, useState } from 'react';

import {
    MultichainActivity,
    MultichainChain
} from '@tonkeeper/core/dist/service/multichainActivityService';

import { Loader, SkeletonScope, useSkeletonMask } from '../../../../primitives';
import { cn } from '../../../../libs/css';
import { scrollToContainersTop } from '../../../../libs/web';
import { useTranslation } from '../../../../hooks/translation';
import { BackButton } from '../../../../primitives/BackButton';
import { FiltersButton } from '../MultichainFiltersSheet';
import { MultichainChainChips } from '../MultichainChainChips';
import { InlineRetryRow } from '../../../../components/shared/InlineRetryRow';
import { MultichainHistoryEmptyState } from './MultichainHistoryEmptyState';
import { MultichainHistoryErrorState } from './MultichainHistoryErrorState';
import { MultichainHistoryRow } from './MultichainHistoryRow';
import {
    MultichainHistoryTypeFilter,
    MultichainHistoryTypeFilterValue
} from './MultichainHistoryTypeFilter';
import { PLACEHOLDER_ACTIVITIES } from '../multichain-placeholders';
import { historyGroupTitle } from './multichain-history-utils';

const MultichainHistoryHeader: FC<{ onBack: () => void; onOpenFilters?: () => void }> = ({
    onBack,
    onOpenFilters
}) => {
    const { t } = useTranslation();
    return (
        <header className="relative flex h-16 shrink-0 items-center justify-center px-16">
            <BackButton onClick={onBack} className="absolute left-2 top-1/2 -translate-y-1/2" />
            <div className="text-h3 text-textPrimary">{t('page_header_history')}</div>
            {onOpenFilters && (
                <FiltersButton
                    onClick={onOpenFilters}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                />
            )}
        </header>
    );
};

/**
 * Tracks whether the horizontally scrollable first child of `ref` still has
 * content past either edge, so each fade shows only while there is something
 * hidden behind it.
 */
function useChipsRowOverflow() {
    const ref = useRef<HTMLDivElement>(null);
    const [overflow, setOverflow] = useState({ left: false, right: false });

    const measure = useCallback(() => {
        const el = ref.current?.firstElementChild;
        if (!el) return;
        setOverflow({
            left: el.scrollLeft > 1,
            right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1
        });
    }, []);

    useLayoutEffect(() => {
        measure();
        const el = ref.current?.firstElementChild;
        if (!el || typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, [measure]);

    return { ref, overflow, onScrollCapture: measure };
}

/**
 * True once the sticky row has been pushed against the top of the scroll
 * area. Read off a sentinel in the flow above the row rather than the
 * container's `scrollTop`, so the row does not need to know which ancestor
 * scrolls it.
 */
function useIsStuck() {
    const sentinelRef = useRef<HTMLDivElement>(null);
    const [isStuck, setIsStuck] = useState(false);

    useLayoutEffect(() => {
        const el = sentinelRef.current;
        if (!el || typeof IntersectionObserver === 'undefined') return;
        const observer = new IntersectionObserver(([entry]) => setIsStuck(!entry.isIntersecting), {
            threshold: 0
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return { sentinelRef, isStuck };
}

/**
 * The desktop column's chips row: the chips break out of the box's 8px
 * padding by 16px, so they scroll flush to its edges while the box clips
 * them 8px short of the column edge and 8px before the filters button.
 *
 * The row pins to the top of the column and lifts off the feed with a
 * shadow once rows start passing under it.
 */
const CompactChainChipsRow: FC<{
    chain?: MultichainChain;
    onSelectChain: (chain?: MultichainChain) => void;
    onOpenFilters?: () => void;
}> = ({ chain, onSelectChain, onOpenFilters }) => {
    const { ref, overflow, onScrollCapture } = useChipsRowOverflow();
    const { sentinelRef, isStuck } = useIsStuck();

    return (
        <>
            <div ref={sentinelRef} className="-mb-px h-px" />
            <div
                className={cn(
                    'sticky top-0 z-10 flex items-center gap-2 bg-backgroundPage py-2 pl-2 pr-4 transition-shadow',
                    isStuck && 'shadow-[0_4px_16px_rgba(0,0,0,0.16),0_16px_64px_rgba(0,0,0,0.24)]'
                )}
            >
                <div
                    ref={ref}
                    onScrollCapture={onScrollCapture}
                    className="relative min-w-0 flex-1 overflow-hidden px-2"
                >
                    <MultichainChainChips
                        value={chain}
                        onChange={next => onSelectChain(next as MultichainChain | undefined)}
                    />
                    {overflow.left && (
                        <div className="pointer-events-none absolute inset-y-0 left-0 w-[62px] bg-gradient-to-r from-backgroundPage to-transparent" />
                    )}
                    {overflow.right && (
                        <div className="pointer-events-none absolute inset-y-0 right-0 w-[62px] bg-gradient-to-l from-backgroundPage to-transparent" />
                    )}
                </div>
                {onOpenFilters && <FiltersButton onClick={onOpenFilters} className="shrink-0" />}
            </div>
        </>
    );
};

export type MultichainHistoryGroup = [string, MultichainActivity[]];

export interface MultichainHistoryViewProps {
    /** Rendered inside the desktop shell's 520px column: no in-page header, sticky filter. */
    compact?: boolean;
    /**
     * Hidden for a single-asset feed — the asset fixes the chain, so there is
     * nothing to switch between (matches iOS, which builds no chain tabs
     * when it opens history for one asset).
     */
    showChainFilter?: boolean;
    language: string;
    chain?: MultichainChain;
    onSelectChain: (chain?: MultichainChain) => void;
    typeFilter?: MultichainHistoryTypeFilterValue;
    onSelectTypeFilter: (value?: MultichainHistoryTypeFilterValue) => void;
    groups: MultichainHistoryGroup[];
    isLoading: boolean;
    /**
     * A filter just changed and its first page is in flight: the rows are
     * masked like the initial load, but the chips stay live — the one just
     * tapped must keep its label and selection.
     */
    isReloading?: boolean;
    isEmpty: boolean;
    isError: boolean;
    onRetry: () => void;
    hasFilter: boolean;
    showTypeFilter: boolean;
    isFetchingNextPage: boolean;
    /** A page after the first failed: the loaded rows stay, a retry row follows them. */
    isLoadMoreError?: boolean;
    onRetryLoadMore?: () => void;
    sentinelRef?: (el: HTMLDivElement | null) => void;
    onBack: () => void;
    onAddFunds: () => void;
    onSelectActivity: (activity: MultichainActivity) => void;
    /**
     * Opens the Filters sheet — from the in-page header on mobile, from the
     * chips row in the compact column. Absent for the single-asset feed,
     * which has no filters.
     */
    onOpenFilters?: () => void;
}

/** Date-group title stand-in above the masked rows. */
const HistoryGroupTitleBar: FC = () => {
    const mask = useSkeletonMask();
    return (
        <div className="px-4 pb-2 pt-4">
            <span {...mask({ w: 107, h: 24, r: 12 })} className="text-label1 text-textPrimary">
                0
            </span>
        </div>
    );
};

export const MultichainHistoryView: FC<MultichainHistoryViewProps> = ({
    compact = false,
    showChainFilter = true,
    language,
    chain,
    onSelectChain,
    typeFilter,
    onSelectTypeFilter,
    groups,
    isLoading,
    isReloading = false,
    isEmpty,
    isError,
    onRetry,
    hasFilter,
    showTypeFilter,
    isFetchingNextPage,
    isLoadMoreError = false,
    onRetryLoadMore,
    sentinelRef,
    onBack,
    onAddFunds,
    onSelectActivity,
    onOpenFilters
}) => {
    // A new filter replaces the feed, and the type pill is reachable from any
    // depth — without a reset the fresh first page would open mid-scroll or
    // past its end.
    const rootRef = useRef<HTMLDivElement>(null);
    const isInitialFilter = useRef(true);
    useLayoutEffect(() => {
        if (isInitialFilter.current) {
            isInitialFilter.current = false;
            return;
        }
        if (rootRef.current) scrollToContainersTop(rootRef.current);
    }, [chain, typeFilter]);

    const rootClass = cn(
        'flex flex-col bg-backgroundPage',
        compact ? 'min-h-full' : 'min-h-screen',
        // Clear the fixed pill on mobile; the sticky pill takes flow space on desktop.
        showTypeFilter && !compact && 'pb-[88px]'
    );

    return (
        <div ref={rootRef} className={rootClass}>
            {!compact && <MultichainHistoryHeader onBack={onBack} onOpenFilters={onOpenFilters} />}

            <SkeletonScope loading={isLoading}>
                {showChainFilter && !compact && (
                    <div className="px-4 py-2">
                        <MultichainChainChips
                            value={chain}
                            onChange={next => onSelectChain(next as MultichainChain | undefined)}
                        />
                    </div>
                )}

                {showChainFilter && compact && (
                    <CompactChainChipsRow
                        chain={chain}
                        onSelectChain={onSelectChain}
                        onOpenFilters={onOpenFilters}
                    />
                )}
            </SkeletonScope>

            <SkeletonScope loading={isLoading || isReloading}>
                {(isLoading || isReloading) && (
                    <section className="flex flex-col">
                        <HistoryGroupTitleBar />
                        <div className="flex flex-col gap-2 px-4">
                            {PLACEHOLDER_ACTIVITIES.slice(0, 8).map((activity, i) => (
                                <MultichainHistoryRow key={i} activity={activity} />
                            ))}
                        </div>
                    </section>
                )}
            </SkeletonScope>

            {isError && (
                <div className="flex flex-1 items-center justify-center py-16">
                    <MultichainHistoryErrorState onRetry={onRetry} />
                </div>
            )}

            {isEmpty && (
                <div className="flex flex-1 items-center justify-center py-16">
                    <MultichainHistoryEmptyState filtered={hasFilter} onAddFunds={onAddFunds} />
                </div>
            )}

            {!isEmpty &&
                !isError &&
                groups.map(([key, items]) => (
                    <section key={key} className="flex flex-col">
                        <div className="px-4 pb-2 pt-4 text-label1 text-textPrimary">
                            {historyGroupTitle(language, key, items[0].blockTimeMs)}
                        </div>
                        <div className="flex flex-col gap-2 px-4">
                            {items.map((activity, i) => (
                                <MultichainHistoryRow
                                    key={`${activity.txIds[0] ?? activity.blockTimeMs}-${i}`}
                                    activity={activity}
                                    onClick={() => onSelectActivity(activity)}
                                />
                            ))}
                        </div>
                    </section>
                ))}

            {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                    <Loader />
                </div>
            )}
            {isLoadMoreError && onRetryLoadMore && (
                <InlineRetryRow onRetry={onRetryLoadMore} className="pt-4" />
            )}
            <div ref={sentinelRef} />

            {showTypeFilter && (
                <MultichainHistoryTypeFilter
                    value={typeFilter}
                    onChange={onSelectTypeFilter}
                    compact={compact}
                />
            )}
        </div>
    );
};
