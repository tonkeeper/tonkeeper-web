import React, { FC, useCallback, useEffect, useState } from 'react';
import { useAppSdk } from '../hooks/appSdk';
import { useTranslation } from '../hooks/translation';
import { Notification } from './Notification';
import { Button } from './fields/Button';
import {
    LedgerTonProofRequest,
    LedgerTonProofResponse,
    LedgerTransaction
} from '@tonkeeper/core/dist/service/ledger/connector';
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

type LedgerContentLedgerParams =
    | { path: number[]; transactions: LedgerTransaction[]; onSubmit: (result: Cell[]) => void }
    | {
          path: number[];
          tonProof: LedgerTonProofRequest;
          onSubmit: (result: LedgerTonProofResponse) => void;
      };

export const LedgerContent: FC<{
    ledgerParams: LedgerContentLedgerParams;
    onClose: (reason?: unknown) => void;
}> = ({ ledgerParams, onClose }) => {
    const { t } = useTranslation();
    const [isCompleted, setIsCompleted] = useState(false);
    const [currentTxToConfirmIndex, setCurrentTxToConfirmIndex] = useState(0);

    const {
        mutateAsync: connectLedger,
        data: tonTransport,
        isLoading: isLedgerConnecting,
        isDeviceConnected,
        reset: resetConnection
    } = useConnectLedgerMutation();

    const connect = async () => {
        try {
            const transport = await connectLedger();
            try {
                if ('tonProof' in ledgerParams) {
                    const val = await transport.getAddressProof(
                        ledgerParams.path,
                        ledgerParams.tonProof
                    );
                    setIsCompleted(true);
                    setTimeout(() => ledgerParams.onSubmit(val), 500);
                    return;
                }

                const result: Cell[] = [];
                for (const transaction of ledgerParams.transactions) {
                    const val = await transport.signTransaction(ledgerParams.path, transaction);
                    result.push(val);
                    setCurrentTxToConfirmIndex(i => i + 1);
                }

                setIsCompleted(true);
                setTimeout(() => ledgerParams.onSubmit(result), 500);
            } catch (e) {
                console.error(e);
                if (
                    typeof e === 'object' &&
                    e &&
                    'message' in e &&
                    (e.message as string).includes('0x6985')
                ) {
                    onClose(new UserCancelledError('Cancel auth request'));
                } else {
                    onClose(e);
                }
            }
        } catch (error) {
            console.debug(error);
        }
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

    const connectionStepsProps =
        'transactions' in ledgerParams
            ? {
                  transactionsToSign: ledgerParams.transactions.length,
                  signingTransactionIndex: currentTxToConfirmIndex,
                  action: 'transaction' as const
              }
            : {
                  action: 'ton-proof' as const
              };

    return (
        <ConnectLedgerWrapper>
            <LedgerConnectionStepsStyled {...connectionStepsProps} currentStep={currentStep} />
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
        | { path: number[]; transactions: LedgerTransaction[] }
        | { path: number[]; tonProof: LedgerTonProofRequest }
        | undefined
    >(undefined);
    const [requestId, setId] = useState<number | undefined>(undefined);

    const close = useCallback(() => {
        setLedgerParams(undefined);
        setId(undefined);
    }, []);

    const onSubmit = useCallback(
        (result: Cell[] | LedgerTonProofResponse) => {
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
            params:
                | { path: number[]; transactions: LedgerTransaction[] }
                | { path: number[]; tonProof: LedgerTonProofRequest };
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
        return (
            <LedgerContent
                ledgerParams={{ ...ledgerParams, onSubmit } as LedgerContentLedgerParams}
                onClose={onCancel}
            />
        );
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
