import { FC, useState } from 'react';
import { styled, useTheme } from 'styled-components';
import { AppRoute } from '../../libs/routes';
import { useSwapToTonConnectParams } from '../../state/swap/useSwapToTonConnectParams';
import { useSwapFromAmount, useSwapFromAsset, useSwapToAsset } from '../../state/swap/useSwapForm';
import { useSwapMobileNotification } from '../../state/swap/useSwapMobileNotification';
import { swapConfirmation$ } from '../../state/swap/useSwapStreamEffect';
import { SwapIcon } from '../Icon';
import { IconButton } from '../fields/IconButton';
import { SwapButton } from './SwapButton';
import { SwapFromField } from './SwapFromField';
import { SwapToField } from './SwapToField';
import { SwapTokensListNotification } from './tokens-list/SwapTokensListNotification';
import { SwapConfirmationNotification, SwapConfirmData } from './SwapConfirmationNotification';
import { useNavigate } from '../../hooks/router/useNavigate';
import BigNumber from 'bignumber.js';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';

const MainFormWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
`;

const ChangeIconStyled = styled(IconButton)`
    height: 32px;
    width: 32px;
    position: absolute;
    right: calc(50% - 16px);
    bottom: -20px;
    border: none;

    background-color: ${props => props.theme.buttonTertiaryBackground};

    > svg {
        transition: color 0.15s ease-in-out;
    }

    &:hover {
        background-color: ${props => props.theme.buttonTertiaryBackgroundHighlighted};
        > svg {
            color: ${props => props.theme.iconPrimary};
        }
    }
`;

export const SwapMainForm: FC<{ className?: string }> = ({ className }) => {
    const theme = useTheme();
    const { isLoading, mutateAsync: encode } = useSwapToTonConnectParams();
    const [confirmData, setConfirmData] = useState<SwapConfirmData | null>(null);
    const [fromAsset, setFromAsset] = useSwapFromAsset();
    const [toAsset, setToAsset] = useSwapToAsset();
    const [_, setFromAmount] = useSwapFromAmount();
    const navigate = useNavigate();
    const [__, setIsMobileSwapOpen] = useSwapMobileNotification();

    const onConfirm = async () => {
        const confirmation = swapConfirmation$.value;
        if (!confirmation) return;

        if (
            confirmation.tradeStartDeadline &&
            Number(confirmation.tradeStartDeadline) < Date.now() / 1000
        ) {
            return;
        }

        const payload = await encode(confirmation);
        setConfirmData({ confirmation, payload });
    };

    const onChangeFields = () => {
        setFromAsset(toAsset);
        setToAsset(fromAsset);
        const confirmation = swapConfirmation$.value;
        if (confirmation) {
            const toDecimals = toAsset.decimals;
            setFromAmount(shiftedDecimals(new BigNumber(confirmation.askUnits), toDecimals));
        }
    };

    const onCloseConfirmModal = (result?: { boc: string }) => {
        setConfirmData(null);
        if (result) {
            navigate(AppRoute.activity);
            setIsMobileSwapOpen(false);
        }
    };

    return (
        <MainFormWrapper className={className}>
            <SwapFromField>
                <ChangeIconStyled data-testid="change-swap" onClick={onChangeFields}>
                    <SwapIcon />
                </ChangeIconStyled>
            </SwapFromField>
            <SwapToField />
            <SwapButton
                onClick={onConfirm}
                isEncodingProcess={isLoading || !!confirmData}
                size={theme.proDisplayType === 'desktop' ? 'medium' : 'large'}
            />
            <SwapConfirmationNotification
                confirmData={confirmData}
                fromAsset={fromAsset}
                toAsset={toAsset}
                handleClose={onCloseConfirmModal}
            />
            <SwapTokensListNotification />
        </MainFormWrapper>
    );
};
