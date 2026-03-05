import BigNumber from 'bignumber.js';
import { FC, useMemo } from 'react';
import { styled } from 'styled-components';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { useTranslation } from '../../hooks/translation';
import { useNavigate } from '../../hooks/router/useNavigate';
import { useParams } from '../../hooks/router/useParams';
import { AppRoute, StakingRoute } from '../../libs/routes';
import { formatter, formatTokenDisplay } from '../../hooks/balance';
import { useFormatFiat, useRate } from '../../state/rates';
import { useJettonBalance, useJettonInfo } from '../../state/jetton';
import { usePoolInfo } from '../../state/staking/usePoolInfo';
import { useStakingPosition } from '../../state/staking/useStakingPosition';
import { useStakingCycleCountdown } from '../../state/staking/useStakingCycleCountdown';
import {
    getStakingPoolTonAmount,
    StakingPoolLiquidTokenBalance
} from '../../state/staking/poolStakeState';
import { Body3, Label2, H3 } from '../../components/Text';
import {
    DesktopViewHeader,
    DesktopViewHeaderContent
} from '../../components/desktop/DesktopViewLayout';
import { StakingPoolIcon } from '../../components/staking/StakingPoolIcon';
import { StakingPageWrapper } from './StakingLayout';

const ContentArea = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
`;

const HeaderSection = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
`;

const PoolIconWrapper = styled.div`
    position: relative;
    flex-shrink: 0;
    width: 56px;
    height: 56px;
`;

const AmountSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding-top: 1px;
    padding-bottom: 2px;
`;

const AmountText = styled(H3)`
    color: ${p => p.theme.textPrimary};
    font-weight: 510;
    white-space: nowrap;
`;

const FiatText = styled(Label2)`
    color: ${p => p.theme.textSecondary};
    font-weight: 400;
`;

const ButtonsRow = styled.div`
    display: flex;
    gap: 8px;
    padding: 0 16px 16px;
`;

const ActionButton = styled.button`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 12px;
    min-height: 36px;
    background: ${p => p.theme.buttonSecondaryBackground};
    color: ${p => p.theme.buttonSecondaryForeground};
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 510;
    line-height: 20px;
    letter-spacing: -0.15px;
    white-space: nowrap;

    &:hover {
        opacity: 0.88;
    }
`;

const Divider = styled.div`
    height: 0.5px;
    background: ${p => p.theme.separatorCommon};
    width: 100%;
`;

const InfoRow = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 12px 16px;
    width: 100%;
    box-sizing: border-box;
`;

const InfoLeft = styled(Body3)`
    flex: 1;
    color: ${p => p.theme.textSecondary};
`;

const InfoRight = styled(Body3)`
    color: ${p => p.theme.textSecondary};
    text-align: right;
`;

const TokenRow = styled.div`
    display: flex;
    align-items: center;
    cursor: pointer;
    width: 100%;

    &:hover {
        background: ${p => p.theme.backgroundContentTint};
    }
`;

const TokenIconWrapper = styled.div`
    padding: 8px 0 8px 16px;
    flex-shrink: 0;
`;

const TokenIconImg = styled.img`
    width: 40px;
    height: 40px;
    border-radius: 22px;
    object-fit: cover;
    background: ${p => p.theme.backgroundContent};
`;

const TokenIconFallback = styled.div`
    width: 40px;
    height: 40px;
    border-radius: 22px;
    background: ${p => p.theme.backgroundContent};
`;

const TokenCenter = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 36px;
    min-width: 1px;
    padding: 10px 16px 10px 12px;
    gap: 0;
`;

const TokenInfoRow = styled.div`
    display: flex;
    gap: 8px;
    align-items: flex-start;
    width: 100%;
`;

const TokenNameLabel = styled(Label2)`
    flex: 1;
    color: ${p => p.theme.textPrimary};
    font-weight: 510;
    white-space: nowrap;
`;

const TokenAmountLabel = styled(Label2)`
    color: ${p => p.theme.textPrimary};
    font-weight: 510;
    white-space: nowrap;
    text-align: right;
`;

const TokenPriceText = styled(Body3)`
    flex: 1;
    color: ${p => p.theme.textSecondary};
    white-space: nowrap;
`;

const TokenFiatText = styled(Body3)`
    color: ${p => p.theme.textSecondary};
    white-space: nowrap;
    text-align: right;
`;

const TokenPriceChange = styled(Body3)<{ negative?: boolean }>`
    color: ${p => (p.negative ? p.theme.accentRed : p.theme.accentGreen)};
    white-space: nowrap;
`;

const DescriptionText = styled(Body3)`
    color: ${p => p.theme.textTertiary};
    padding: 0 16px 16px;
    max-width: 520px;
    line-height: 16px;
`;

interface PoolDetailTokenRowProps {
    jettonMaster: string;
    onClick: () => void;
}

const PoolDetailTokenRow: FC<PoolDetailTokenRowProps> = ({ jettonMaster, onClick }) => {
    const { data: jettonBalance } = useJettonBalance(jettonMaster);
    const { data: jettonInfo } = useJettonInfo(jettonMaster);
    const { data: jettonRate } = useRate(jettonMaster);

    const iconUrl =
        jettonBalance?.jetton?.image ?? jettonInfo?.metadata?.image ?? jettonInfo?.preview;

    const symbol = jettonBalance?.jetton?.symbol ?? jettonInfo?.metadata?.symbol ?? 'tsTON';

    const tokenAmount = useMemo(() => {
        if (!jettonBalance) return undefined;
        const decimals = jettonBalance.jetton?.decimals ?? 9;
        return new BigNumber(jettonBalance.balance).div(new BigNumber(10).pow(decimals));
    }, [jettonBalance]);

    const { fiatPrice, fiatAmount } = useFormatFiat(jettonRate, tokenAmount);

    const diff24h = jettonRate?.diff24h;
    const isNegative = diff24h ? diff24h.startsWith('-') : false;

    return (
        <TokenRow onClick={onClick}>
            <TokenIconWrapper>
                {iconUrl ? <TokenIconImg src={iconUrl} alt={symbol} /> : <TokenIconFallback />}
            </TokenIconWrapper>
            <TokenCenter>
                <TokenInfoRow>
                    <TokenNameLabel>{symbol}</TokenNameLabel>
                    <TokenAmountLabel>
                        {tokenAmount ? formatter.formatDisplay(tokenAmount) : '—'}
                    </TokenAmountLabel>
                </TokenInfoRow>
                <TokenInfoRow>
                    <TokenPriceText>
                        {fiatPrice}
                        {diff24h && (
                            <TokenPriceChange negative={isNegative}> {diff24h}</TokenPriceChange>
                        )}
                    </TokenPriceText>
                    {fiatAmount && <TokenFiatText>{fiatAmount}</TokenFiatText>}
                </TokenInfoRow>
            </TokenCenter>
        </TokenRow>
    );
};

const PendingOperationsSection: FC<{
    pendingDeposit: number;
    readyWithdraw: number;
}> = ({ pendingDeposit, readyWithdraw }) => {
    const { t } = useTranslation();

    if (pendingDeposit <= 0 && readyWithdraw <= 0) return null;

    return (
        <>
            <Divider />
            <InfoRow>
                {pendingDeposit > 0 && (
                    <InfoLeft>
                        {t('staking_pending_deposit', {
                            amount: formatter.formatDisplay(shiftedDecimals(pendingDeposit))
                        })}
                    </InfoLeft>
                )}
                {readyWithdraw > 0 && (
                    <InfoRight>
                        {t('staking_ready_withdraw', {
                            amount: formatter.formatDisplay(shiftedDecimals(readyWithdraw))
                        })}
                    </InfoRight>
                )}
            </InfoRow>
        </>
    );
};

interface DesktopStakingPoolDetailPageProps {
    poolAddress?: string;
}

export const DesktopStakingPoolDetailPage = ({
    poolAddress
}: DesktopStakingPoolDetailPageProps) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { address: routeAddress } = useParams() as { address?: string };
    const address = poolAddress ?? routeAddress;

    const { data: pool } = usePoolInfo(address);
    const { data: position } = useStakingPosition(address);
    const { data: tonRate } = useRate(CryptoCurrency.TON);
    const countdown = useStakingCycleCountdown(pool);

    const isLiquid = !!pool?.liquidJettonMaster;

    const { data: poolIconJettonInfo } = useJettonInfo(
        isLiquid ? pool?.liquidJettonMaster ?? '' : ''
    );

    const { data: liquidJettonBalance } = useJettonBalance(
        isLiquid ? pool?.liquidJettonMaster : undefined
    );
    const { data: liquidJettonRate } = useRate(pool?.liquidJettonMaster ?? CryptoCurrency.TON);

    const tonPrice = useMemo(() => {
        return tonRate?.prices !== undefined ? new BigNumber(tonRate.prices) : undefined;
    }, [tonRate?.prices]);

    const liquidTokenBalance = useMemo<StakingPoolLiquidTokenBalance | undefined>(() => {
        if (!isLiquid || !liquidJettonBalance) {
            return undefined;
        }

        const decimals = liquidJettonBalance.jetton?.decimals ?? 9;
        const relativeAmount = new BigNumber(liquidJettonBalance.balance).div(
            new BigNumber(10).pow(decimals)
        );

        return {
            weiAmount: new BigNumber(liquidJettonBalance.balance),
            relativeAmount,
            price:
                liquidJettonRate?.prices !== undefined
                    ? new BigNumber(liquidJettonRate.prices)
                    : undefined
        };
    }, [isLiquid, liquidJettonBalance, liquidJettonRate?.prices]);

    const canResolveLiquidTonAmount = useMemo(() => {
        return !!liquidTokenBalance?.price && !!tonPrice && !tonPrice.isZero();
    }, [liquidTokenBalance?.price, tonPrice]);

    const stakedAmount = useMemo((): BigNumber | undefined => {
        if (isLiquid && (!liquidTokenBalance || !canResolveLiquidTonAmount)) {
            return undefined;
        }

        return getStakingPoolTonAmount({ position, liquidTokenBalance, tonPrice });
    }, [isLiquid, liquidTokenBalance, canResolveLiquidTonAmount, position, tonPrice]);

    const { fiatAmount } = useFormatFiat(tonRate, stakedAmount);

    const displayAmount = stakedAmount ? formatTokenDisplay(stakedAmount, 'TON') : '— TON';

    const minStakeTON = pool ? shiftedDecimals(new BigNumber(pool.minStake)).toFixed(0) : '—';

    const apyStr = pool
        ? t('staking_pool_detail', { apy: pool.apy.toFixed(2), minDeposit: minStakeTON })
        : '';

    const pendingWithdraw = position?.pendingWithdraw ?? 0;
    const pendingDeposit = position?.pendingDeposit ?? 0;
    const readyWithdraw = position?.readyWithdraw ?? 0;

    const withdrawDateStr = useMemo(() => {
        if (pendingWithdraw <= 0 || !pool) return '';
        const amount = formatter.formatDisplay(shiftedDecimals(pendingWithdraw));
        const date = new Date(pool.cycleEnd * 1000);
        const dateStr = date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
        return t('staking_pool_withdraw_date', { amount, date: dateStr });
    }, [pendingWithdraw, pool, t]);

    const liquidDesc = useMemo(() => {
        if (!isLiquid || !pool) return '';
        const symbol = poolIconJettonInfo?.metadata?.symbol ?? 'tsTON';
        return t('staking_pool_liquid_desc', { pool: pool.name, token: symbol, tokenName: symbol });
    }, [isLiquid, pool, poolIconJettonInfo, t]);

    const handleStake = () => {
        if (!address) return;
        navigate(AppRoute.staking + StakingRoute.stake + '/' + address);
    };

    const handleUnstake = () => {
        if (!address) return;
        navigate(AppRoute.staking + StakingRoute.unstake + '/' + address);
    };

    const handleTokenClick = () => {
        if (pool?.liquidJettonMaster) {
            navigate(AppRoute.coins + '/' + pool.liquidJettonMaster);
        }
    };

    return (
        <StakingPageWrapper mobileContentPaddingTop>
            <DesktopViewHeader backButton borderBottom>
                <DesktopViewHeaderContent title={pool?.name ?? ''} />
            </DesktopViewHeader>
            <ContentArea>
                <HeaderSection>
                    <PoolIconWrapper>
                        <StakingPoolIcon pool={pool} size={56} />
                    </PoolIconWrapper>
                    <AmountSection>
                        <AmountText>{displayAmount}</AmountText>
                        {fiatAmount && <FiatText>{fiatAmount}</FiatText>}
                    </AmountSection>
                </HeaderSection>
                <ButtonsRow>
                    <ActionButton onClick={handleStake}>{t('staking_action_stake')}</ActionButton>
                    <ActionButton onClick={handleUnstake}>
                        {t('staking_action_unstake')}
                    </ActionButton>
                </ButtonsRow>
                <Divider />
                <InfoRow>
                    <InfoLeft>{apyStr}</InfoLeft>
                    {withdrawDateStr && (
                        <InfoRight>
                            {withdrawDateStr}
                            {countdown && ` (${countdown})`}
                        </InfoRight>
                    )}
                </InfoRow>
                <PendingOperationsSection
                    pendingDeposit={pendingDeposit}
                    readyWithdraw={readyWithdraw}
                />
                {isLiquid && pool?.liquidJettonMaster && (
                    <>
                        <Divider />
                        <PoolDetailTokenRow
                            jettonMaster={pool.liquidJettonMaster}
                            onClick={handleTokenClick}
                        />
                        {liquidDesc && <DescriptionText>{liquidDesc}</DescriptionText>}
                    </>
                )}
                {countdown && (
                    <InfoRow>
                        <InfoLeft>{t('staking_next_cycle_message', { value: countdown })}</InfoLeft>
                    </InfoRow>
                )}
            </ContentArea>
        </StakingPageWrapper>
    );
};
