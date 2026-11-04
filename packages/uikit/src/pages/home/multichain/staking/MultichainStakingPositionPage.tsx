import { FC, useMemo, useState } from 'react';
import BigNumber from 'bignumber.js';

import { TonConnectTransactionPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import { PoolInfo } from '@tonkeeper/core/dist/tonApiV2';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { BRAND_CONFIG } from '@tonkeeper/core/dist/config/brand';
import { eqAddresses } from '@tonkeeper/core/dist/utils/address';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';

import { formatAmount } from '@tonkeeper/core/dist/utils/numberFormat';
import { cn } from '../../../../libs/css';
import { SkeletonScope, useSkeletonMask } from '../../../../primitives';
import { useAppContext } from '../../../../hooks/appContext';
import { useTranslation } from '../../../../hooks/translation';
import { useNavigateBack } from '../../../../hooks/router/useNavigateBack';
import { useOpenAssetPage } from '../asset/useOpenAssetPage';
import { formatFiatCurrency } from '../../../../hooks/balance';
import { MultichainRoute } from '../../../../libs/routes';
import { useFormatFiat, useRate } from '../../../../state/rates';
import { useJettonBalance, useJettonInfo } from '../../../../state/jetton';
import { usePoolInfo } from '../../../../state/staking/usePoolInfo';
import { usePoolStakedBalance } from '../../../../state/staking/usePoolStakedBalance';
import {
    useStakingPoolImplementations,
    useStakingPools
} from '../../../../state/staking/useStakingPools';
import { useEncodeStakingUnstake } from '../../../../state/staking/useEncodeStaking';
import { isSignificantPendingWithdraw } from '../../../../state/staking/pendingWithdraw';
import { useMultichainWalletAssets } from '../../../../state/multichain/useMultichainWalletAssets';
import IcPlusOutline28 from '../../../../icons/components/IcPlusOutline28';
import IcMinusOutline28 from '../../../../icons/components/IcMinusOutline28';
import { BackButton } from '../../../../primitives/BackButton';
import { MultichainMobileTabBar } from '../MultichainMobileTabBar';
import { diffColorClass, formatPercentChange } from '../multichain-utils';
import { TokenImage } from '../TokenImage';
import { MultichainStakeFlow } from './MultichainStakeFlow';
import { MultichainUnstakeFlow } from './MultichainUnstakeFlow';
import { StakingConfirmScreen } from './StakingConfirmScreen';
import { maxApyPoolOf } from './StakePoolScreens';
import {
    StakingDisclaimer,
    StakingInfoCard,
    StakingLinksSection,
    StakingPositionIcon,
    stakingPoolLinks
} from './staking-shared';

const PendingCard: FC<{
    title: string;
    subtitle?: string;
    amountRaw: number;
    tonFiatPrice: BigNumber | undefined;
    onClick?: () => void;
}> = ({ title, subtitle, amountRaw, tonFiatPrice, onClick }) => {
    const { fiat } = useAppContext();
    const amount = shiftedDecimals(amountRaw);
    const fiatValue = tonFiatPrice ? amount.multipliedBy(tonFiatPrice) : undefined;
    const Tag = onClick ? 'button' : 'div';
    return (
        <Tag
            {...(onClick ? { type: 'button' as const, onClick } : {})}
            className="flex w-full items-center gap-2 rounded-medium bg-backgroundContent px-4 py-3 text-left"
        >
            <span className="min-w-0 flex-1">
                <span className="block truncate text-label1 text-textPrimary">{title}</span>
                {subtitle && (
                    <span className="block text-body2 text-textSecondary">{subtitle}</span>
                )}
            </span>
            <span className="text-right">
                <span className="block text-label1 text-textPrimary">
                    {formatAmount(amount)} {BRAND_CONFIG.coinSymbol}
                </span>
                {fiatValue && (
                    <span className="block text-body2 text-textSecondary">
                        {formatFiatCurrency(fiat, fiatValue)}
                    </span>
                )}
            </span>
        </Tag>
    );
};

/** tsTON-style liquid-token row; taps through to the token's asset page when it exists. */
const LiquidTokenCell: FC<{ jettonMaster: string }> = ({ jettonMaster }) => {
    const openAsset = useOpenAssetPage();
    const { data: jettonBalance } = useJettonBalance(jettonMaster);
    const { data: jettonInfo } = useJettonInfo(jettonMaster);
    const { data: jettonRate } = useRate(jettonMaster);
    const { data: assetsData } = useMultichainWalletAssets();

    const symbol = jettonBalance?.jetton?.symbol ?? jettonInfo?.metadata?.symbol ?? 'tsTON';
    const iconUrl =
        jettonBalance?.jetton?.image ?? jettonInfo?.metadata?.image ?? jettonInfo?.preview;

    const tokenAmount = useMemo(() => {
        if (!jettonBalance) return undefined;
        const decimals = jettonBalance.jetton?.decimals ?? 9;
        return new BigNumber(jettonBalance.balance).shiftedBy(-decimals);
    }, [jettonBalance]);

    const { fiatPrice, fiatAmount } = useFormatFiat(jettonRate, tokenAmount);
    const diff24h = jettonRate?.diff24h;

    // The multichain asset page loads by the balances-backend asset id;
    // link only when the wallet's asset list actually carries this jetton.
    const assetId = useMemo(() => {
        return assetsData?.assets.find(asset => {
            const tail = asset.assetId.split('/').pop() ?? '';
            try {
                return eqAddresses(tail, jettonMaster);
            } catch {
                return false;
            }
        })?.assetId;
    }, [assetsData, jettonMaster]);

    return (
        <button
            type="button"
            disabled={!assetId}
            onClick={() => assetId && openAsset(assetId)}
            className="flex w-full items-center rounded-medium bg-backgroundContent text-left transition-colors duration-100 enabled:cursor-pointer hover:enabled:bg-backgroundContentTint"
        >
            <span className="py-4 pl-4">
                <TokenImage src={iconUrl} className="size-11" />
            </span>
            <span className="min-w-0 flex-1 p-4">
                <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-label1 text-textPrimary">{symbol}</span>
                    <span className="shrink-0 text-label1 text-textPrimary">
                        {tokenAmount ? formatAmount(tokenAmount) : '—'} {symbol}
                    </span>
                </span>
                <span className="flex items-baseline justify-between gap-2 text-body2 text-textSecondary">
                    <span className="truncate">
                        {fiatPrice}
                        {diff24h && (
                            <span className={diffColorClass(diff24h)}>
                                {' '}
                                {formatPercentChange(diff24h)}
                            </span>
                        )}
                    </span>
                    {fiatAmount && <span className="shrink-0">{fiatAmount}</span>}
                </span>
            </span>
        </button>
    );
};

const ActionDivider: FC = () => (
    <span
        aria-hidden
        className="w-[0.5px] self-stretch bg-gradient-to-b from-transparent via-backgroundContent to-transparent"
    />
);

const PositionHeader: FC<{ onBack: () => void; name: string }> = ({ onBack, name }) => {
    const mask = useSkeletonMask();
    return (
        <header className="relative flex h-[64px] shrink-0 items-center justify-center px-16">
            <BackButton onClick={onBack} className="absolute left-2 top-1/2 -translate-y-1/2" />
            <span {...mask({ w: 97, h: 20 })} className="truncate text-h3 text-textPrimary">
                {name}
            </span>
        </header>
    );
};

const PositionHero: FC<{ pool?: PoolInfo; amount: string; fiatAmount?: string }> = ({
    pool,
    amount,
    fiatAmount
}) => {
    const mask = useSkeletonMask();
    return (
        <div className="flex items-start justify-between gap-4 px-7 pb-7 pt-4">
            <div className="min-w-0">
                <div {...mask({ w: 97, h: 32, r: 100 })} className="text-h2 text-textPrimary">
                    {amount}
                </div>
                {fiatAmount && (
                    <div {...mask({ w: 170 })} className="pt-0.5 text-body2 text-textSecondary">
                        {fiatAmount}
                    </div>
                )}
            </div>
            <StakingPositionIcon
                pool={pool}
                className="size-16"
                badgeClassName="-bottom-1 -right-1 size-6 ring-[3px]"
            />
        </div>
    );
};

/** Stake / Unstake pair; without handlers (while the pool loads) it disables. */
const PositionActions: FC<{ onStake?: () => void; onUnstake?: () => void }> = ({
    onStake,
    onUnstake
}) => {
    const { t } = useTranslation();
    return (
        <div className="flex items-stretch justify-center px-4 pb-6">
            <button
                type="button"
                onClick={onStake}
                disabled={!onStake}
                className="flex flex-1 flex-col items-center gap-1 rounded-2xl px-3 py-4 text-textPrimary transition-colors duration-100 enabled:cursor-pointer hover:enabled:bg-backgroundContentTint"
            >
                <IcPlusOutline28 className="size-7" />
                <span className="text-label3 text-textSecondary">{t('staking_action_stake')}</span>
            </button>
            <ActionDivider />
            <button
                type="button"
                onClick={onUnstake}
                disabled={!onUnstake}
                className="flex flex-1 flex-col items-center gap-1 rounded-2xl px-3 py-4 text-textPrimary transition-colors duration-100 enabled:cursor-pointer hover:enabled:bg-backgroundContentTint"
            >
                <IcMinusOutline28 className="size-7" />
                <span className="text-label3 text-textSecondary">
                    {t('staking_action_unstake')}
                </span>
            </button>
        </div>
    );
};

/**
 * Staked-position page: staked balance hero, Stake / Unstake actions,
 * liquid-token cell, pending-operation cards, pool info, and links.
 * Reached from the home portfolio's "Staked" rows.
 */
export const MultichainStakingPositionPage: FC<{ poolAddress: string; compact?: boolean }> = ({
    poolAddress,
    compact = false
}) => {
    const { t } = useTranslation();
    const navigateBack = useNavigateBack(MultichainRoute.home);

    const { data: pool, isLoading: isPoolLoading } = usePoolInfo(poolAddress);
    const { data: pools } = useStakingPools();
    const { data: implementations } = useStakingPoolImplementations();
    const { data: liquidJettonInfo } = useJettonInfo(pool?.liquidJettonMaster ?? '');
    const liquidTokenSymbol = liquidJettonInfo?.metadata?.symbol ?? 'tsTON';
    const { tonAmount: staked, position, isLiquid } = usePoolStakedBalance(pool);
    const { data: tonRate } = useRate(CryptoCurrency.TON);
    const { fiatAmount } = useFormatFiat(tonRate, staked);
    const tonFiatPrice = useMemo(
        () => (tonRate?.prices !== undefined ? new BigNumber(tonRate.prices) : undefined),
        [tonRate?.prices]
    );

    const [stakeOpen, setStakeOpen] = useState(false);
    const [unstakeOpen, setUnstakeOpen] = useState(false);
    const [claimPayload, setClaimPayload] = useState<TonConnectTransactionPayload | undefined>();
    const encodeClaim = useEncodeStakingUnstake();

    const maxApyPool = useMemo(() => maxApyPoolOf(pools ?? []), [pools]);
    const links = useMemo(
        () => (pool ? stakingPoolLinks(pool, implementations?.[pool.implementation]) : []),
        [pool, implementations]
    );

    const { pendingWithdraw = 0, pendingDeposit = 0, readyWithdraw = 0 } = position ?? {};
    const canClaim = readyWithdraw > 0 && !isLiquid && !!pool;

    const onClaim = async () => {
        if (!pool) return;
        try {
            const encoded = await encodeClaim.mutateAsync({ pool, amount: 0n, isSendAll: true });
            setClaimPayload(encoded);
        } catch {
            // encode mutation tracks error state via React Query
        }
    };

    const rootClass = compact
        ? 'flex min-h-full flex-col bg-backgroundPage'
        : 'flex min-h-screen flex-col bg-backgroundPage';

    if (!pool) {
        if (isPoolLoading) {
            return (
                <SkeletonScope loading>
                    <div className={rootClass}>
                        <PositionHeader onBack={navigateBack} name="Pool" />
                        <PositionHero pool={undefined} amount="0" fiatAmount="0" />
                        <PositionActions />
                        <div className="flex flex-col gap-4 px-4">
                            <StakingInfoCard pool={undefined} />
                        </div>
                    </div>
                </SkeletonScope>
            );
        }
        return (
            <div className={cn(rootClass, 'items-center justify-center text-textSecondary')}>
                {t('error_occurred')}
            </div>
        );
    }

    return (
        <div className={rootClass}>
            <PositionHeader onBack={navigateBack} name={pool.name} />
            <PositionHero
                pool={pool}
                amount={`${staked ? formatAmount(staked) : '—'} ${BRAND_CONFIG.coinSymbol}`}
                fiatAmount={fiatAmount}
            />
            <PositionActions
                onStake={() => setStakeOpen(true)}
                onUnstake={() => setUnstakeOpen(true)}
            />

            <div className="flex flex-col gap-4 px-4">
                {isSignificantPendingWithdraw(pendingWithdraw) && (
                    <PendingCard
                        title={t('staking_pending_unstake_title')}
                        subtitle={t('staking_pending_unstake_subtitle')}
                        amountRaw={pendingWithdraw}
                        tonFiatPrice={tonFiatPrice}
                    />
                )}
                {isSignificantPendingWithdraw(pendingDeposit) && (
                    <PendingCard
                        title={t('staking_pending_stake_title')}
                        subtitle={t('staking_pending_unstake_subtitle')}
                        amountRaw={pendingDeposit}
                        tonFiatPrice={tonFiatPrice}
                    />
                )}
                {canClaim && (
                    <PendingCard
                        title={t('staking_ready_withdraw_title')}
                        subtitle={t('staking_claim')}
                        amountRaw={readyWithdraw}
                        tonFiatPrice={tonFiatPrice}
                        onClick={encodeClaim.isLoading ? undefined : onClaim}
                    />
                )}

                {isLiquid && pool.liquidJettonMaster && (
                    <div>
                        <LiquidTokenCell jettonMaster={pool.liquidJettonMaster} />
                        <p className="px-4 pb-1 pt-3 text-body3 text-textTertiary">
                            {t('staking_pool_liquid_desc', {
                                pool: pool.name,
                                token: liquidTokenSymbol,
                                tokenName: liquidTokenSymbol
                            })}
                        </p>
                    </div>
                )}

                <div>
                    <StakingInfoCard
                        pool={pool}
                        showMaxApyTag={maxApyPool?.address === pool.address}
                    />
                    <StakingDisclaimer className="px-4 pb-0" />
                </div>

                <StakingLinksSection links={links} className="pb-8" />
            </div>

            {!compact && (
                <>
                    <div className="h-20" aria-hidden />
                    <MultichainMobileTabBar />
                </>
            )}

            <MultichainStakeFlow
                isOpen={stakeOpen}
                onClose={() => setStakeOpen(false)}
                fixedPool={pool}
                from="staking_viewer"
            />
            <MultichainUnstakeFlow
                isOpen={unstakeOpen}
                onClose={() => setUnstakeOpen(false)}
                pool={pool}
            />
            {claimPayload && (
                <StakingConfirmScreen
                    isOpen={!!claimPayload}
                    onClose={() => setClaimPayload(undefined)}
                    pool={pool}
                    amount={shiftedDecimals(readyWithdraw)}
                    variant="unstake"
                    operation="claim"
                    payload={claimPayload}
                />
            )}
        </div>
    );
};
