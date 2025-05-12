import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { RecipientData, TonRecipientData } from '@tonkeeper/core/dist/entries/send';
import { parseTonTransferWithAddress } from '@tonkeeper/core/dist/service/deeplinkingService';
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
    duration,
    TransferViewHeaderBlock
} from '../common';
import { ConfirmHeaderBlock } from './Common';
import { ConfirmNftView } from './ConfirmNftView';
import { MultisigOrderFormView } from '../MultisigOrderFormView';
import { MultisigOrderLifetimeMinutes } from '../../../libs/multisig';
import { useIsActiveAccountMultisig } from '../../../state/multisig';

const SendContent: FC<{ nftItem: NftItem; onClose: () => void }> = ({ nftItem, onClose }) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const { standalone, extension } = useAppContext();
    const multisigSettingsRef = useRef<HTMLDivElement>(null);
    const recipientRef = useRef<HTMLDivElement>(null);
    const confirmRef = useRef<HTMLDivElement>(null);

    const [right, setRight] = useState(true);
    const [recipient, setRecipient] = useState<TonRecipientData | undefined>();
    const isMultisig = useIsActiveAccountMultisig();

    const { mutateAsync: getAccountAsync } = useGetToAccount();

    const onRecipient = async (data: RecipientData) => {
        setRight(true);
        setRecipient(data as TonRecipientData);
        setView('confirm');
    };

    const backToRecipient = useCallback(() => {
        setRight(false);
        setRecipient(value => (value ? { ...value, done: false } : undefined));
        setView('recipient');
    }, [setRecipient]);

    const [multisigTimeout, setMultisigTimeout] = useState<
        MultisigOrderLifetimeMinutes | undefined
    >();

    const [view, setView] = useState<'multisig-settings' | 'recipient' | 'confirm'>(
        isMultisig ? 'multisig-settings' : 'recipient'
    );

    const processRecipient = useCallback(
        async ({ address }: { address: string }) => {
            const item = { address: address };
            const toAccount = await getAccountAsync(item);

            onRecipient({
                address: { ...item, blockchain: BLOCKCHAIN_NAME.TON },
                toAccount,
                comment: '',
                done: true
            });
        },
        [onRecipient, getAccountAsync]
    );

    const onScan = async (signature: string) => {
        const param = parseTonTransferWithAddress({ url: signature });
        if (param === null) {
            return sdk.uiEvents.emit('copy', {
                method: 'copy',
                params: t('Unexpected_QR_Code')
            });
        } else {
            await processRecipient(param);
        }
    };

    const nodeRef = {
        'multisig-settings': multisigSettingsRef,
        recipient: recipientRef,
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
                                    header={
                                        <TransferViewHeaderBlock
                                            title={t('multisig_create_order_title')}
                                            onClose={onClose}
                                        />
                                    }
                                    MainButton={MainButton}
                                />
                            )}
                            {view === 'recipient' && (
                                <RecipientView
                                    data={recipient}
                                    setRecipient={onRecipient}
                                    onScan={onScan}
                                    acceptBlockchains={[BLOCKCHAIN_NAME.TON]}
                                    MainButton={MainButton}
                                    HeaderBlock={() => (
                                        <RecipientHeaderBlock
                                            title={t('nft_transfer_title')}
                                            onClose={onClose}
                                            onBack={isMultisig ? backToRecipient : undefined}
                                        />
                                    )}
                                    isAnimationProcess={status === 'exiting'}
                                />
                            )}
                            {view === 'confirm' && (
                                <ConfirmNftView
                                    onClose={onClose}
                                    recipient={recipient!}
                                    nftItem={nftItem}
                                    mainButton={
                                        <ConfirmViewButtons MainButton={ConfirmMainButton} />
                                    }
                                    headerBlock={
                                        <ConfirmHeaderBlock
                                            onBack={backToRecipient}
                                            onClose={onClose}
                                        />
                                    }
                                    multisigTTL={multisigTimeout}
                                    isAnimationProcess={status === 'exiting'}
                                />
                            )}
                        </div>
                    )}
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
        <Notification
            isOpen={!!nftItem}
            handleClose={onClose}
            hideButton
            backShadow
            mobileFullScreen
        >
            {Content}
        </Notification>
    );
};

export default SendNftNotification;
