import styled from 'styled-components';
import { Num2 } from '../../Text';
import { useWalletTotalBalance } from '../../../state/wallet';
import { Skeleton } from '../../shared/Skeleton';
import { useAppContext, useWalletContext } from '../../../hooks/appContext';
import { formatFiatCurrency } from '../../../hooks/balance';
import { Button } from '../../fields/Button';
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, RefreshIcon, SwapIcon } from '../../Icon';
import { useAppSdk } from '../../../hooks/appSdk';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import React, { useState } from 'react';
import { BuyNotification } from '../../home/BuyAction';
import { useDisclosure } from '../../../hooks/useDisclosure';
import { useTonendpointBuyMethods } from '../../../state/tonendpoint';
import { DesktopExternalLinks } from '../../../libs/externalLinks';
import { usePreFetchRates } from '../../../state/rates';
import { IconButton } from '../../fields/IconButton';
import { useQueryClient } from '@tanstack/react-query';
import { QueryKey } from '../../../libs/queryKey';

const DesktopHeaderStyled = styled.div`
    padding-left: 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid ${p => p.theme.backgroundContentAttention};
    background: ${p => p.theme.backgroundContent};
`;

const ButtonsContainer = styled.div`
    display: flex;
    gap: 0.5rem;
    padding: 1rem;
`;

const DesktopRightPart = styled.div`
    display: flex;
`;

const ButtonStyled = styled(Button)`
    display: flex;
    gap: 6px;

    > svg {
        color: ${p => p.theme.buttonTertiaryForeground};
    }
`;

const BalanceContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;

    & > ${IconButton} {
        padding: 4px;
        background-color: ${p => p.theme.buttonTertiaryBackground};

        transition: background-color 0.2s ease-in-out;

        &:hover {
            background-color: ${p => p.theme.buttonTertiaryBackgroundHighlighted};
        }

        &:disabled {
            background-color: ${p => p.theme.buttonTertiaryBackgroundDisabled};
            animation-name: spin;
            cursor: default;
        }

        animation-name: unset;
        animation-duration: 1s;
        animation-iteration-count: infinite;
        animation-timing-function: linear;
    }

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
`;

export const DesktopHeader = () => {
    usePreFetchRates();
    const { fiat } = useAppContext();
    const { data: balance, isLoading } = useWalletTotalBalance(fiat);
    const sdk = useAppSdk();
    const { isOpen, onClose, onOpen } = useDisclosure();
    const { data: buy } = useTonendpointBuyMethods();
    const client = useQueryClient();
    const wallet = useWalletContext();

    const [isRefreshing, setIsRefreshing] = useState(false);

    const onRefresh = async () => {
        setIsRefreshing(true);
        let isCompleted = false;

        const interval = setInterval(() => {
            if (isCompleted) {
                setIsRefreshing(false);
                clearInterval(interval);
            }
        }, 1000);
        await Promise.all([
            client.invalidateQueries([wallet.active.rawAddress, QueryKey.jettons]),
            client.invalidateQueries([wallet.active.rawAddress, QueryKey.info]),
            client.invalidateQueries([wallet.publicKey, QueryKey.tron]),
            client.invalidateQueries([QueryKey.total]),
            client.invalidateQueries([QueryKey.distribution])
        ]);
        isCompleted = true;
    };

    return (
        <DesktopHeaderStyled>
            {isLoading ? (
                <Skeleton width="100px" height="36px" />
            ) : (
                <BalanceContainer>
                    <Num2>{formatFiatCurrency(fiat, balance || 0)}</Num2>
                    <IconButton onClick={onRefresh} disabled={isRefreshing}>
                        <RefreshIcon />
                    </IconButton>
                </BalanceContainer>
            )}
            <Num2></Num2>
            <DesktopRightPart>
                <ButtonsContainer>
                    <ButtonStyled
                        size="small"
                        onClick={() =>
                            sdk.uiEvents.emit('transfer', {
                                method: 'transfer',
                                id: Date.now(),
                                params: { asset: 'TON', chain: BLOCKCHAIN_NAME.TON }
                            })
                        }
                    >
                        <ArrowUpIcon />
                        Send
                    </ButtonStyled>
                    <ButtonStyled
                        size="small"
                        onClick={() => {
                            sdk.uiEvents.emit('receive', {
                                method: 'receive',
                                params: {}
                            });
                        }}
                    >
                        <ArrowDownIcon />
                        Receive
                    </ButtonStyled>
                </ButtonsContainer>
                <ButtonsContainer>
                    <ButtonStyled
                        size="small"
                        onClick={() => sdk.openPage(DesktopExternalLinks.Swap)}
                    >
                        <SwapIcon />
                        Swap
                    </ButtonStyled>
                    <ButtonStyled size="small" onClick={onOpen}>
                        <PlusIcon />
                        Buy
                    </ButtonStyled>
                </ButtonsContainer>
            </DesktopRightPart>
            <BuyNotification buy={buy} open={isOpen} handleClose={onClose} />
        </DesktopHeaderStyled>
    );
};
