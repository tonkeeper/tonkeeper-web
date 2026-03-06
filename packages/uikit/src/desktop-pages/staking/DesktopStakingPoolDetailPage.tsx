import BigNumber from 'bignumber.js';
import { FC, useMemo, useState } from 'react';
import { styled } from 'styled-components';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { TonConnectTransactionPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import { PoolInfo } from '@tonkeeper/core/dist/tonApiV2';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { useTranslation } from '../../hooks/translation';
import { useDateFormat } from '../../hooks/dateFormat';
import { useNavigate } from '../../hooks/router/useNavigate';
import { useParams } from '../../hooks/router/useParams';
import { AppRoute, StakingRoute } from '../../libs/routes';
import { formatter, formatTokenDisplay } from '../../hooks/balance';
import { useFormatFiat, useRate } from '../../state/rates';
import { useJettonBalance, useJettonInfo } from '../../state/jetton';
import { usePoolInfo } from '../../state/staking/usePoolInfo';
import { usePoolStakedBalance } from '../../state/staking/usePoolStakedBalance';
import { useStakingCycleCountdown } from '../../state/staking/useStakingCycleCountdown';
import { useEncodeStakingUnstake } from '../../state/staking/useEncodeStaking';
import { Body3, Label2, H3 } from '../../components/Text';
import {
    DesktopViewHeader,
    DesktopViewHeaderContent
} from '../../components/desktop/DesktopViewLayout';
import { TonTransactionNotification } from '../../components/connect/TonTransactionNotification';
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

    &:disabled {
        opacity: 0.56;
        cursor: default;
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

function useClaimAction(pool: PoolInfo | undefined, isLiquid: boolean, readyWithdraw: number) {
    const [params, setParams] = useState<TonConnectTransactionPayload | null>(null);
    const { mutateAsync: encodeClaim, isLoading } = useEncodeStakingUnstake();

    const canClaim = readyWithdraw > 0 && !isLiquid && !!pool;

    const handleClaim = async () => {
        if (!pool) return;
        try {
            const encoded = await encodeClaim({ pool, amount: 0n, isSendAll: true });
            setParams(encoded);
        } catch {
            // encode mutation tracks error state via React Query
        }
    };

    return {
        canClaim,
        handleClaim,
        claimDisabled: isLoading || !!params,
        claimParams: params,
        closeClaim: () => setParams(null)
    };
}

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

    const { data: pool, isError: isPoolError } = usePoolInfo(address);
    const { tonAmount: stakedAmount, position, isLiquid } = usePoolStakedBalance(pool);
    const { data: tonRate } = useRate(CryptoCurrency.TON);
    const countdown = useStakingCycleCountdown(pool);

    const liquidJettonMaster = isLiquid ? pool?.liquidJettonMaster : undefined;
    const { data: poolIconJettonInfo } = useJettonInfo(liquidJettonMaster ?? '');

    const { fiatAmount } = useFormatFiat(tonRate, stakedAmount);

    const displayAmount = stakedAmount ? formatTokenDisplay(stakedAmount, 'TON') : '— TON';

    const minStakeTON = pool ? shiftedDecimals(new BigNumber(pool.minStake)).toFixed(0) : '—';

    const apyStr = pool
        ? t('staking_pool_detail', { apy: pool.apy.toFixed(2), minDeposit: minStakeTON })
        : '';

    const { pendingWithdraw = 0, pendingDeposit = 0, readyWithdraw = 0 } = position ?? {};

    const cycleEndDate = pool && pendingWithdraw > 0 ? pool.cycleEnd * 1000 : undefined;
    const dateOptions = useMemo<Intl.DateTimeFormatOptions>(
        () => ({
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: undefined,
            minute: undefined
        }),
        []
    );
    const formattedCycleDate = useDateFormat(cycleEndDate, dateOptions);

    const withdrawDateStr = useMemo(() => {
        if (pendingWithdraw <= 0 || !formattedCycleDate) return '';
        const amount = formatter.formatDisplay(shiftedDecimals(pendingWithdraw));
        return t('staking_pool_withdraw_date', { amount, date: formattedCycleDate });
    }, [pendingWithdraw, formattedCycleDate, t]);

    const liquidDesc = useMemo(() => {
        if (!isLiquid || !pool) return '';
        const symbol = poolIconJettonInfo?.metadata?.symbol ?? 'tsTON';
        return t('staking_pool_liquid_desc', { pool: pool.name, token: symbol, tokenName: symbol });
    }, [isLiquid, pool, poolIconJettonInfo, t]);

    const { canClaim, handleClaim, claimDisabled, claimParams, closeClaim } = useClaimAction(
        pool,
        isLiquid,
        readyWithdraw
    );

    const navigateToPool = (route: string) => {
        if (!address) return;
        navigate(AppRoute.staking + route + '/' + address);
    };

    const handleTokenClick = () => {
        if (liquidJettonMaster) {
            navigate(AppRoute.coins + '/' + liquidJettonMaster);
        }
    };

    if (isPoolError) {
        return (
            <StakingPageWrapper mobileContentPaddingTop>
                <DesktopViewHeader backButton borderBottom>
                    <DesktopViewHeaderContent title="" />
                </DesktopViewHeader>
                <ContentArea>
                    <InfoRow>
                        <InfoLeft>{t('error_occurred')}</InfoLeft>
                    </InfoRow>
                </ContentArea>
            </StakingPageWrapper>
        );
    }

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
                    <ActionButton onClick={() => navigateToPool(StakingRoute.stake)}>
                        {t('staking_action_stake')}
                    </ActionButton>
                    <ActionButton onClick={() => navigateToPool(StakingRoute.unstake)}>
                        {t('staking_action_unstake')}
                    </ActionButton>
                    {canClaim && (
                        <ActionButton onClick={handleClaim} disabled={claimDisabled}>
                            {t('staking_claim')}
                        </ActionButton>
                    )}
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
                {liquidJettonMaster && (
                    <>
                        <Divider />
                        <PoolDetailTokenRow
                            jettonMaster={liquidJettonMaster}
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
            <TonTransactionNotification
                handleClose={closeClaim}
                params={claimParams}
                waitInvalidation
            />
        </StakingPageWrapper>
    );
};
