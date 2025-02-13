import { TransferInitParams } from '@tonkeeper/core/dist/AppSdk';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { jettonToTonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { RecipientData } from '@tonkeeper/core/dist/entries/send';
import {
    TonTransferParams,
    parseTonTransferWithAddress
} from '@tonkeeper/core/dist/service/deeplinkingService';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { ConfirmTransferView } from '@tonkeeper/uikit/dist/components/transfer/ConfirmTransferView';
import {
    ConfirmViewButtons,
    ConfirmViewButtonsSlot,
    ConfirmViewTitleSlot
} from '@tonkeeper/uikit/dist/components/transfer/ConfirmView';
import {
    RecipientView,
    useGetToAccount
} from '@tonkeeper/uikit/dist/components/transfer/RecipientView';
import { AmountView } from '@tonkeeper/uikit/dist/components/transfer/amountView/AmountView';
import { AmountState } from '@tonkeeper/uikit/dist/components/transfer/amountView/amountState';
import {
    InitTransferData,
    Wrapper,
    childFactoryCreator,
    duration,
    makeTransferInitAmountState,
    makeTransferInitData
} from '@tonkeeper/uikit/dist/components/transfer/common';
import { useAppContext } from '@tonkeeper/uikit/dist/hooks/appContext';
import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { openIosKeyboard } from '@tonkeeper/uikit/dist/hooks/ios';
import { useTranslation } from '@tonkeeper/uikit/dist/hooks/translation';
import { useJettonList } from '@tonkeeper/uikit/dist/state/jetton';
import { useActiveTronWallet, useTronBalances } from '@tonkeeper/uikit/dist/state/tron/tron';
import BigNumber from 'bignumber.js';
import { FC, PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import styled from 'styled-components';
import { FavoriteView, useFavoriteNotification } from './FavoriteNotification';
import {
    AmountTwaMainButton,
    ConfirmTwaMainButton,
    HideTwaMainButton,
    RecipientTwaMainButton
} from './SendNotificationButtons';
import {
    AmountTwaHeaderBlock,
    HideTwaBackButton,
    RecipientTwaHeaderBlock
} from './SendNotificationHeader';
import { useAnalyticsTrack } from '@tonkeeper/uikit/dist/hooks/amplitude';
import { TRON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { seeIfValidTonAddress, seeIfValidTronAddress } from '@tonkeeper/core/dist/utils/common';
import { useActiveWallet } from '@tonkeeper/uikit/dist/state/wallet';

const Body = styled.div`
    padding: 0 16px 16px;
    box-sizing: border-box;
    height: 100vh;
    overflow: auto;
`;

const SendContent: FC<{
    onClose: () => void;
    chain?: BLOCKCHAIN_NAME;
    initRecipient?: RecipientData;
    initAmountState?: Partial<AmountState>;
}> = ({ onClose, chain, initRecipient, initAmountState }) => {
    const sdk = useAppSdk();
    const { ios } = useAppContext();
    const { t } = useTranslation();
    const { data: filter } = useJettonList();
    const track = useAnalyticsTrack();

    const recipientRef = useRef<HTMLDivElement>(null);
    const amountRef = useRef<HTMLDivElement>(null);
    const favoriteRef = useRef<HTMLDivElement>(null);
    const confirmRef = useRef<HTMLDivElement>(null);

    const [view, setView] = useState<'recipient' | 'amount' | 'favorite' | 'confirm'>('recipient');
    const [right, setRight] = useState(true);
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

    const { mutateAsync: getAccountAsync, isLoading: isAccountLoading } = useGetToAccount();

    const activeTronWallet = useActiveTronWallet();

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

    const onFavorite = useCallback(() => {
        openIosKeyboard('text');
        setRight(true);
        setView('favorite');
    }, [setRight, setView]);

    const favoriteState = useFavoriteNotification(onFavorite);

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

    const nodeRef = {
        recipient: recipientRef,
        amount: amountRef,
        favorite: favoriteRef,
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
    }, [amountViewState?.token, amountViewState?.coinValue]);

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
        <Wrapper standalone={false} extension={true}>
            <HideTwaMainButton />
            <HideTwaBackButton />
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
                                data={recipient}
                                setRecipient={onRecipient}
                                onScan={onScan}
                                keyboard="decimal"
                                isExternalLoading={isAccountLoading}
                                acceptBlockchains={acceptBlockchains}
                                MainButton={RecipientTwaMainButton}
                                HeaderBlock={() => <RecipientTwaHeaderBlock onClose={onClose} />}
                                fitContent
                                isAnimationProcess={false}
                            />
                        )}
                        {view === 'favorite' && (
                            <FavoriteView state={favoriteState} onClose={backToRecipient} />
                        )}
                        {view === 'amount' && (
                            <AmountView
                                defaults={amountViewState}
                                onClose={onClose}
                                onBack={backToRecipient}
                                recipient={recipient!}
                                onConfirm={onConfirmAmount}
                                MainButton={AmountTwaMainButton}
                                HeaderBlock={AmountTwaHeaderBlock}
                                isAnimationProcess={false}
                            />
                        )}
                        {view === 'confirm' && (
                            <ConfirmTransferView
                                onClose={onClose}
                                onBack={backToAmount}
                                recipient={recipient!}
                                fitContent
                                assetAmount={assetAmount!}
                                isMax={amountViewState!.isMax!}
                            >
                                <ConfirmViewTitleSlot>
                                    <RecipientTwaHeaderBlock onClose={backToAmount} />
                                </ConfirmViewTitleSlot>
                                <ConfirmViewButtonsSlot>
                                    <ConfirmViewButtons MainButton={ConfirmTwaMainButton} />
                                </ConfirmViewButtonsSlot>
                            </ConfirmTransferView>
                        )}
                    </div>
                </CSSTransition>
            </TransitionGroup>
        </Wrapper>
    );
};

export const TwaSendNotification: FC<PropsWithChildren> = ({ children }) => {
    const [open, setOpen] = useState(false);
    const [chain, setChain] = useState<BLOCKCHAIN_NAME | undefined>(undefined);
    const [tonTransfer, setTonTransfer] = useState<InitTransferData | undefined>(undefined);
    const { data: jettons } = useJettonList();

    const { mutateAsync: getAccountAsync, reset } = useGetToAccount();
    const wallet = useActiveWallet();

    const sdk = useAppSdk();
    const track = useAnalyticsTrack();

    useEffect(() => {
        const handler = (options: {
            method: 'transfer';
            id?: number | undefined;
            params: TransferInitParams;
        }) => {
            if (sdk.twaExpand) {
                sdk.twaExpand();
            }
            reset();
            const transfer = options.params;
            setChain(chain);

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
    }, []);

    const onClose = useCallback(() => {
        setTonTransfer(undefined);
        setOpen(false);
    }, []);

    if (open) {
        return (
            <Body>
                <SendContent
                    onClose={onClose}
                    chain={chain}
                    initAmountState={tonTransfer?.initAmountState}
                    initRecipient={tonTransfer?.initRecipient}
                />
            </Body>
        );
    } else {
        return <>{children}</>;
    }
};
