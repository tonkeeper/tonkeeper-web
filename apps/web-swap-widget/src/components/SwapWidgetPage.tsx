import { styled, useTheme } from 'styled-components';
import { useEncodeSwapToTonConnectParams } from '@tonkeeper/uikit/dist/state/swap/useEncodeSwap';
import { useState } from 'react';
import {
    useSelectedSwap,
    useSwapFromAmount,
    useSwapFromAsset,
    useSwapToAsset
} from '@tonkeeper/uikit/dist/state/swap/useSwapForm';
import { CalculatedSwap } from '@tonkeeper/uikit/dist/state/swap/useCalculatedSwap';
import { SwapFromField } from '@tonkeeper/uikit/dist/components/swap/SwapFromField';
import { SwapIcon } from '@tonkeeper/uikit/dist/components/Icon';
import { SwapToField } from '@tonkeeper/uikit/dist/components/swap/SwapToField';
import { SwapProviders } from '@tonkeeper/uikit/dist/components/swap/SwapProviders';
import { SwapButton } from '@tonkeeper/uikit/dist/components/swap/SwapButton';
import { SwapTokensListNotification } from '@tonkeeper/uikit/dist/components/swap/tokens-list/SwapTokensListNotification';
import { IconButton } from '@tonkeeper/uikit/dist/components/fields/IconButton';
import { TonConnectTransactionPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import { NonNullableFields } from '@tonkeeper/core/dist/utils/types';

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

export const SwapWidgetPage = () => {
    const theme = useTheme();
    const { isLoading, mutateAsync: encode } = useEncodeSwapToTonConnectParams();
    const [modalParams, setModalParams] = useState<TonConnectTransactionPayload | null>(null);
    const [selectedSwap] = useSelectedSwap();
    const [fromAsset, setFromAsset] = useSwapFromAsset();
    const [toAsset, setToAsset] = useSwapToAsset();
    const [_, setFromAmount] = useSwapFromAmount();

    const onConfirm = async () => {
        const params = await encode(selectedSwap! as NonNullableFields<CalculatedSwap>);
        // Ton Connect send

        setModalParams(params);
    };

    const onChangeFields = () => {
        setFromAsset(toAsset);
        setToAsset(fromAsset);
        if (selectedSwap?.trade) {
            setFromAmount(selectedSwap.trade.to.relativeAmount);
        }
    };

    return (
        <MainFormWrapper>
            <SwapFromField>
                <ChangeIconStyled data-testid="change-swap" onClick={onChangeFields}>
                    <SwapIcon />
                </ChangeIconStyled>
            </SwapFromField>
            <SwapToField />
            {theme.displayType === 'compact' && <SwapProviders />}
            <SwapButton onClick={onConfirm} isEncodingProcess={isLoading || !!modalParams} />
            <SwapTokensListNotification />
        </MainFormWrapper>
    );
};
