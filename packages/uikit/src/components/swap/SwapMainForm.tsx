import { TonConnectTransactionPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import { NonNullableFields } from '@tonkeeper/core/dist/utils/types';
import { FC, useState } from 'react';
import { styled, useTheme } from 'styled-components';
import { AppRoute } from '../../libs/routes';
import { CalculatedSwap } from '../../state/swap/useCalculatedSwap';
import { useEncodeSwapToTonConnectParams } from '../../state/swap/useEncodeSwap';
import {
    useSelectedSwap,
    useSwapFromAmount,
    useSwapFromAsset,
    useSwapToAsset
} from '../../state/swap/useSwapForm';
import { useSwapMobileNotification } from '../../state/swap/useSwapMobileNotification';
import { SwapIcon } from '../Icon';
import { TonTransactionNotification } from '../connect/TonTransactionNotification';
import { IconButton } from '../fields/IconButton';
import { SwapButton } from './SwapButton';
import { SwapFromField } from './SwapFromField';
import { SwapProviders } from './SwapProviders';
import { SwapToField } from './SwapToField';
import { SwapTokensListNotification } from './tokens-list/SwapTokensListNotification';
import { useNavigate } from "../../hooks/router/useNavigate";

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
    const { isLoading, mutateAsync: encode } = useEncodeSwapToTonConnectParams();
    const [modalParams, setModalParams] = useState<TonConnectTransactionPayload | null>(null);
    const [selectedSwap] = useSelectedSwap();
    const [fromAsset, setFromAsset] = useSwapFromAsset();
    const [toAsset, setToAsset] = useSwapToAsset();
    const [_, setFromAmount] = useSwapFromAmount();
    const navigate = useNavigate();
    const [__, setIsMobileSwapOpen] = useSwapMobileNotification();

    const onConfirm = async () => {
        const params = await encode(selectedSwap! as NonNullableFields<CalculatedSwap>);

        setModalParams(params);
    };

    const onChangeFields = () => {
        setFromAsset(toAsset);
        setToAsset(fromAsset);
        if (selectedSwap?.trade) {
            setFromAmount(selectedSwap.trade.to.relativeAmount);
        }
    };

    const onCloseConfirmModal = (boc?: string) => {
        setModalParams(null);
        if (boc) {
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
            {theme.displayType === 'compact' && <SwapProviders />}
            <SwapButton onClick={onConfirm} isEncodingProcess={isLoading || !!modalParams} />
            <TonTransactionNotification
                handleClose={onCloseConfirmModal}
                params={modalParams}
                waitInvalidation
            />
            <SwapTokensListNotification />
        </MainFormWrapper>
    );
};
