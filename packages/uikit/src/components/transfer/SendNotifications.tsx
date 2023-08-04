import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { RecipientData } from '@tonkeeper/core/dist/entries/send';
import {
    TonTransferParams,
    parseTonTransfer
} from '@tonkeeper/core/dist/service/deeplinkingService';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import BigNumber from 'bignumber.js';
import React, { FC, useCallback, useRef, useState } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { openIosKeyboard } from '../../hooks/ios';
import { useTranslation } from '../../hooks/translation';
import { useUserJettonList } from '../../state/jetton';
import { useWalletJettonList } from '../../state/wallet';
import { Notification } from '../Notification';
import { Action } from '../home/Actions';
import { SendIcon } from '../home/HomeIcons';
import { ConfirmView } from './ConfirmView';
import { RecipientView, useGetToAccount } from './RecipientView';
import { Wrapper, childFactoryCreator, duration } from './common';
import { AmountView, AmountViewState } from './amount-view/AmountView';
import { TronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/tron-asset';
import { TonAsset, jettonToTonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';

const SendContent: FC<{ onClose: () => void; asset?: TonAsset | TronAsset }> = ({
    onClose,
    asset
}) => {
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
    const [recipient, _setRecipient] = useState<RecipientData | undefined>(undefined);
    const [amountViewState, setAmountViewState] = useState<Partial<AmountViewState> | undefined>({
        asset
    });

    const { mutateAsync: getAccountAsync, isLoading: isAccountLoading } = useGetToAccount();

    const setRecipient = (value: RecipientData) => {
        if (
            amountViewState?.asset?.blockchain &&
            amountViewState?.asset?.blockchain !== value.address.blockchain
        ) {
            setAmountViewState(undefined);
        }

        _setRecipient(value);
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
                    asset,
                    inFiat: false,
                    isMax: false
                });
            }

            return true;
        },
        [sdk, filter, asset]
    );

    const onScan = async (signature: string) => {
        const param = parseTonTransfer({ url: signature });
        if (param === null) {
            return sdk.uiEvents.emit('copy', {
                method: 'copy',
                params: t('Unexpected_QR_Code')
            });
        } else {
            const ok = await processJetton(param);
            if (ok) {
                await processRecipient(param);
            }
        }
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
                            <ConfirmView
                                onClose={onClose}
                                onBack={backToAmount}
                                recipient={recipient!}
                                amount={amount!}
                                jettons={filter}
                            />
                        )}
                    </div>
                </CSSTransition>
            </TransitionGroup>
        </Wrapper>
    );
};

export const SendAction: FC<{ asset?: string }> = ({ asset }) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const { data: jettons } = useWalletJettonList();

    const Content = useCallback(() => {
        if (!open) return undefined;
        let token;
        try {
            if (asset) {
                token = jettonToTonAsset(asset, jettons || { balances: [] });
            }
        } catch {
            //
        }
        return <SendContent onClose={() => setOpen(false)} asset={token} />;
    }, [open, asset, jettons]);

    return (
        <>
            <Action icon={<SendIcon />} title={t('wallet_send')} action={() => setOpen(true)} />
            <Notification isOpen={open} handleClose={() => setOpen(false)} hideButton backShadow>
                {Content}
            </Notification>
        </>
    );
};
