import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { toTronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { jettonToTonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { RecipientData, TonRecipientData } from '@tonkeeper/core/dist/entries/send';
import {
    TonTransferParams,
    parseTonTransfer
} from '@tonkeeper/core/dist/service/deeplinkingService';
import { AccountRepr, JettonsBalances } from '@tonkeeper/core/dist/tonApiV1';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import BigNumber from 'bignumber.js';
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { openIosKeyboard } from '../../hooks/ios';
import { useTranslation } from '../../hooks/translation';
import { useUserJettonList } from '../../state/jetton';
import { useTronBalances } from '../../state/tron/tron';
import { useWalletJettonList } from '../../state/wallet';
import { Notification } from '../Notification';
import { Action } from '../home/Actions';
import { SendIcon } from '../home/HomeIcons';
import { ConfirmTransferView } from './ConfirmTransferView';
import { RecipientView, useGetToAccount } from './RecipientView';
import { AmountView, AmountViewState } from './amount-view/AmountView';
import { Wrapper, childFactoryCreator, duration } from './common';

const SendContent: FC<{
    onClose: () => void;
    chain?: BLOCKCHAIN_NAME;
    initRecipient?: RecipientData;
    initAmountState?: Partial<AmountViewState>;
}> = ({ onClose, chain, initRecipient, initAmountState }) => {
    const sdk = useAppSdk();
    const { standalone, ios, extension } = useAppContext();
    const { t } = useTranslation();
    const { data: jettons } = useWalletJettonList();
    const filter = useUserJettonList(jettons);

    const recipientRef = useRef<HTMLDivElement>(null);
    const amountRef = useRef<HTMLDivElement>(null);
    const confirmRef = useRef<HTMLDivElement>(null);

    const [view, setView] = useState<'recipient' | 'amount' | 'confirm'>('recipient');
    const [right, setRight] = useState(true);
    const [recipient, _setRecipient] = useState<RecipientData | undefined>(initRecipient);
    const [amountViewState, setAmountViewState] = useState<Partial<AmountViewState> | undefined>(
        initAmountState
    );

    const { data: tronBalances } = useTronBalances();

    const { mutateAsync: getAccountAsync, isLoading: isAccountLoading } = useGetToAccount();

    const setRecipient = (value: RecipientData) => {
        if (
            amountViewState?.asset?.blockchain &&
            amountViewState?.asset?.blockchain !== value.address.blockchain
        ) {
            setAmountViewState(undefined);
        }

        _setRecipient(value);
        if (tronBalances && value.address.blockchain === BLOCKCHAIN_NAME.TRON) {
            setAmountViewState({ asset: toTronAsset(tronBalances.balances[0]) });
        }
    };

    const onRecipient = (data: RecipientData) => {
        setRight(true);
        setRecipient(data);
        setView('amount');
    };

    const onConfirmAmount = (data: AmountViewState) => {
        setRight(true);
        setAmountViewState(data);
        setView('confirm');
    };

    const backToRecipient = (data?: AmountViewState) => {
        setRight(false);
        setAmountViewState(data);
        setView('recipient');
    };

    const backToAmount = () => {
        if (ios) openIosKeyboard('decimal');
        setRight(false);
        setView('amount');
    };

    const processTron = (address: string) => {
        const item = { address: address, blockchain: BLOCKCHAIN_NAME.TRON } as const;

        setRecipient({
            address: item,
            done: true
        });
        setView('amount');
    };

    const processRecipient = async ({ address, text }: TonTransferParams) => {
        const item = { address: address, blockchain: BLOCKCHAIN_NAME.TON } as const;
        const toAccount = await getAccountAsync(item);

        const done = !toAccount.memoRequired ? true : toAccount.memoRequired && text ? true : false;

        setRecipient({
            address: item,
            toAccount,
            comment: text ?? '',
            done
        });
        if (done) {
            setView('amount');
        }
    };

    const processJetton = useCallback(
        async ({ amount: a, jetton }: TonTransferParams) => {
            if (jetton) {
                let actualAsset;
                try {
                    actualAsset = jettonToTonAsset(jetton, filter);
                } catch (e) {
                    sdk.uiEvents.emit('copy', {
                        method: 'copy',
                        params: t('Unexpected_QR_Code')
                    });
                    return false;
                }

                const assetAmount = new AssetAmount({
                    asset: actualAsset,
                    weiAmount: a || '0'
                });

                setAmountViewState({
                    amount: assetAmount.relativeAmount,
                    asset: actualAsset,
                    inFiat: false,
                    isMax: false
                });
            } else {
                setAmountViewState({
                    amount: a ? shiftedDecimals(a) : new BigNumber('0'),
                    asset: initAmountState?.asset,
                    inFiat: false,
                    isMax: false
                });
            }

            return true;
        },
        [sdk, filter, initAmountState?.asset]
    );

    const onScan = async (signature: string) => {
        const param = parseTonTransfer({ url: signature });

        if (param) {
            const ok = await processJetton(param);
            if (ok) {
                await processRecipient(param);
            }
            return;
        }

        // TODO: ENABLE TRON
        // if (seeIfValidTronAddress(signature)) {
        //     return processTron(signature);
        // }

        return sdk.uiEvents.emit('copy', {
            method: 'copy',
            params: t('Unexpected_QR_Code')
        });
    };

    const nodeRef = {
        recipient: recipientRef,
        amount: amountRef,
        confirm: confirmRef
    }[view];

    return (
        <Wrapper standalone={standalone} extension={extension}>
            <TransitionGroup childFactory={childFactoryCreator(right)}>
                <CSSTransition
                    key={view}
                    nodeRef={nodeRef}
                    classNames="right-to-left"
                    addEndListener={done => {
                        setTimeout(done, duration);
                    }}
                >
                    <div ref={nodeRef}>
                        {view === 'recipient' && (
                            <RecipientView
                                title={t('transaction_recipient')}
                                data={recipient}
                                onClose={onClose}
                                setRecipient={onRecipient}
                                onScan={onScan}
                                keyboard="decimal"
                                isExternalLoading={isAccountLoading}
                                acceptBlockchains={chain ? [chain] : undefined}
                            />
                        )}
                        {view === 'amount' && (
                            <AmountView
                                defaults={amountViewState}
                                onClose={onClose}
                                onBack={backToRecipient}
                                recipient={recipient!}
                                onConfirm={onConfirmAmount}
                            />
                        )}
                        {view === 'confirm' && (
                            <ConfirmTransferView
                                onClose={onClose}
                                onBack={backToAmount}
                                recipient={recipient!}
                                assetAmount={AssetAmount.fromRelativeAmount({
                                    asset: amountViewState!.asset!,
                                    amount: amountViewState!.amount!
                                })}
                                isMax={amountViewState!.isMax!}
                            />
                        )}
                    </div>
                </CSSTransition>
            </TransitionGroup>
        </Wrapper>
    );
};

export interface InitTransferData {
    initRecipient?: TonRecipientData;
    initAmountState?: Partial<AmountViewState>;
}

const getInitData = (
    tonTransfer: TonTransferParams,
    toAccount: AccountRepr,
    jettons: JettonsBalances | undefined
): InitTransferData => {
    const initRecipient: TonRecipientData = {
        address: {
            blockchain: BLOCKCHAIN_NAME.TON,
            address: tonTransfer.address
        },
        toAccount,
        comment: tonTransfer.text ?? '',
        done: toAccount.memoRequired ? tonTransfer.text !== '' && tonTransfer.text !== null : true
    };

    const { initAmountState } = getJetton(tonTransfer.jetton, jettons);

    return {
        initRecipient,
        initAmountState
    };
};

const getJetton = (
    asset: string | undefined,
    jettons: JettonsBalances | undefined
): InitTransferData => {
    try {
        if (asset) {
            const token = jettonToTonAsset(asset, jettons || { balances: [] });

            return {
                initAmountState: { asset: token }
            };
        }
    } catch {
        return {};
    }
    return {};
};

export const SendAction: FC<{ asset?: string; chain?: BLOCKCHAIN_NAME }> = ({ asset, chain }) => {
    const [open, setOpen] = useState(false);
    const [tonTransfer, setTonTransfer] = useState<InitTransferData | undefined>(undefined);
    const { data: jettons } = useWalletJettonList();

    const { mutateAsync: getAccountAsync, reset } = useGetToAccount();

    const sdk = useAppSdk();

    useEffect(() => {
        const handler = (options: {
            method: 'transfer';
            id?: number | undefined;
            params: TonTransferParams;
        }) => {
            if (sdk.twaExpand) {
                sdk.twaExpand();
            }
            reset();
            getAccountAsync({ address: options.params.address }).then(account => {
                setTonTransfer(getInitData(options.params, account, jettons));
                setOpen(true);
            });
        };

        sdk.uiEvents.on('transfer', handler);
        return () => {
            sdk.uiEvents.off('transfer', handler);
        };
    }, []);

    const onClose = useCallback(() => {
        setTonTransfer(undefined);
        setOpen(false);
    }, []);

    const initData = useMemo(() => {
        return tonTransfer ? tonTransfer : getJetton(asset, jettons);
    }, [tonTransfer, asset, jettons]);

    const Content = useCallback(() => {
        if (!open) return undefined;
        return (
            <SendContent
                onClose={onClose}
                chain={chain}
                initAmountState={initData.initAmountState}
                initRecipient={initData.initRecipient}
            />
        );
    }, [open, initData, chain]);

    return (
        <>
            <Action icon={<SendIcon />} title={'wallet_send'} action={() => setOpen(true)} />
            <Notification isOpen={open} handleClose={onClose} hideButton backShadow>
                {Content}
            </Notification>
        </>
    );
};
