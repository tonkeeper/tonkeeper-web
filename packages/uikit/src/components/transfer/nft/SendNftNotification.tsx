import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { RecipientData, TonRecipientData } from '@tonkeeper/core/dist/entries/send';
import {
    TonTransferParams,
    parseTonTransfer
} from '@tonkeeper/core/dist/service/deeplinkingService';
import { NftItem } from '@tonkeeper/core/dist/tonApiV2';
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { useAppContext } from '../../../hooks/appContext';
import { useAppSdk } from '../../../hooks/appSdk';
import { useTranslation } from '../../../hooks/translation';
import { Notification } from '../../Notification';
import { ConfirmViewButtons } from '../ConfirmView';
import { RecipientView, useGetToAccount } from '../RecipientView';
import {
    ConfirmMainButton,
    MainButton,
    RecipientHeaderBlock,
    Wrapper,
    childFactoryCreator,
    duration
} from '../common';
import { ConfirmHeaderBlock } from './Common';
import { ConfirmNftView } from './ConfirmNftView';
import { useMinimalBalance } from './hooks';

const SendContent: FC<{ nftItem: NftItem; onClose: () => void }> = ({ nftItem, onClose }) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const { standalone, extension } = useAppContext();
    const recipientRef = useRef<HTMLDivElement>(null);
    const confirmRef = useRef<HTMLDivElement>(null);

    const [right, setRight] = useState(true);
    const [recipient, setRecipient] = useState<TonRecipientData | undefined>();

    const { mutateAsync: getAccountAsync } = useGetToAccount();

    const { mutateAsync: checkBalanceAsync, isLoading: isChecking } = useMinimalBalance();

    const onRecipient = async (data: RecipientData) => {
        await checkBalanceAsync();
        setRight(true);
        setRecipient(data as TonRecipientData);
    };

    const backToRecipient = useCallback(() => {
        setRight(false);
        setRecipient(value => (value ? { ...value, done: false } : undefined));
    }, [setRecipient]);

    const [state, nodeRef] = (() => {
        if (!recipient || !recipient.done) {
            return ['recipient', recipientRef] as const;
        }
        return ['confirm', confirmRef] as const;
    })();

    const processRecipient = useCallback(
        async ({ address }: TonTransferParams) => {
            const item = { address: address };
            const toAccount = await getAccountAsync(item);

            setRecipient({
                address: { ...item, blockchain: BLOCKCHAIN_NAME.TON },
                toAccount,
                comment: '',
                done: true
            });
        },
        [setRecipient, getAccountAsync]
    );

    const onScan = async (signature: string) => {
        const param = parseTonTransfer({ url: signature });
        if (param === null) {
            return sdk.uiEvents.emit('copy', {
                method: 'copy',
                params: t('Unexpected_QR_Code')
            });
        } else {
            await processRecipient(param);
        }
    };

    return (
        <Wrapper standalone={standalone} extension={extension}>
            <TransitionGroup childFactory={childFactoryCreator(right)}>
                <CSSTransition
                    key={state}
                    nodeRef={nodeRef}
                    classNames="right-to-left"
                    addEndListener={done => {
                        setTimeout(done, duration);
                    }}
                >
                    <div ref={nodeRef}>
                        {state === 'recipient' && (
                            <RecipientView
                                data={recipient}
                                setRecipient={onRecipient}
                                onScan={onScan}
                                isExternalLoading={isChecking}
                                acceptBlockchains={[BLOCKCHAIN_NAME.TON]}
                                MainButton={MainButton}
                                HeaderBlock={() => (
                                    <RecipientHeaderBlock
                                        title={t('nft_transfer_title')}
                                        onClose={onClose}
                                    />
                                )}
                            />
                        )}
                        {state === 'confirm' && (
                            <ConfirmNftView
                                onClose={onClose}
                                recipient={recipient!}
                                nftItem={nftItem}
                                mainButton={<ConfirmViewButtons MainButton={ConfirmMainButton} />}
                                headerBlock={
                                    <ConfirmHeaderBlock
                                        onBack={backToRecipient}
                                        onClose={onClose}
                                    />
                                }
                            />
                        )}
                    </div>
                </CSSTransition>
            </TransitionGroup>
        </Wrapper>
    );
};

const SendNftNotification = () => {
    const sdk = useAppSdk();

    const [nftItem, setNft] = useState<NFT | undefined>();
    const onClose = useCallback(() => {
        setNft(undefined);
    }, [setNft]);
    useEffect(() => {
        const handler = (options: { method: 'transferNft'; params: NFT }) => {
            setNft(options.params);
        };
        sdk.uiEvents.on('transferNft', handler);
        return () => {
            sdk.uiEvents.off('transferNft', handler);
        };
    }, []);

    const Content = useCallback(() => {
        if (!nftItem) return undefined;
        return <SendContent onClose={onClose} nftItem={nftItem} />;
    }, [nftItem, onClose]);

    return (
        <Notification isOpen={!!nftItem} handleClose={onClose} hideButton backShadow>
            {Content}
        </Notification>
    );
};

export default SendNftNotification;
