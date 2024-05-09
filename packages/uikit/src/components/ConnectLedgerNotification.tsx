import React, { FC, useCallback, useEffect, useState } from 'react';
import { useAppSdk } from '../hooks/appSdk';
import { useTranslation } from '../hooks/translation';
import { Notification } from './Notification';
import { Button } from './fields/Button';
import { LedgerTransaction } from '@tonkeeper/core/dist/service/ledger/connector';
import { useConnectLedgerMutation } from '../state/ledger';
import styled from 'styled-components';
import { Cell } from '@ton/core';
import { LedgerConnectionSteps } from './ledger/LedgerConnectionSteps';
import { UserCancelledError } from '../libs/errors/UserCancelledError';

const ConnectLedgerWrapper = styled.div`
    display: flex;
    align-items: center;
    flex-direction: column;
`;

const LedgerConnectionStepsStyled = styled(LedgerConnectionSteps)`
    margin: 1rem 0;
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
    onClose: (reason?: unknown) => void;
    onSubmit: (result: Cell) => void;
}> = ({ ledgerParams, onClose, onSubmit }) => {
    const { t } = useTranslation();
    const [isCompleted, setIsCompleted] = useState(false);

    const {
        mutateAsync: connectLedger,
        data: tonTransport,
        isLoading: isLedgerConnecting,
        isDeviceConnected,
        reset: resetConnection
    } = useConnectLedgerMutation();

    const connect = () => {
        connectLedger()
            .then(transport =>
                transport
                    .signTransaction(ledgerParams.path, ledgerParams.transaction)
                    .then(val => {
                        setIsCompleted(true);
                        setTimeout(() => onSubmit(val), 500);
                    })
                    .catch(e => {
                        console.error(e);
                        if (
                            typeof e === 'object' &&
                            'message' in e &&
                            e.message.includes('0x6985')
                        ) {
                            onClose(new UserCancelledError('Cancel auth request'));
                        } else {
                            onClose(e);
                        }
                    })
            )
            .catch(console.debug);
    };

    useEffect(() => {
        connect();
    }, []);

    const onRetry = () => {
        resetConnection();
        connect();
    };

    let currentStep: 'connect' | 'open-ton' | 'confirm-tx' | 'all-completed' = 'connect';
    if (isDeviceConnected) {
        currentStep = 'open-ton';
    }
    if (tonTransport) {
        currentStep = 'confirm-tx';
    }
    if (isCompleted) {
        currentStep = 'all-completed';
    }

    return (
        <ConnectLedgerWrapper>
            <LedgerConnectionStepsStyled showConfirmTxStep currentStep={currentStep} />
            <ButtonsBlock>
                <Button
                    secondary
                    onClick={() => onClose(new UserCancelledError('Cancel auth request'))}
                >
                    {t('cancel')}
                </Button>
                <Button
                    primary
                    loading={isLedgerConnecting || !!tonTransport || isCompleted}
                    onClick={onRetry}
                >
                    {t('try_again')}
                </Button>
            </ButtonsBlock>
        </ConnectLedgerWrapper>
    );
};

const ConnectLedgerNotification = () => {
    const sdk = useAppSdk();
    const { t } = useTranslation();

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

    const onCancel = useCallback(
        (reason?: unknown) => {
            if (requestId) {
                sdk.uiEvents.emit('response', {
                    method: 'response',
                    id: requestId,
                    params: reason ?? new Error('Unknown Ledger error')
                });
            }
            close();
        },
        [requestId, sdk, close]
    );

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
        <Notification
            isOpen={ledgerParams != null && requestId != null}
            handleClose={() => onCancel(new UserCancelledError('Cancel auth request'))}
            title={t('ledger_connect_header')}
        >
            {Content}
        </Notification>
    );
};

export default ConnectLedgerNotification;
