import { FC, useEffect, useMemo, useState } from 'react';

import { MultichainActivity } from '@tonkeeper/core/dist/service/multichainActivityService';
import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { SkeletonScope, useIsSkeleton } from '../../../../primitives';
import { useTranslation } from '../../../../hooks/translation';
import { useMultichainActivity } from '../../../../state/multichain/useMultichainActivity';
import { ListTitle } from '../ListTitle';
import { PLACEHOLDER_ACTIVITIES } from '../multichain-placeholders';
import { MultichainHistoryDetail } from '../history/MultichainHistoryDetail';
import { MultichainHistoryRow } from '../history/MultichainHistoryRow';
import { MultichainAssetHistoryModal } from './MultichainAssetHistoryModal';

const VISIBLE_COUNT = 3;

/**
 * "Transaction history" section on the asset page: the latest few wallet
 * activities involving this asset, with "See all" opening the same feed in
 * full. Shares its query with that view, so the modal opens already filled.
 */
export const MultichainAssetTransactionHistory: FC<{
    asset: MultichainWalletAsset;
}> = ({ asset }) => {
    const { t } = useTranslation();
    const [historyOpen, setHistoryOpen] = useState(false);
    const [selected, setSelected] = useState<MultichainActivity | undefined>(undefined);
    const { data, hasNextPage, isFetchingNextPage, fetchNextPage, isError } = useMultichainActivity(
        {
            assetId: asset.assetId
        }
    );
    const loaded = useMemo(() => (data?.pages ?? []).flatMap(page => page.activities), [data]);
    // The asset filter is server-side, but a backend page may still come
    // back short. Keep pulling until the preview is full or the cursor is
    // spent — otherwise older activity (and See all) vanish early.
    const needsMore = !isError && loaded.length < VISIBLE_COUNT && !!hasNextPage;
    useEffect(() => {
        if (needsMore && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [needsMore, isFetchingNextPage, fetchNextPage]);
    // The section's own query can resolve from cache while the page around it
    // is still loading — the scopes nest, so OR with the inherited state
    // instead of letting the inner scope reveal rows under a masked page.
    const isLoading = useIsSkeleton() || !data || (loaded.length === 0 && needsMore);

    const activities = isLoading
        ? PLACEHOLDER_ACTIVITIES.slice(0, 1)
        : loaded.slice(0, VISIBLE_COUNT);

    // Hidden only once the data proves there is nothing to show — while
    // loading the section holds its place with a masked row, per the mockup.
    if (!isLoading && activities.length === 0) return null;

    return (
        <section className="flex flex-col px-4 pb-4">
            <SkeletonScope loading={isLoading}>
                <ListTitle
                    title={t('wallet_asset_transaction_history')}
                    skeletonRightWidth={55}
                    right={
                        <button
                            type="button"
                            onClick={() => setHistoryOpen(true)}
                            className="cursor-pointer text-label2 text-textAccent transition-opacity duration-100 hover:opacity-80"
                        >
                            {t('wallet_asset_see_all')}
                        </button>
                    }
                />
                <div className="overflow-hidden rounded-medium bg-backgroundContent [--tk-skeleton-fill:var(--tk-background-content-tint)]">
                    {activities.map((activity, idx) => (
                        <div
                            key={activity.txIds.join(':') || idx}
                            className={idx === 0 ? '' : 'border-t border-separatorCommon'}
                        >
                            <MultichainHistoryRow
                                activity={activity}
                                grouped
                                withDate
                                onClick={isLoading ? undefined : () => setSelected(activity)}
                            />
                        </div>
                    ))}
                </div>
            </SkeletonScope>
            <MultichainHistoryDetail
                activity={selected}
                isOpen={selected !== undefined}
                onClose={() => setSelected(undefined)}
            />
            {historyOpen && (
                <MultichainAssetHistoryModal asset={asset} onClose={() => setHistoryOpen(false)} />
            )}
        </section>
    );
};
