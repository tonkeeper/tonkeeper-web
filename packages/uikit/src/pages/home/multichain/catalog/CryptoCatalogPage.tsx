import { FC } from 'react';
import { useLocation } from 'react-router-dom';

import { catalogPresetForShelf } from '@tonkeeper/core/dist/service/tradingService';

import { TRADE_TAB_SOURCE } from '../../../../hooks/analytics/trade';
import { useNavigateBack } from '../../../../hooks/router/useNavigateBack';
import { MultichainRoute } from '../../../../libs/routes';
import { Modal } from '../../../../primitives/Modal';
import { networkCodeFromLabel } from '../multichain-utils';
import { CryptoCatalogHeader } from './CryptoCatalogHeader';
import { CryptoCatalogView } from './CryptoCatalogView';

/**
 * Routed Crypto page (`MultichainRoute.tradeCrypto`) — the Trade tab's
 * search / "see all" target. Query params seed the view: `chain` (display
 * name or code), `tab` (the shelf's see-all route) and `shelf` (resolved
 * together into the catalog tab / filter / sort and passed through as
 * `source_shelf`), `focus=1` (autofocus the search field).
 *
 * Renders in the same bare-`Modal` chrome as the home "Crypto" modal — same
 * sheet geometry, internal scroll and pinned sort pill — with a back chevron
 * instead of the close affordance. Nested inside `MultichainTradePage`, which
 * keeps its shelves mounted underneath; closing (Escape, backdrop) navigates
 * back to them.
 */
export const CryptoCatalogPage: FC = () => {
    const navigateBack = useNavigateBack(MultichainRoute.trade);
    const { search } = useLocation();
    const params = new URLSearchParams(search);

    const chainParam = params.get('chain') ?? undefined;
    const shelf = params.get('shelf') ?? undefined;
    const preset = catalogPresetForShelf({
        shelfKey: shelf,
        route: params.get('tab') ?? undefined
    });

    return (
        <Modal isOpen onClose={navigateBack} bare>
            <CryptoCatalogHeader onBack={navigateBack} />
            <CryptoCatalogView
                key={search}
                initialChain={chainParam ? networkCodeFromLabel(chainParam) : undefined}
                initialSorting={preset.sorting}
                tab={preset.tab}
                filter={preset.filter}
                sourceShelf={shelf}
                autoFocusSearch={params.get('focus') === '1'}
                assetViewSource="trade_screen"
                tradeSource={TRADE_TAB_SOURCE}
            />
        </Modal>
    );
};
