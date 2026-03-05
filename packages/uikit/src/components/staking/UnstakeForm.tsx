import BigNumber from 'bignumber.js';
import { toNano } from '@ton/core';
import { jettonToTonAssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { TonConnectTransactionPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import { FC, useMemo, useState } from 'react';
import { styled } from 'styled-components';
import { AppRoute } from '../../libs/routes';
import { useAtom } from '../../libs/useAtom';
import { useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { useNavigate } from '../../hooks/router/useNavigate';
import { formatter, formatFiatCurrency } from '../../hooks/balance';
import { useRate, useFormatFiat } from '../../state/rates';
import { useJettonBalance } from '../../state/jetton';
import { useTonBalance } from '../../state/wallet';
import { stakingSelectedPool$ } from '../../state/staking/stakingAtoms';
import { useStakingPools } from '../../state/staking/useStakingPools';
import { useEncodeStakingUnstake } from '../../state/staking/useEncodeStaking';
import { useStakingCycleCountdown } from '../../state/staking/useStakingCycleCountdown';
import { useStakingPosition } from '../../state/staking/useStakingPosition';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { TonTransactionNotification } from '../connect/TonTransactionNotification';
import { Body2, Body2Class, Body3 } from '../Text';
import { Button } from '../fields/Button';

const MainFormWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
`;

const TopRow = styled.div`
    display: flex;
    gap: 8px;
    align-items: flex-start;
`;

const FieldContainer = styled.div`
    flex: 1;
    min-width: 0;
`;

const InputBorderedBox = styled.label`
    background: ${p => p.theme.fieldBackground};
    border: 1px solid ${p => p.theme.fieldBackground};
    border-radius: ${p =>
        p.theme.displayType === 'full-width' ? p.theme.corner2xSmall : p.theme.cornerSmall};
    transition: border-color 0.15s ease-in-out;
    display: flex;
    align-items: center;
    padding: 0 12px;
    height: 52px;
    box-sizing: border-box;
    gap: 8px;
    cursor: text;

    &:focus-within {
        border-color: ${p => p.theme.fieldActiveBorder};
    }
`;

const FieldFooter = styled.div`
    display: flex;
    align-items: center;
    padding: 4px 12px;
    min-height: 20px;
    gap: 4px;
`;

const AmountInputStyled = styled.input<{ $isErrored: boolean; $width: number }>`
    border: none;
    background: none;
    text-align: left;
    outline: none;
    color: ${p => (p.$isErrored ? p.theme.accentRed : p.theme.textPrimary)};
    font-family: inherit;
    min-width: 1ch;
    width: ${p => p.$width}ch;

    ${Body2Class}

    &::placeholder {
        color: ${p => p.theme.textTertiary};
    }

    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    -moz-appearance: textfield;
`;

const InputLeft = styled.div`
    display: flex;
    align-items: center;
    gap: 2px;
    flex: 1;
    min-width: 0;
    overflow: hidden;
`;

const TokenLabel = styled.span`
    font-size: 14px;
    color: ${p => p.theme.textSecondary};
    flex-shrink: 0;
`;

const FiatAmount = styled(Body2)`
    color: ${p => p.theme.textSecondary};
    text-align: right;
    flex-shrink: 0;
    white-space: nowrap;
`;

const ErrorText = styled(Body3)`
    color: ${p => p.theme.accentRed};
`;

const BalanceLabel = styled(Body3)`
    color: ${p => p.theme.textSecondary};
`;

const MaxButton = styled.button`
    border: none;
    background: none;
    padding: 0;
    cursor: pointer;
    color: ${p => p.theme.accentBlue};
    font-size: 12px;
    font-weight: 500;
    line-height: 16px;
`;

const CycleInfoCard = styled.div`
    background: ${p => p.theme.backgroundContent};
    border-radius: ${p =>
        p.theme.displayType === 'full-width' ? p.theme.corner2xSmall : p.theme.cornerSmall};
    padding: 12px;
    flex: 1;
    min-width: 0;
    min-height: 52px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
`;

const CycleInfoText = styled(Body3)`
    color: ${p => p.theme.textSecondary};
`;

export const UnstakeForm: FC<{ className?: string }> = ({ className }) => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    const [amount, setAmount] = useState('');
    const [modalParams, setModalParams] = useState<TonConnectTransactionPayload | null>(null);
    const [selectedPool] = useAtom(stakingSelectedPool$);
    const { data: pools } = useStakingPools();
    const { isLoading, isError: encodeError, mutateAsync: encode } = useEncodeStakingUnstake();
    const navigate = useNavigate();

    const pool = selectedPool ?? pools?.[0];
    const isLiquid = !!pool?.liquidJettonMaster;

    const { data: tsTonBalance, isLoading: isTsTonLoading } = useJettonBalance(
        isLiquid ? pool?.liquidJettonMaster : undefined
    );
    const { data: position } = useStakingPosition(isLiquid ? undefined : pool?.address);
    const { data: tonBalance } = useTonBalance();

    const unstakableAmount = useMemo(() => {
        if (isLiquid) {
            if (!tsTonBalance) return undefined;
            return jettonToTonAssetAmount(tsTonBalance).relativeAmount;
        }
        if (position) {
            return shiftedDecimals(position.amount);
        }
        return undefined;
    }, [isLiquid, tsTonBalance, position]);

    const tokenSymbol = isLiquid ? tsTonBalance?.jetton?.symbol ?? 'tsTON' : 'TON';
    const isBalanceLoading = isLiquid ? isTsTonLoading : !position;

    const amountBN = useMemo(() => {
        if (!amount) return undefined;
        const bn = new BigNumber(amount);
        return bn.isNaN() ? undefined : bn;
    }, [amount]);

    const rateToken = isLiquid
        ? pool?.liquidJettonMaster ?? CryptoCurrency.TON
        : CryptoCurrency.TON;
    const { data: rate } = useRate(rateToken);
    const { fiatAmount } = useFormatFiat(rate, amountBN);

    const countdown = useStakingCycleCountdown(pool);

    const isInsufficient = useMemo(() => {
        if (!amountBN || isBalanceLoading) return false;
        if (!unstakableAmount) return true;
        return amountBN.gt(unstakableAmount);
    }, [amountBN, unstakableAmount, isBalanceLoading]);

    const onMaxClick = () => {
        if (unstakableAmount !== undefined) {
            setAmount(unstakableAmount.toFixed(9, BigNumber.ROUND_DOWN));
        }
    };

    const onConfirm = async () => {
        if (
            !pool ||
            !unstakableAmount ||
            !amount ||
            !amountBN ||
            amountBN.isZero() ||
            amountBN.isNegative()
        )
            return;
        const amountNano = toNano(amountBN.toFixed(9));
        try {
            const params = await encode({ pool, amount: amountNano });
            setModalParams(params);
        } catch {
            // encode mutation tracks error state via React Query
        }
    };

    const onCloseConfirmModal = (result?: { boc: string }) => {
        setModalParams(null);
        if (result) {
            navigate(AppRoute.activity);
        }
    };

    const tonBalanceBN = tonBalance?.relativeAmount;
    const hasFeeTON = tonBalanceBN !== undefined && tonBalanceBN.gte(1.05);

    const renderButton = () => {
        if (!amountBN || amountBN.isZero() || amountBN.isNegative()) {
            return (
                <Button size="large" fullWidth secondary disabled>
                    {t('staking_enter_amount')}
                </Button>
            );
        }

        if (isInsufficient) {
            return (
                <Button size="large" fullWidth secondary disabled>
                    {t('staking_insufficient_balance')}
                </Button>
            );
        }

        if (isBalanceLoading || tonBalanceBN === undefined) {
            return <Button size="large" fullWidth secondary disabled loading />;
        }

        if (!hasFeeTON) {
            return (
                <Button size="large" fullWidth secondary disabled>
                    {t('staking_insufficient_balance')}
                </Button>
            );
        }

        if (encodeError) {
            return (
                <Button size="large" fullWidth secondary disabled>
                    {t('error_occurred')}
                </Button>
            );
        }

        return (
            <Button
                size="large"
                fullWidth
                primary
                onClick={onConfirm}
                loading={isLoading || !!modalParams}
            >
                {t('continue')}
            </Button>
        );
    };

    const fiatDisplay = useMemo(() => {
        const formatted = fiatAmount ? fiatAmount : formatFiatCurrency(fiat, 0);
        return `≈${formatted}`;
    }, [fiatAmount, fiat]);

    const unstakableDisplay = useMemo(() => {
        if (!unstakableAmount) {
            return '0';
        }

        return formatter.formatDisplay(unstakableAmount);
    }, [unstakableAmount]);

    return (
        <MainFormWrapper className={className}>
            <TopRow>
                <FieldContainer>
                    <InputBorderedBox>
                        <InputLeft>
                            <AmountInputStyled
                                type="number"
                                min="0"
                                step="any"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0"
                                inputMode="decimal"
                                $isErrored={isInsufficient}
                                $width={Math.max(1, (amount || '0').length)}
                            />
                            <TokenLabel>{tokenSymbol}</TokenLabel>
                        </InputLeft>
                        <FiatAmount>{fiatDisplay}</FiatAmount>
                    </InputBorderedBox>
                    <FieldFooter>
                        {isInsufficient ? (
                            <ErrorText>{t('staking_insufficient_balance')}</ErrorText>
                        ) : (
                            <>
                                <BalanceLabel>
                                    {t('staking_available_label')}: {unstakableDisplay}
                                </BalanceLabel>
                                <MaxButton onClick={onMaxClick}>{t('staking_max')}</MaxButton>
                            </>
                        )}
                    </FieldFooter>
                </FieldContainer>
                {countdown !== null && (countdown || isLiquid) && (
                    <CycleInfoCard>
                        <CycleInfoText>
                            {countdown
                                ? t('staking_unstake_cycle_info', { value: countdown })
                                : t('staking_next_cycle_desc_liquid')}
                        </CycleInfoText>
                    </CycleInfoCard>
                )}
            </TopRow>
            {renderButton()}
            <TonTransactionNotification
                handleClose={onCloseConfirmModal}
                params={modalParams}
                waitInvalidation
            />
        </MainFormWrapper>
    );
};
