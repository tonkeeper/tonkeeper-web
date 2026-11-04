import { FC } from 'react';
import { Route } from 'react-router-dom';

import { SkeletonScope } from '../../../../primitives';
import { ModalCenterError } from '../../../../components/shared/ModalCenterState';
import IcExclamationmarkCircle28 from '../../../../icons/components/IcExclamationmarkCircle28';
import { useNavigate } from '../../../../hooks/router/useNavigate';
import { MultichainRoute } from '../../../../libs/routes';
import { useShelvesConfig } from '../../../../state/trading/useShelvesConfig';
import { MultichainMobileTabBar } from '../MultichainMobileTabBar';
import { CryptoCatalogPage } from '../catalog/CryptoCatalogPage';
import { networkCodeFromLabel } from '../multichain-utils';
import { PLACEHOLDER_SHELF_GROUPS } from '../multichain-placeholders';
import { TradeFavoritesSection } from './TradeFavoritesSection';
import { TradeSearchEntry } from './TradeSearchEntry';
import { TradeShelfSection, TradeShelfSeeAllArgs } from './TradeShelfSection';

/**
 * Trade tab of the multichain shell: search entry on top, then the
 * server-configured shelf groups (trending, core tokens, commodities, top
 * movers, stocks & ETFs — whatever the config carries, in its order). The
 * page owns the column geometry and the mobile bottom bar, mirroring
 * `HomeMultichain`.
 *
 * The Crypto catalog (`MultichainRoute.tradeCrypto`) is nested here rather
 * than routed as a sibling so the shelves stay mounted, and scrolled, under
 * its modal.
 */
export const MultichainTradePage: FC<{ compact?: boolean }> = ({ compact = false }) => {
    const navigate = useNavigate();
    const { data, isError, refetch } = useShelvesConfig();
    // Retries are disabled on the shelves query, so a failure is terminal:
    // the shelves show a retry instead of masking the placeholders forever.
    // `keepPreviousData` carries the last good config through a failed
    // refresh, so only a first load with nothing cached lands here.
    const showError = data === undefined && isError;
    const isLoading = data === undefined && !isError;
    const groups = data?.groups ?? PLACEHOLDER_SHELF_GROUPS;

    const openCatalog = (params?: URLSearchParams) => {
        const query = params?.toString();
        navigate(`${MultichainRoute.tradeCrypto}${query ? `?${query}` : ''}`);
    };

    const onSeeAll = ({ chain, shelfKey, route }: TradeShelfSeeAllArgs) => {
        const params = new URLSearchParams();
        params.set('shelf', shelfKey);
        params.set('tab', route);
        if (chain !== 'All') params.set('chain', networkCodeFromLabel(chain));
        openCatalog(params);
    };

    return (
        <>
            <Route path={MultichainRoute.tradeCrypto}>
                <CryptoCatalogPage />
            </Route>
            <div className="mx-auto flex w-full max-w-[520px] flex-col gap-4 px-4 pb-8 pt-4 text-textPrimary">
                <TradeSearchEntry
                    onClick={() => openCatalog(new URLSearchParams({ focus: '1' }))}
                />
                <TradeFavoritesSection />
                {showError ? (
                    <ModalCenterError
                        icon={<IcExclamationmarkCircle28 />}
                        onRetry={() => refetch()}
                    />
                ) : (
                    <SkeletonScope loading={isLoading}>
                        {groups.map(group => (
                            <TradeShelfSection key={group.id} group={group} onSeeAll={onSeeAll} />
                        ))}
                    </SkeletonScope>
                )}
            </div>
            {!compact && (
                <>
                    <div className="h-20" aria-hidden />
                    <MultichainMobileTabBar />
                </>
            )}
        </>
    );
};
