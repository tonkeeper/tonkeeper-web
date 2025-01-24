import { TransferInitParams } from '@tonkeeper/core/dist/AppSdk';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { jettonToTonAsset, TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { RecipientData, TonRecipientData } from '@tonkeeper/core/dist/entries/send';
import {
    parseTonTransferWithAddress,
    TonTransferParams
} from '@tonkeeper/core/dist/service/deeplinkingService';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import BigNumber from 'bignumber.js';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { openIosKeyboard } from '../../hooks/ios';
import { useTranslation } from '../../hooks/translation';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';
import { useJettonList } from '../../state/jetton';
import { useActiveTronWallet } from '../../state/tron/tron';
import {
    Notification,
    NotificationFooter,
    NotificationFooterPortal,
    NotificationHeader,
    NotificationHeaderPortal
} from '../Notification';
import { ConfirmTransferView } from './ConfirmTransferView';
import {
    ConfirmViewButtons,
    ConfirmViewButtonsSlot,
    ConfirmViewTitle,
    ConfirmViewTitleSlot
} from './ConfirmView';
import { RecipientView, useGetToAccount } from './RecipientView';
import { AmountView } from './amountView/AmountView';
import { AmountState } from './amountView/amountState';
import {
    AmountHeaderBlock,
    AmountMainButton,
    childFactoryCreator,
    ConfirmMainButton,
    duration,
    InitTransferData,
    MainButton,
    makeTransferInitAmountState,
    makeTransferInitData,
    RecipientHeaderBlock,
    TransferViewHeaderBlock,
    Wrapper
} from './common';
import { MultisigOrderFormView } from './MultisigOrderFormView';
import { MultisigOrderLifetimeMinutes } from '../../libs/multisig';
import { useIsActiveAccountMultisig } from '../../state/multisig';
import { ConfirmMultisigNewTransferView } from './ConfirmMultisigNewTransferView';
import { useAnalyticsTrack } from '../../hooks/amplitude';
import { TRON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { seeIfValidTonAddress, seeIfValidTronAddress } from '@tonkeeper/core/dist/utils/common';
import { useActiveWallet } from '../../state/wallet';
import styled, { css } from 'styled-components';

const SendContent: FC<{
    onClose: () => void;
    chain?: BLOCKCHAIN_NAME;
    initRecipient?: RecipientData;
    initAmountState?: Partial<AmountState>;
}> = ({ onClose, chain, initRecipient, initAmountState }) => {
    const sdk = useAppSdk();
    const { standalone, ios, extension } = useAppContext();
    const { t } = useTranslation();
    const { data: filter } = useJettonList();
    const isFullWidth = useIsFullWidthMode();
    const isActiveAccountMultisig = useIsActiveAccountMultisig();
    const track = useAnalyticsTrack();

    const [view, _setView] = useState<'multisig-settings' | 'recipient' | 'amount' | 'confirm'>(
        isActiveAccountMultisig ? 'multisig-settings' : 'recipient'
    );
    const setView = useCallback(
        (val: typeof view) => {
            if (!isActiveAccountMultisig && val === 'multisig-settings') {
                val = 'recipient';
            }

            _setView(val);
        },
        [_setView, isActiveAccountMultisig]
    );

    const [right, setRight] = useState(true);
    const [multisigTimeout, setMultisigTimeout] = useState<
        MultisigOrderLifetimeMinutes | undefined
    >();
    const [recipient, _setRecipient] = useState<RecipientData | undefined>(initRecipient);
    const [amountViewState, setAmountViewState] = useState<Partial<AmountState> | undefined>(
        initAmountState
    );

    useEffect(() => {
        if (initRecipient) {
            track('send_click', {
                from: 'send_amount',
                token: amountViewState?.token?.symbol ?? 'ton'
            });
        }
    }, []);

    const activeTronWallet = useActiveTronWallet();

    const { mutateAsync: getAccountAsync, isLoading: isAccountLoading } = useGetToAccount();

    const setRecipient = (value: RecipientData) => {
        if (
            amountViewState?.token?.blockchain &&
            amountViewState?.token?.blockchain !== value.address.blockchain
        ) {
            setAmountViewState(undefined);
        }

        _setRecipient(value);
        if (activeTronWallet && value.address.blockchain === BLOCKCHAIN_NAME.TRON) {
            setAmountViewState({ token: TRON_USDT_ASSET });
        }
    };

    const onRecipient = (data: RecipientData) => {
        setRight(true);
        setRecipient(data);
        setView('amount');
        track('send_click', {
            from: 'send_recipient',
            token: amountViewState?.token?.symbol ?? 'ton'
        });
    };

    const onConfirmAmount = (data: AmountState) => {
        setRight(true);
        setAmountViewState(data);
        setView('confirm');
        track('send_confirm', {
            from: 'send_amount',
            token: amountViewState?.token?.symbol ?? 'ton'
        });
    };

    const backToRecipient = (data?: AmountState) => {
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
        if (!activeTronWallet) {
            return;
        }
        const item = { address: address, blockchain: BLOCKCHAIN_NAME.TRON } as const;

        setRecipient({
            address: item,
            done: true
        });
        setView('amount');
    };

    const processRecipient = async ({ address, text }: { address: string; text?: string }) => {
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
            if (jetton && filter) {
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
                    coinValue: assetAmount.relativeAmount,
                    token: actualAsset,
                    inFiat: false,
                    isMax: false
                });
            } else {
                setAmountViewState({
                    coinValue: a ? shiftedDecimals(a) : new BigNumber('0'),
                    token: initAmountState?.token,
                    inFiat: false,
                    isMax: false
                });
            }

            return true;
        },
        [sdk, filter, initAmountState?.token]
    );

    const onScan = async (signature: string) => {
        const param = parseTonTransferWithAddress({ url: signature });

        if (param) {
            const ok = await processJetton(param);
            if (ok) {
                await processRecipient(param);
            }
            return;
        }

        if (seeIfValidTronAddress(signature)) {
            return processTron(signature);
        }

        return sdk.uiEvents.emit('copy', {
            method: 'copy',
            params: t('Unexpected_QR_Code')
        });
    };

    const multisigSettingsRef = useRef<HTMLDivElement>(null);
    const recipientRef = useRef<HTMLDivElement>(null);
    const amountRef = useRef<HTMLDivElement>(null);
    const confirmRef = useRef<HTMLDivElement>(null);

    const nodeRef = {
        'multisig-settings': multisigSettingsRef,
        recipient: recipientRef,
        amount: amountRef,
        confirm: confirmRef
    }[view];

    const assetAmount = useMemo(() => {
        if (!amountViewState?.token || !amountViewState?.coinValue) {
            return null;
        }

        return AssetAmount.fromRelativeAmount({
            asset: amountViewState!.token!,
            amount: amountViewState!.coinValue!
        });
    }, [amountViewState?.token?.id, amountViewState?.coinValue]);

    let acceptBlockchains: BLOCKCHAIN_NAME[] = [];
    if (chain) {
        if (chain === BLOCKCHAIN_NAME.TRON && !activeTronWallet) {
            acceptBlockchains = [BLOCKCHAIN_NAME.TON];
        } else {
            acceptBlockchains = [chain];
        }
    } else {
        acceptBlockchains = activeTronWallet
            ? [BLOCKCHAIN_NAME.TON, BLOCKCHAIN_NAME.TRON]
            : [BLOCKCHAIN_NAME.TON];
    }

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
                    {status => (
                        <div ref={nodeRef}>
                            {view === 'multisig-settings' && (
                                <MultisigOrderFormView
                                    onSubmit={val => {
                                        setRight(true);
                                        setMultisigTimeout(val.lifetime);
                                        setView('recipient');
                                    }}
                                    isAnimationProcess={status === 'exiting'}
                                    Header={() => (
                                        <TransferViewHeaderBlock
                                            title={t('multisig_create_order_title')}
                                            onClose={onClose}
                                        />
                                    )}
                                    MainButton={MainButton}
                                />
                            )}
                            {view === 'recipient' && (
                                <RecipientView
                                    data={recipient}
                                    setRecipient={onRecipient}
                                    onScan={onScan}
                                    keyboard="decimal"
                                    isExternalLoading={isAccountLoading}
                                    acceptBlockchains={acceptBlockchains}
                                    MainButton={MainButton}
                                    HeaderBlock={() => (
                                        <RecipientHeaderBlock
                                            onBack={
                                                isActiveAccountMultisig
                                                    ? () => {
                                                          setRight(false);
                                                          setView('multisig-settings');
                                                      }
                                                    : undefined
                                            }
                                            title={t('transaction_recipient')}
                                            onClose={onClose}
                                        />
                                    )}
                                    isAnimationProcess={status === 'exiting'}
                                />
                            )}
                            {view === 'amount' && (
                                <AmountView
                                    defaults={amountViewState}
                                    onClose={onClose}
                                    onBack={backToRecipient}
                                    recipient={recipient!}
                                    onConfirm={onConfirmAmount}
                                    MainButton={AmountMainButton}
                                    HeaderBlock={AmountHeaderBlock}
                                    isAnimationProcess={status === 'exiting'}
                                />
                            )}
                            {view === 'confirm' &&
                                (isActiveAccountMultisig ? (
                                    <ConfirmMultisigNewTransferView
                                        onClose={onClose}
                                        onBack={backToAmount}
                                        recipient={recipient as TonRecipientData}
                                        assetAmount={
                                            AssetAmount.fromRelativeAmount({
                                                asset: amountViewState!.token!,
                                                amount: amountViewState!.coinValue!
                                            }) as AssetAmount<TonAsset>
                                        }
                                        isMax={amountViewState!.isMax!}
                                        ttl={multisigTimeout!}
                                    >
                                        {status !== 'exiting' && isFullWidth && (
                                            <ConfirmViewTitleSlot>
                                                <NotificationHeaderPortal>
                                                    <NotificationHeader>
                                                        <ConfirmViewTitle />
                                                    </NotificationHeader>
                                                </NotificationHeaderPortal>
                                            </ConfirmViewTitleSlot>
                                        )}
                                        {status !== 'exiting' && isFullWidth && (
                                            <ConfirmViewButtonsSlot>
                                                <NotificationFooterPortal>
                                                    <NotificationFooter>
                                                        <ConfirmViewButtons
                                                            MainButton={ConfirmMainButton}
                                                        />
                                                    </NotificationFooter>
                                                </NotificationFooterPortal>
                                            </ConfirmViewButtonsSlot>
                                        )}
                                    </ConfirmMultisigNewTransferView>
                                ) : (
                                    <ConfirmTransferView
                                        onClose={onClose}
                                        onBack={backToAmount}
                                        recipient={recipient!}
                                        assetAmount={assetAmount!}
                                        isMax={amountViewState!.isMax!}
                                    >
                                        {status !== 'exiting' && isFullWidth && (
                                            <ConfirmViewTitleSlot>
                                                <NotificationHeaderPortal>
                                                    <NotificationHeader>
                                                        <ConfirmViewTitle />
                                                    </NotificationHeader>
                                                </NotificationHeaderPortal>
                                            </ConfirmViewTitleSlot>
                                        )}
                                        {status !== 'exiting' && isFullWidth && (
                                            <ConfirmViewButtonsSlot>
                                                <NotificationFooterPortal>
                                                    <NotificationFooter>
                                                        <ConfirmViewButtons
                                                            MainButton={ConfirmMainButton}
                                                        />
                                                    </NotificationFooter>
                                                </NotificationFooterPortal>
                                            </ConfirmViewButtonsSlot>
                                        )}
                                    </ConfirmTransferView>
                                ))}
                        </div>
                    )}
                </CSSTransition>
            </TransitionGroup>
        </Wrapper>
    );
};

const NotificationStyled = styled(Notification)`
    ${p =>
        p.theme.proDisplayType === 'mobile' &&
        css`
            --height: calc(100% - (env(safe-area-inset-top) + 10px));
        `}
`;

const SendActionNotification = () => {
    const [open, setOpen] = useState(false);
    const [chain, setChain] = useState<BLOCKCHAIN_NAME | undefined>(undefined);
    const [tonTransfer, setTonTransfer] = useState<InitTransferData | undefined>(undefined);
    const { data: jettons } = useJettonList();
    const wallet = useActiveWallet();

    const { mutateAsync: getAccountAsync, reset } = useGetToAccount();
    const sdk = useAppSdk();
    const track = useAnalyticsTrack();

    useEffect(() => {
        const handler = (options: {
            method: 'transfer';
            id?: number | undefined;
            params: TransferInitParams;
        }) => {
            reset();

            const transfer = options.params;
            setChain(options.params.chain);

            if (transfer.chain === BLOCKCHAIN_NAME.TRON) {
                setOpen(true);
                track('send_open', { from: transfer.from });
                return;
            }

            getAccountAsync({ address: wallet.rawAddress }).then(fromAccount => {
                if (transfer.address && seeIfValidTonAddress(transfer.address)) {
                    getAccountAsync({ address: transfer.address }).then(toAccount => {
                        setTonTransfer(
                            makeTransferInitData(transfer, fromAccount, toAccount, jettons)
                        );
                        setOpen(true);
                    });
                } else {
                    setTonTransfer({
                        initAmountState: makeTransferInitAmountState(transfer, fromAccount, jettons)
                    });
                    setOpen(true);
                }
            });

            track('send_open', { from: transfer.from });
        };

        sdk.uiEvents.on('transfer', handler);
        return () => {
            sdk.uiEvents.off('transfer', handler);
        };
    }, [jettons, track]);

    const onClose = useCallback(() => {
        setTonTransfer(undefined);
        setOpen(false);
    }, []);

    const Content = useCallback(() => {
        return (
            <SendContent
                onClose={onClose}
                chain={chain}
                initAmountState={tonTransfer?.initAmountState}
                initRecipient={tonTransfer?.initRecipient}
            />
        );
    }, [open, tonTransfer, chain]);

    return (
        <NotificationStyled
            isOpen={open}
            handleClose={onClose}
            hideButton
            backShadow
            footer={<></>}
            disableHeightAnimation
        >
            {Content}
        </NotificationStyled>
    );
};

export default SendActionNotification;
