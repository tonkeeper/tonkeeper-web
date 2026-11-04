import { FC, useEffect, useMemo, useRef, useState } from 'react';

import {
    MultichainActivity,
    MultichainChain
} from '@tonkeeper/core/dist/service/multichainActivityService';

import { useNavigate } from '../../../../hooks/router/useNavigate';
import { useNavigateBack } from '../../../../hooks/router/useNavigateBack';
import { useTranslation } from '../../../../hooks/translation';
import { useFetchNext } from '../../../../hooks/useFetchNext';
import {
    MULTICHAIN_ACTION_ADD_FUNDS,
    MULTICHAIN_ACTION_FROM_PARAM,
    MULTICHAIN_ACTION_PARAM,
    MultichainRoute
} from '../../../../libs/routes';
import { useInternetConnection } from '../../../../hooks/useInternetConnection';
import { useMultichainActivity } from '../../../../state/multichain/useMultichainActivity';
import { useDustFilters, useMutateDustFilters } from '../../../../state/multichain/useDustFilters';
import { MultichainFiltersSheet } from '../MultichainFiltersSheet';
import { MultichainHistoryDetail } from './MultichainHistoryDetail';
import {
    historyTypeFilterToQuery,
    MultichainHistoryTypeFilterValue
} from './MultichainHistoryTypeFilter';
import { MultichainHistoryView } from './MultichainHistoryView';
import { groupMultichainActivities } from './multichain-history-utils';

export const MultichainHistory: FC<{
    compact?: boolean;
    /** Restricts the feed to one asset (the asset page's "See all"). */
    assetId?: string;
    /** Replaces the default "back to home" exit, e.g. closing a host modal. */
    onBack?: () => void;
}> = ({ compact = false, assetId, onBack }) => {
    const {
        t,
        i18n: { language }
    } = useTranslation();
    const navigate = useNavigate();
    const navigateBack = useNavigateBack(MultichainRoute.home);
    const [chain, setChain] = useState<MultichainChain | undefined>(undefined);
    const [typeFilter, setTypeFilter] = useState<MultichainHistoryTypeFilterValue | undefined>(
        undefined
    );
    const [selected, setSelected] = useState<MultichainActivity | undefined>(undefined);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const { data: dustFilters } = useDustFilters();
    const { mutate: mutateDustFilters } = useMutateDustFilters();
    const hideDustActive = dustFilters?.hideDustActivities === true;

    const {
        data,
        isLoading,
        isError,
        isPreviousData,
        refetch,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage
    } = useMultichainActivity({ chain, ...historyTypeFilterToQuery(typeFilter), assetId });

    const activities = useMemo(() => (data?.pages ?? []).flatMap(page => page.activities), [data]);
    const groups = useMemo(() => groupMultichainActivities(activities), [activities]);

    // Rows on screen right after a filter change are the previous filter's
    // (the query keeps them until the new first page lands): the feed masks
    // them with the skeleton, and the sentinel stays disarmed so the old
    // cursor is never paged. A failed first page falls back to the footer
    // retry over those rows. A failed page must not keep the sentinel armed
    // either — it is still in view, so scrolling would refire the same
    // request; the footer's Retry is the way forward after an error.
    const isRefiltering = isPreviousData && !isError;
    const setSentinelRef = useFetchNext(
        hasNextPage && !isError && !isPreviousData,
        isFetchingNextPage,
        fetchNextPage
    );

    // Retries are disabled, so a fetch that failed offline is terminal.
    // Refetch when connectivity returns instead of stranding the error
    // placeholder until a manual Try again. The initial value is skipped —
    // only an offline→online transition triggers.
    const { isConnected } = useInternetConnection();
    const wasConnected = useRef(isConnected);
    useEffect(() => {
        if (isConnected && !wasConnected.current) {
            void refetch();
        }
        wasConnected.current = isConnected;
    }, [isConnected, refetch]);

    // The asset scope counts as a filter: an asset with no activity yet is not
    // the first-run empty wallet the Add Funds prompt is for. So does the dust
    // filter — with it on, an empty feed may just be all-dust.
    const hasFilter =
        chain !== undefined || typeFilter !== undefined || assetId !== undefined || hideDustActive;
    // The feed retries are disabled, so a failed fetch is terminal: surface it
    // as an error rather than letting a zero-activity result masquerade as an
    // empty wallet. With rows already on screen — a later page failed, or a
    // refresh did — the error goes to the footer so the loaded feed stays.
    const showError = !isLoading && isError && activities.length === 0;
    const showLoadMoreError = isError && activities.length > 0 && !isFetchingNextPage;
    // Rows shown under a new filter are the previous filter's until its own
    // first page lands, so a failure there is a first-page retry.
    const retryLoadMore = () => (isPreviousData || !hasNextPage ? refetch() : fetchNextPage());
    // A loaded page can hold nothing while later pages still do (the primary-
    // TON-variant filter runs client-side) — only a spent cursor proves the
    // feed is empty, and until then the screen stays in its loading state
    // instead of flashing empty between page fetches.
    const isEmpty = !isLoading && !isError && activities.length === 0 && !hasNextPage;
    const showLoading = isLoading || (!isError && activities.length === 0 && !!hasNextPage);
    // First-run empty (nothing ever, no filter) is the only state without the
    // type-filter pill — it shows the Add Funds prompt instead (per the mockup).
    const pureEmpty = isEmpty && !hasFilter;
    const showTypeFilter = !showLoading && !showError && !pureEmpty;

    return (
        <>
            <MultichainHistoryView
                compact={compact}
                showChainFilter={assetId === undefined}
                language={language}
                chain={chain}
                onSelectChain={setChain}
                typeFilter={typeFilter}
                onSelectTypeFilter={setTypeFilter}
                groups={isRefiltering ? [] : groups}
                isLoading={showLoading}
                isReloading={isRefiltering}
                isEmpty={isEmpty}
                isError={showError}
                onRetry={() => refetch()}
                isLoadMoreError={showLoadMoreError}
                onRetryLoadMore={retryLoadMore}
                hasFilter={hasFilter}
                showTypeFilter={showTypeFilter}
                isFetchingNextPage={isFetchingNextPage}
                sentinelRef={setSentinelRef}
                onBack={onBack ?? navigateBack}
                onAddFunds={() =>
                    navigate(
                        `${MultichainRoute.home}?${MULTICHAIN_ACTION_PARAM}=${MULTICHAIN_ACTION_ADD_FUNDS}&${MULTICHAIN_ACTION_FROM_PARAM}=history_screen`
                    )
                }
                onSelectActivity={setSelected}
                onOpenFilters={assetId === undefined ? () => setFiltersOpen(true) : undefined}
            />

            <MultichainFiltersSheet
                isOpen={filtersOpen}
                onClose={() => setFiltersOpen(false)}
                toggles={[
                    {
                        title: t('hide_tiny_transfers'),
                        subtitle: t('hide_tiny_transfers_desc'),
                        checked: hideDustActive,
                        onChange: checked => mutateDustFilters({ hideDustActivities: checked })
                    }
                ]}
            />

            <MultichainHistoryDetail
                activity={selected}
                isOpen={selected !== undefined}
                onClose={() => setSelected(undefined)}
            />
        </>
    );
};
