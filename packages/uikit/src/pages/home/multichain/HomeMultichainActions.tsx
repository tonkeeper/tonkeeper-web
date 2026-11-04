import { FC, ReactNode, useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { IconButton, useIsSkeleton, useSkeletonMask } from '../../../primitives';
import { cn } from '../../../libs/css';
import { RampSource, toRampSource } from '../../../hooks/analytics/ramp-flow';
import { StakingSource } from '../../../hooks/analytics/staking';
import { useTranslation } from '../../../hooks/translation';
import { useNavigate } from '../../../hooks/router/useNavigate';
import {
    MULTICHAIN_ACTION_ADD_FUNDS,
    MULTICHAIN_ACTION_ASSET_PARAM,
    MULTICHAIN_ACTION_FROM_PARAM,
    MULTICHAIN_ACTION_PARAM,
    MULTICHAIN_ACTION_RECEIVE,
    MULTICHAIN_ACTION_STAKE,
    MULTICHAIN_ACTION_SWAP,
    MultichainRoute
} from '../../../libs/routes';
import { SendIcon, ReceiveIcon } from '../../../components/home/HomeIcons';
import IcSwapHorizontalOutline28 from '../../../icons/components/IcSwapHorizontalOutline28';
import IcStakingOutline28 from '../../../icons/components/IcStakingOutline28';
import { OnrampBuyAsset, OnrampFlow, OnrampFlowEntry } from '../../../components/onramp/OnrampFlow';
import { MultichainSendFlow } from '../../../components/transfer/multichain/MultichainSendFlow';
import { MultichainSwapFlow } from './swap/MultichainSwapFlow';
import { MultichainStakeFlow } from './staking/MultichainStakeFlow';

/**
 * Desktop action button: the whole column — icon chip plus label — sits on a
 * solid `content` card that stretches to share the row equally, unlike the
 * mobile `IconButton`, whose chip floats on a transparent background.
 */
const ActionCardButton: FC<{
    icon: ReactNode;
    label: ReactNode;
    onClick: () => void;
}> = ({ icon, label, onClick }) => {
    const isSkeleton = useIsSkeleton();
    const mask = useSkeletonMask();

    return (
        <button
            type="button"
            onClick={isSkeleton ? undefined : onClick}
            className={cn(
                'flex min-w-0 flex-1 select-none flex-col items-center rounded-2xl bg-backgroundContent px-1 pb-2 text-center',
                !isSkeleton &&
                    'cursor-pointer transition-colors duration-100 hover:bg-backgroundContentTint'
            )}
        >
            <div
                className={cn(
                    '-mb-0.5 flex size-11 items-center justify-center text-textPrimary',
                    '[&>svg]:h-7 [&>svg]:w-7',
                    isSkeleton && '[&>*]:invisible'
                )}
            >
                {icon}
            </div>
            <span
                {...mask({ w: 60, h: 16 })}
                className="whitespace-nowrap text-label3 text-textSecondary"
            >
                {label}
            </span>
        </button>
    );
};

interface RampRequest {
    entry: OnrampFlowEntry;
    from: RampSource;
    buyAsset?: OnrampBuyAsset;
}

export const HomeMultichainActions: FC<{ compact?: boolean }> = ({ compact = false }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [swapOpen, setSwapOpen] = useState(false);
    const [stakeOpen, setStakeOpen] = useState(false);
    const [stakeFrom, setStakeFrom] = useState<StakingSource>('wallet');
    const [sendOpen, setSendOpen] = useState(false);
    const [rampOpen, setRampOpen] = useState(false);
    // Kept through close so the flow's last screen stays intact through the
    // close animation; every open replaces it.
    const [ramp, setRamp] = useState<RampRequest>({ entry: 'add_funds', from: 'wallet_screen' });

    const openRamp = useCallback((request: RampRequest) => {
        setRamp(request);
        setRampOpen(true);
    }, []);

    // Deep-link entry: other screens and deeplinks route here with an action
    // flag to open one of the flows that live in this component's state —
    // Add Funds (optionally naming an asset to buy, as the confirm screen's
    // insufficient-funds dialog does), Receive, Swap or Stake. Consume the
    // flag and strip it so a refresh or back-nav doesn't reopen the sheet.
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const action = params.get(MULTICHAIN_ACTION_PARAM);
        if (action === MULTICHAIN_ACTION_ADD_FUNDS) {
            const assetId = params.get(MULTICHAIN_ACTION_ASSET_PARAM);
            openRamp({
                entry: 'add_funds',
                from: toRampSource(params.get(MULTICHAIN_ACTION_FROM_PARAM)) ?? 'wallet_screen',
                buyAsset: assetId ? { assetId } : undefined
            });
        } else if (action === MULTICHAIN_ACTION_RECEIVE) {
            openRamp({ entry: 'receive', from: 'wallet_screen' });
        } else if (action === MULTICHAIN_ACTION_SWAP) {
            setSwapOpen(true);
        } else if (action === MULTICHAIN_ACTION_STAKE) {
            setStakeFrom('deeplink');
            setStakeOpen(true);
        } else {
            return;
        }
        navigate(MultichainRoute.home, { replace: true });
    }, [location.search, navigate, openRamp]);

    const onSend = () => setSendOpen(true);

    const onAddFunds = () => openRamp({ entry: 'add_funds', from: 'wallet_screen' });

    const onSwap = () => setSwapOpen(true);

    const onStake = () => {
        setStakeFrom('wallet');
        setStakeOpen(true);
    };

    return (
        <>
            {compact ? (
                <div className="flex items-stretch gap-2">
                    <ActionCardButton
                        icon={<SendIcon />}
                        label={t('wallet_send')}
                        onClick={onSend}
                    />
                    <ActionCardButton
                        icon={<ReceiveIcon />}
                        label={t('wallet_add_funds')}
                        onClick={onAddFunds}
                    />
                    <ActionCardButton
                        icon={<IcSwapHorizontalOutline28 className="h-7 w-7" />}
                        label={t('swap_title')}
                        onClick={onSwap}
                    />
                    <ActionCardButton
                        icon={<IcStakingOutline28 className="h-7 w-7" />}
                        label={t('staking_action_stake')}
                        onClick={onStake}
                    />
                </div>
            ) : (
                // The four buttons sit edge to edge — the row's rhythm is the
                // buttons' own 76px width, not a gap between them.
                <div className="flex items-center justify-center pb-4">
                    <IconButton icon={<SendIcon />} label={t('wallet_send')} onClick={onSend} />
                    <IconButton
                        icon={<ReceiveIcon />}
                        label={t('wallet_add_funds')}
                        onClick={onAddFunds}
                    />
                    <IconButton
                        icon={<IcSwapHorizontalOutline28 className="h-7 w-7" />}
                        label={t('swap_title')}
                        onClick={onSwap}
                    />
                    <IconButton
                        icon={<IcStakingOutline28 className="h-7 w-7" />}
                        label={t('staking_action_stake')}
                        onClick={onStake}
                    />
                </div>
            )}
            <MultichainSendFlow
                isOpen={sendOpen}
                onClose={() => setSendOpen(false)}
                onAddFunds={() => {
                    setSendOpen(false);
                    onAddFunds();
                }}
            />
            <MultichainSwapFlow isOpen={swapOpen} onClose={() => setSwapOpen(false)} />
            <MultichainStakeFlow
                isOpen={stakeOpen}
                onClose={() => setStakeOpen(false)}
                from={stakeFrom}
            />
            <OnrampFlow
                isOpen={rampOpen}
                onClose={() => setRampOpen(false)}
                entry={ramp.entry}
                from={ramp.from}
                buyAsset={ramp.buyAsset}
            />
        </>
    );
};
