import { useMainButton } from '@tma.js/sdk-react';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { RecipientData, TonRecipientData } from '@tonkeeper/core/dist/entries/send';
import {
    TonTransferParams,
    parseTonTransfer
} from '@tonkeeper/core/dist/service/deeplinkingService';
import { ConfirmViewButtons } from '@tonkeeper/uikit/dist/components/transfer/ConfirmView';
import {
    RecipientView,
    useGetToAccount
} from '@tonkeeper/uikit/dist/components/transfer/RecipientView';
import {
    Wrapper,
    childFactoryCreator,
    duration
} from '@tonkeeper/uikit/dist/components/transfer/common';
import { ConfirmNftView } from '@tonkeeper/uikit/dist/components/transfer/nft/ConfirmNftView';
import { useMinimalBalance } from '@tonkeeper/uikit/dist/components/transfer/nft/hooks';
import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { openIosKeyboard } from '@tonkeeper/uikit/dist/hooks/ios';
import { useTranslation } from '@tonkeeper/uikit/dist/hooks/translation';
import { FC, PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import styled from 'styled-components';
import { FavoriteView, useFavoriteNotification } from '../transfer/FavoriteNotification';
import {
    ConfirmTwaMainButton,
    HideTwaMainButton,
    RecipientTwaMainButton
} from '../transfer/SendNotificationButtons';
import { HideTwaBackButton, RecipientTwaHeaderBlock } from '../transfer/SendNotificationHeader';
import { NftIndexView } from './NftIndexView';

const PageWrapper = styled(Wrapper)`
    padding: 0 12px 10px;
`;

const Content: FC<{ nftItem: NFT; handleClose: () => void }> = ({ nftItem, handleClose }) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const [right, setRight] = useState(true);
    const [view, setView] = useState<'index' | 'recipient' | 'favorite' | 'confirm'>('index');
    const [recipient, setRecipient] = useState<TonRecipientData | undefined>();

    const mainButton = useMainButton();
    const { mutateAsync: getAccountAsync } = useGetToAccount();
    const { mutateAsync: checkBalanceAsync, isLoading: isChecking } = useMinimalBalance();

    const indexRef = useRef<HTMLDivElement>(null);
    const recipientRef = useRef<HTMLDivElement>(null);
    const confirmRef = useRef<HTMLDivElement>(null);
    const favoriteRef = useRef<HTMLDivElement>(null);

    const backToIndex = useCallback(() => {
        setRight(false);
        setView('index');
        mainButton.hide();
    }, [mainButton]);

    const onFavorite = useCallback(() => {
        openIosKeyboard('text');
        setRight(true);
        setView('favorite');
    }, [setRight, setView]);

    const favoriteState = useFavoriteNotification(onFavorite);

    const onRecipient = async (data: RecipientData) => {
        await checkBalanceAsync();
        setRight(true);
        setRecipient(data as TonRecipientData);
        setView('confirm');
    };

    const backToRecipient = useCallback(() => {
        setRight(false);
        setView('recipient');
        setRecipient(value => (value ? { ...value, done: false } : undefined));
    }, [setRecipient]);

    useEffect(() => {
        const handler = () => {
            setView('recipient');
            setRight(true);
        };
        sdk.uiEvents.on('transferNft', handler);
        return () => {
            sdk.uiEvents.off('transferNft', handler);
        };
    }, []);

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

    const nodeRef = {
        index: indexRef,
        recipient: recipientRef,
        favorite: favoriteRef,
        confirm: confirmRef
    }[view];

    return (
        <PageWrapper standalone={false} extension={false}>
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
                        {view === 'index' && (
                            <NftIndexView nftItem={nftItem} handleClose={handleClose} />
                        )}
                        {view === 'recipient' && (
                            <RecipientView
                                data={recipient}
                                setRecipient={onRecipient}
                                onScan={onScan}
                                isExternalLoading={isChecking}
                                acceptBlockchains={[BLOCKCHAIN_NAME.TON]}
                                MainButton={RecipientTwaMainButton}
                                HeaderBlock={() => (
                                    <RecipientTwaHeaderBlock onClose={backToIndex} />
                                )}
                            />
                        )}
                        {view === 'favorite' && (
                            <FavoriteView state={favoriteState} onClose={backToRecipient} />
                        )}
                        {view === 'confirm' && (
                            <ConfirmNftView
                                onClose={handleClose}
                                recipient={recipient!}
                                nftItem={nftItem}
                                mainButton={<ConfirmViewButtons MainButton={ConfirmTwaMainButton} />}
                                headerBlock={<RecipientTwaHeaderBlock onClose={backToRecipient} />}
                            />
                        )}
                    </div>
                </CSSTransition>
            </TransitionGroup>
        </PageWrapper>
    );
};

export const TwaNftNotification: FC<PropsWithChildren> = ({ children }) => {
    const sdk = useAppSdk();
    const [nftItem, setNft] = useState<NFT | undefined>(undefined);

    const handleClose = useCallback(() => {
        setNft(undefined);
    }, [setNft]);

    useEffect(() => {
        const handler = (options: { method: 'nft'; params: NFT }) => {
            setNft(options.params);
        };

        sdk.uiEvents.on('nft', handler);
        return () => {
            sdk.uiEvents.off('nft', handler);
        };
    }, [sdk, setNft]);

    if (nftItem) {
        return <Content nftItem={nftItem} handleClose={handleClose} />;
    } else {
        return <>{children}</>;
    }
};
