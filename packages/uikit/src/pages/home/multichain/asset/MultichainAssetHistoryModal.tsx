import { FC } from 'react';

import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { useTranslation } from '../../../../hooks/translation';
import { BackButton } from '../../../../primitives/BackButton';
import { Modal } from '../../../../primitives/Modal';
import { MultichainHistory } from '../history/MultichainHistory';
import { networkLabel, parseAssetIdHead } from '../multichain-utils';

/**
 * The asset page's "See all": the full History screen scoped to this asset,
 * on top of the page rather than replacing it — same as iOS, which pushes
 * its history screen with the asset id instead of the wallet-wide feed.
 *
 * The header names the token and its chain, since the feed itself is the
 * only other thing saying it isn't the wallet-wide history, and it lives
 * here rather than inside the scroll area so it stays put while the feed
 * scrolls. The history renders in its compact form in both sizes for the
 * same reason (no header of its own, type-filter pill sticky).
 */
export const MultichainAssetHistoryModal: FC<{
    asset: MultichainWalletAsset;
    onClose: () => void;
}> = ({ asset, onClose }) => {
    const { t } = useTranslation();
    const { network } = parseAssetIdHead(asset.assetId);

    return (
        <Modal isOpen onClose={onClose} bare>
            <header className="relative flex h-16 shrink-0 flex-col items-center justify-center px-16">
                <BackButton
                    onClick={onClose}
                    className="absolute left-2 top-1/2 -translate-y-1/2"
                />
                <div className="text-h3 text-textPrimary">{t('page_header_history')}</div>
                <div className="truncate text-body2 text-textSecondary">
                    {asset.symbol} · {networkLabel(network)}
                </div>
            </header>
            <div className="hide-scrollbar flex-1 overflow-y-auto">
                <MultichainHistory compact assetId={asset.assetId} onBack={onClose} />
            </div>
        </Modal>
    );
};
