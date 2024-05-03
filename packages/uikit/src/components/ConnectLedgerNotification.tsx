import React, { FC, useCallback, useEffect, useState } from 'react';
import { useAppSdk } from '../hooks/appSdk';
import { useTranslation } from '../hooks/translation';
import { Notification } from './Notification';
import { Button } from './fields/Button';
import { LedgerTransaction } from '@tonkeeper/core/dist/service/ledger/connector';
import { useConnectLedgerMutation } from '../state/ledger';
import styled from 'styled-components';
import { Cell } from '@ton/core';
import { Body1, Body3, H2 } from './Text';

const ConnectLedgerWrapper = styled.div`
    display: flex;
    align-items: center;
    flex-direction: column;
`;

const H2Styled = styled(H2)`
    margin-bottom: 0.25rem;
`;

const Body1Styled = styled(Body1)`
    margin-bottom: 0.5rem;
    color: ${p => p.theme.textSecondary};
`;

const CardStyled = styled.div`
    box-sizing: border-box;
    padding: 1rem;
    width: 100%;
    margin: 1rem 0;
    background: ${p => p.theme.backgroundContent};
    border-radius: ${p => p.theme.corner2xSmall};
    min-height: 264px;
`;

const ImageStyled = styled.div`
    width: 100px;
    height: 100px;
    background: #10161f;
    margin: 1rem auto;
`;

const Steps = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const ButtonsBlock = styled.div`
    margin-top: 1rem;
    display: flex;
    gap: 8px;
    width: 100%;

    > * {
        flex: 1;
    }
`;

export const LedgerContent: FC<{
    ledgerParams: { path: number[]; transaction: LedgerTransaction };
    onClose: () => void;
    onSubmit: (result: Cell) => void;
}> = ({ ledgerParams, onClose, onSubmit }) => {
    const { t } = useTranslation();

    const {
        mutateAsync: connectLedger,
        data: tonTransport,
        isDeviceConnected,
        reset: resetConnection
    } = useConnectLedgerMutation();

    const connect = () => {
        connectLedger().then(transport =>
            transport
                .signTransaction(ledgerParams.path, ledgerParams.transaction)
                .then(onSubmit)
                .catch(onClose)
        );
    };

    useEffect(() => {
        connect();
    }, []);

    const onRetry = () => {
        resetConnection();
        connect();
    };

    return (
        <ConnectLedgerWrapper>
            <H2Styled>Connect Ledger</H2Styled>
            <Body1Styled>Connect your Ledger to your device</Body1Styled>
            <CardStyled>
                <ImageStyled />
                <Steps>
                    <Body3>Connect ledger device</Body3>
                    {isDeviceConnected && <Body3>Open TON App in your Ledger</Body3>}
                    {!!tonTransport && <Body3>Confirm the transaction in your Ledger</Body3>}
                </Steps>
            </CardStyled>
            <ButtonsBlock>
                <Button secondary onClick={onClose}>
                    Cancel
                </Button>
                <Button primary loading={!!tonTransport} onClick={onRetry}>
                    Continue
                </Button>
            </ButtonsBlock>
        </ConnectLedgerWrapper>
    );
};

const ConnectLedgerNotification = () => {
    const sdk = useAppSdk();

    const [ledgerParams, setLedgerParams] = useState<
        { path: number[]; transaction: LedgerTransaction } | undefined
    >(undefined);
    const [requestId, setId] = useState<number | undefined>(undefined);

    const close = useCallback(() => {
        setLedgerParams(undefined);
        setId(undefined);
    }, []);

    const onSubmit = useCallback(
        (result: Cell) => {
            sdk.uiEvents.emit('response', {
                method: 'response',
                id: requestId,
                params: result
            });
            close();
        },
        [sdk, requestId, close]
    );

    const onCancel = useCallback(() => {
        if (requestId) {
            sdk.uiEvents.emit('response', {
                method: 'response',
                id: requestId,
                params: new Error('Cancel auth request')
            });
        }
        close();
    }, [requestId, sdk, close]);

    useEffect(() => {
        const handler = (options: {
            method: 'ledger';
            id?: number | undefined;
            params: { path: number[]; transaction: LedgerTransaction };
        }) => {
            setLedgerParams(options.params!);
            setId(options.id);
        };
        sdk.uiEvents.on('ledger', handler);
        return () => {
            sdk.uiEvents.off('ledger', handler);
        };
    }, [sdk]);

    const Content = useCallback(() => {
        if (!ledgerParams || !requestId) return undefined;
        return <LedgerContent ledgerParams={ledgerParams} onClose={onCancel} onSubmit={onSubmit} />;
    }, [sdk, ledgerParams, requestId, onCancel, onSubmit]);

    return (
        <Notification isOpen={ledgerParams != null && requestId != null} handleClose={onCancel}>
            {Content}
        </Notification>
    );
};

export default ConnectLedgerNotification;
