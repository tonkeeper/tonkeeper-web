import { styled, useTheme } from 'styled-components';
import { SwapFromField } from './SwapFromField';
import { SwapToField } from './SwapToField';
import { SwapButton } from './SwapButton';
import { TonTransactionNotification } from '../connect/TonTransactionNotification';
import { useEncodeSwap } from '../../state/swap/useEncodeSwap';
import { FC, useState } from 'react';
import { TonConnectTransactionPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import {
    useSelectedSwap,
    useSwapFromAmount,
    useSwapFromAsset,
    useSwapToAsset
} from '../../state/swap/useSwapForm';
import { NonNullableFields } from '@tonkeeper/core/dist/utils/types';
import { CalculatedSwap } from '../../state/swap/useCalculatedSwap';
import { Address } from '@ton/core';
import { SwapTokensListNotification } from './tokens-list/SwapTokensListNotification';
import { IconButton } from '../fields/IconButton';
import { SwapIcon } from '../Icon';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../../libs/routes';
import { SwapProviders } from './SwapProviders';
import { useSwapMobileNotification } from '../../state/swap/useSwapMobileNotification';

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

    &:hover {
        background-color: ${props => props.theme.buttonTertiaryBackgroundHighlighted};
    }
`;

export const SwapMainForm: FC<{ className?: string }> = ({ className }) => {
    const theme = useTheme();
    const { isLoading, mutateAsync: encode } = useEncodeSwap();
    const [modalParams, setModalParams] = useState<TonConnectTransactionPayload | null>(null);
    const [selectedSwap] = useSelectedSwap();
    const [fromAsset, setFromAsset] = useSwapFromAsset();
    const [toAsset, setToAsset] = useSwapToAsset();
    const [_, setFromAmount] = useSwapFromAmount();
    const navigate = useNavigate();
    const [__, setIsMobileSwapOpen] = useSwapMobileNotification();
    const onConfirm = async () => {
        const result = await encode(selectedSwap! as NonNullableFields<CalculatedSwap>);

        setModalParams({
            valid_until: (Date.now() + 10 * 60 * 1000) / 1000,
            messages: [
                {
                    address: Address.parse(result.to).toString({ bounceable: true }),
                    amount: result.value,
                    payload: result.body
                }
            ]
        });
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
                <ChangeIconStyled onClick={onChangeFields}>
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
