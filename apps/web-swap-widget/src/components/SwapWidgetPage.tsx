import { styled } from 'styled-components';
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
import { SwapButton } from '@tonkeeper/uikit/dist/components/swap/SwapButton';
import { SwapTokensListNotification } from '@tonkeeper/uikit/dist/components/swap/tokens-list/SwapTokensListNotification';
import { IconButton } from '@tonkeeper/uikit/dist/components/fields/IconButton';
import { NonNullableFields } from '@tonkeeper/core/dist/utils/types';
import { SwapWidgetHeader } from './SwapWidgetHeader';
import { getTonkeeperInjectionContext } from '../libs/tonkeeper-injection-context';
import { SwapWidgetFooter } from './SwapWidgetFooter';
import { SwapWidgetTxSentNotification } from './SwapWidgetTxSent';
import { useDisclosure } from '@tonkeeper/uikit/dist/hooks/useDisclosure';
import { useToast } from '@tonkeeper/uikit/dist/hooks/useNotification';
import { toErrorMessage } from '@tonkeeper/uikit/dist/libs/common';

const MainFormWrapper = styled.div`
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
`;

const Spacer = styled.div`
    flex: 1;
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
    const { isLoading, mutateAsync: encode } = useEncodeSwapToTonConnectParams({
        forceCalculateBattery: true
    });
    const [hasBeenSent, setHasBeenSent] = useState<boolean>(false);
    const [selectedSwap] = useSelectedSwap();
    const [fromAsset, setFromAsset] = useSwapFromAsset();
    const [toAsset, setToAsset] = useSwapToAsset();
    const [_, setFromAmount] = useSwapFromAmount();
    const { isOpen, onClose, onOpen } = useDisclosure();
    const notifyError = useToast();

    const onConfirm = async () => {
        const params = await encode(selectedSwap! as NonNullableFields<CalculatedSwap>);

        const ctx = getTonkeeperInjectionContext()!;

        setHasBeenSent(true);
        try {
            const result = await ctx.sendTransaction({
                source: ctx.address,
                // legacy tonkeeper api, timestamp in ms
                valid_until: params.valid_until * 1000,
                messages: params.messages.map(m => ({
                    address: m.address,
                    amount: m.amount.toString(),
                    payload: m.payload
                })),
                messagesVariants: params.messagesVariants
                    ? Object.fromEntries(
                          Object.entries(params.messagesVariants).map(([k, v]) => [
                              k,
                              v.map(m => ({
                                  address: m.address,
                                  amount: m.amount.toString(),
                                  payload: m.payload
                              }))
                          ])
                      )
                    : undefined
            });

            if (!result) {
                throw new Error('Transaction was not confirmed');
            }

            onOpen();
        } catch (e) {
            notifyError(toErrorMessage(e));
        } finally {
            setHasBeenSent(false);
        }
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
            <SwapWidgetHeader />
            <SwapFromField>
                <ChangeIconStyled data-testid="change-swap" onClick={onChangeFields}>
                    <SwapIcon />
                </ChangeIconStyled>
            </SwapFromField>
            <SwapToField separateInfo />
            <SwapButton onClick={onConfirm} isEncodingProcess={isLoading || hasBeenSent} />
            <Spacer />
            <SwapWidgetFooter />
            <SwapTokensListNotification />
            <SwapWidgetTxSentNotification isOpen={isOpen} onClose={onClose} />
        </MainFormWrapper>
    );
};
