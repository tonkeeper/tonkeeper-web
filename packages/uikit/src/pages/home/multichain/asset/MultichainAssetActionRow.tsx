import { FC, ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { cn } from '../../../../libs/css';
import {
    MULTICHAIN_ACTION_PARAM,
    MULTICHAIN_ACTION_SELL,
    MultichainRoute
} from '../../../../libs/routes';
import { useNavigate } from '../../../../hooks/router/useNavigate';
import { useTranslation } from '../../../../hooks/translation';
import { useTrackAssetButtonClick } from '../../../../hooks/analytics/asset-button-click';
import { MultichainSendFlow } from '../../../../components/transfer/multichain/MultichainSendFlow';
import { MultichainReceiveSheet } from '../../../../components/receive/MultichainReceiveSheet';
import { receiveChainForNetwork } from '../../../../components/receive/receiveChains';
import { parseAssetIdHead } from '../multichain-utils';
import { OfframpFlow } from '../../../../components/offramp/OfframpFlow';
import { OnrampFlow } from '../../../../components/onramp/OnrampFlow';
import IcDollarOutlineMinus16 from '../../../../icons/components/IcDollarOutlineMinus16';
import IcDollarOutlinePlus16 from '../../../../icons/components/IcDollarOutlinePlus16';
import IcLinkSmall16 from '../../../../icons/components/IcLinkSmall16';
import IcQrCode16 from '../../../../icons/components/IcQrCode16';

const ActionButton: FC<{ icon: ReactNode; label: string; onClick: () => void }> = ({
    icon,
    label,
    onClick
}) => (
    <button
        type="button"
        onClick={onClick}
        className="flex h-[60px] min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-medium bg-buttonSecondaryBackground px-1 pb-2.5 pt-3 text-buttonSecondaryForeground transition-colors duration-100 hover:bg-buttonSecondaryBackgroundHighlighted"
    >
        <span className="size-4 shrink-0">{icon}</span>
        <span className="max-w-full truncate text-label3">{label}</span>
    </button>
);

/**
 * Icon-button row under the balance card (Figma 14859:280092): Send, Receive,
 * Cash buy and Cash sell. Send and Cash sell need something to send; the cash
 * buttons follow the asset's onramp / offramp capabilities. Cash buy opens the
 * buy flow with this asset preselected.
 */
export const MultichainAssetActionRow: FC<{
    asset: MultichainWalletAsset;
    hasBalance: boolean;
    canCashBuy: boolean;
    canCashSell: boolean;
    className?: string;
}> = ({ asset, hasBalance, canCashBuy, canCashSell, className }) => {
    const { t } = useTranslation();
    const trackButtonClick = useTrackAssetButtonClick();
    const navigate = useNavigate();
    const location = useLocation();
    const [sendOpen, setSendOpen] = useState(false);
    const [receiveOpen, setReceiveOpen] = useState(false);
    const [buyOpen, setBuyOpen] = useState(false);
    const [sellOpen, setSellOpen] = useState(false);
    const receiveChain = receiveChainForNetwork(parseAssetIdHead(asset.assetId).network);

    // The `withdraw` deeplink lands here with an action flag; the flag is
    // stripped so back-nav or a refresh doesn't reopen the flow. An asset
    // that can't be cashed out just shows the page.
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get(MULTICHAIN_ACTION_PARAM) !== MULTICHAIN_ACTION_SELL) return;
        if (canCashSell) setSellOpen(true);
        navigate(`${MultichainRoute.asset}/${encodeURIComponent(asset.assetId)}`, {
            replace: true
        });
    }, [location.search, navigate, canCashSell, asset.assetId]);

    return (
        <div className={cn('flex gap-2 px-4 pb-4', className)}>
            {hasBalance && (
                <ActionButton
                    icon={<IcLinkSmall16 className="size-4" />}
                    label={t('wallet_send')}
                    onClick={() => {
                        trackButtonClick('send', asset.assetId);
                        setSendOpen(true);
                    }}
                />
            )}
            <ActionButton
                icon={<IcQrCode16 className="size-4" />}
                label={t('wallet_receive')}
                onClick={() => {
                    trackButtonClick('receive', asset.assetId);
                    setReceiveOpen(true);
                }}
            />
            {canCashBuy && (
                <ActionButton
                    icon={<IcDollarOutlinePlus16 className="size-4" />}
                    label={t('wallet_asset_cash_buy')}
                    onClick={() => setBuyOpen(true)}
                />
            )}
            {canCashSell && hasBalance && (
                <ActionButton
                    icon={<IcDollarOutlineMinus16 className="size-4" />}
                    label={t('wallet_asset_cash_sell')}
                    onClick={() => setSellOpen(true)}
                />
            )}

            {/* Mounted only once opened so the row (and its component test)
                stays free of the send flow's data hooks until it's used. */}
            {sendOpen && (
                <MultichainSendFlow
                    isOpen
                    onClose={() => setSendOpen(false)}
                    initialAsset={asset}
                    from="jetton_screen"
                />
            )}
            {receiveOpen && (
                <MultichainReceiveSheet
                    isOpen
                    onClose={() => setReceiveOpen(false)}
                    chain={receiveChain?.id}
                />
            )}
            {buyOpen && (
                <OnrampFlow
                    isOpen
                    onClose={() => setBuyOpen(false)}
                    from="jetton_screen"
                    buyAsset={{ assetId: asset.assetId, symbol: asset.symbol, image: asset.image }}
                />
            )}
            {sellOpen && <OfframpFlow isOpen onClose={() => setSellOpen(false)} asset={asset} />}
        </div>
    );
};
