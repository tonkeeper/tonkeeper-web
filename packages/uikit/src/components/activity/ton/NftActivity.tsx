import { Action, ActionStatusEnum, NftItem, Price } from '@tonkeeper/core/dist/tonApiV2';
import { formatDecimals } from '@tonkeeper/core/dist/utils/balance';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import React, { FC, useState } from 'react';
import styled, { css } from 'styled-components';
import { useAppSdk } from '../../../hooks/appSdk';
import { useTranslation } from '../../../hooks/translation';
import { useActiveTonNetwork, useActiveWallet } from '../../../state/wallet';
import { InfoCircleIcon, VerificationIcon } from '../../Icon';
import { ListBlock } from '../../List';
import { Body1, Body2 } from '../../Text';
import { NftCollectionBody2, NftHeaderBody2 } from '../../nft/NftHeader';
import { FailedNote } from '../ActivityActionLayout';
import { FailedDetail, TransferComment } from '../ActivityDetailsLayout';
import { ActivityIcon, ReceiveIcon, SentIcon } from '../ActivityIcons';
import {
    AmountText,
    ColumnLayout,
    Comment,
    Description,
    ErrorAction,
    FirstLabel,
    FirstLine,
    ListItemGrid,
    SecondLine,
    SecondaryText
} from '../CommonAction';
import {
    ActionDate,
    ActionDetailsBlock,
    ActionExtraDetails,
    ActionRecipientDetails,
    ActionSenderDetails,
    ActionTransactionDetails,
    ErrorActivityNotification,
    SpamBadge,
    Title
} from '../NotificationCommon';
import { ActionData } from './ActivityNotification';
import { useDisclosure } from '../../../hooks/useDisclosure';
import { UnverifiedNftNotification } from '../../nft/UnverifiedNftNotification';
import {
    useIsSpamNft,
    useIsUnverifiedNft,
    useMarkNftAsSpam,
    useMarkNftAsTrusted,
    useNftItemData
} from '../../../state/nft';

const NftBlock = styled.div`
    background: ${props => props.theme.backgroundContentTint};
    border-radius: ${props => props.theme.cornerExtraSmall};
    overflow: hidden;
    display: inline-flex;
    cursor: pointer;
    max-width: 100%;
`;

const NftText = styled.div`
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    white-space: nowrap;
    overflow: hidden;
    user-select: none;
`;

const Wrapper = styled.div`
    grid-column: 2 / 3;
    overflow: hidden;
`;

const NftImage = styled.img<{ isSpam: boolean; isUnverified: boolean }>`
    user-select: none;

    ${p =>
        p.isSpam
            ? css`
                  filter: blur(5px);
              `
            : p.isUnverified
            ? css`
                  opacity: 0.5;
              `
            : undefined}
`;

const UnverifiedText = styled(Body2)`
    color: ${p => p.theme.accentOrange};
`;

export const NftComment: FC<{
    address: string;
    isNftReceived?: boolean;
}> = ({ address, isNftReceived }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { data } = useNftItemData(address);

    const isSpam = useIsSpamNft(data) && Boolean(isNftReceived);
    const isUnverified = useIsUnverifiedNft(data) && Boolean(isNftReceived);

    if (!data) return <></>;
    const preview = data.previews?.find(item => item.resolution === '100x100');
    return (
        <Wrapper>
            <NftBlock
                onClick={e => {
                    e.stopPropagation();
                    if (data) {
                        sdk.openNft(data);
                    }
                }}
            >
                {preview && (
                    <NftImage
                        isSpam={isSpam}
                        isUnverified={isUnverified}
                        height="64"
                        width="64"
                        src={preview.url}
                    />
                )}
                <NftText>
                    <NftHeaderBody2 isSpam={isSpam} isUnverified={isUnverified} nft={data} />
                    {isSpam ? (
                        <UnverifiedText>{t('history_spam_nft')}</UnverifiedText>
                    ) : isUnverified ? (
                        <UnverifiedText>{t('suspicious_label_full')}</UnverifiedText>
                    ) : (
                        <NftCollectionBody2 nft={data} />
                    )}
                </NftText>
            </NftBlock>
        </Wrapper>
    );
};

export const NftItemTransferAction: FC<{
    action: Action;
    date: string;
}> = ({ action, date }) => {
    const { t } = useTranslation();
    const wallet = useActiveWallet();
    const network = useActiveTonNetwork();
    const { nftItemTransfer } = action;
    if (!nftItemTransfer) {
        return <ErrorAction />;
    }

    if (nftItemTransfer.recipient?.address === wallet.rawAddress) {
        return (
            <ListItemGrid>
                <ActivityIcon status={action.status}>
                    <ReceiveIcon />
                </ActivityIcon>
                <ColumnLayout
                    title={t('transaction_type_receive')}
                    entry="NFT"
                    address={
                        nftItemTransfer.sender?.name ??
                        toShortValue(
                            formatAddress(
                                nftItemTransfer.sender?.address ?? nftItemTransfer.nft,
                                network,
                                !nftItemTransfer.sender?.address
                            )
                        )
                    }
                    date={date}
                />
                <FailedNote status={action.status}>
                    <NftComment isNftReceived address={nftItemTransfer.nft} />
                    <Comment comment={nftItemTransfer.comment} />
                </FailedNote>
            </ListItemGrid>
        );
    }

    return (
        <ListItemGrid>
            <ActivityIcon status={action.status}>
                <SentIcon />
            </ActivityIcon>
            <ColumnLayout
                title={t('transaction_type_sent')}
                entry="NFT"
                address={
                    nftItemTransfer.recipient?.name ??
                    toShortValue(
                        formatAddress(
                            nftItemTransfer.recipient?.address ?? nftItemTransfer.nft,
                            network,
                            !nftItemTransfer.recipient?.address
                        )
                    )
                }
                date={date}
            />
            <FailedNote status={action.status}>
                <NftComment address={nftItemTransfer.nft} />
                <Comment comment={nftItemTransfer.comment} />
            </FailedNote>
        </ListItemGrid>
    );
};

export const NftPurchaseAction: FC<{
    action: Action;
    date: string;
}> = ({ action, date }) => {
    const { t } = useTranslation();
    const { nftPurchase } = action;
    if (!nftPurchase) {
        return <ErrorAction />;
    }
    return (
        <ListItemGrid>
            <ActivityIcon status={action.status}>
                <SentIcon />
            </ActivityIcon>
            <Description>
                <FirstLine>
                    <FirstLabel>{t('transaction_type_purchase')}</FirstLabel>
                    <AmountText>-&thinsp;{formatDecimals(nftPurchase.amount.value)}</AmountText>
                    <AmountText>{nftPurchase.amount.tokenName}</AmountText>
                </FirstLine>
                <SecondLine>
                    <SecondaryText>{nftPurchase.auctionType}</SecondaryText>
                    <SecondaryText>{date}</SecondaryText>
                </SecondLine>
            </Description>
            <FailedNote status={action.status}>
                <NftComment address={nftPurchase.nft.address} />
            </FailedNote>
        </ListItemGrid>
    );
};

const Amount = styled(Body1)`
    display: block;
    user-select: none;
    color: ${props => props.theme.textSecondary};
    margin-bottom: 4px;
`;

const Image = styled.img<{ isSpam: boolean; isUnverified: boolean }>`
    width: 96px;
    height: 96px;
    margin-top: 5px;
    margin-bottom: 15px;
    border-radius: ${props => props.theme.cornerMedium};
    user-select: none;

    ${p =>
        p.isSpam
            ? css`
                  filter: blur(5px);
              `
            : p.isUnverified
            ? css`
                  opacity: 0.5;
              `
            : undefined}

    transition: filter 0.15s ease-in-out, opacity 0.15s ease-in-out;
`;

const Icon = styled.span`
    position: relative;
    top: 3px;
    margin-left: 4px;
    user-select: none;
`;

const UnverifiedLabel = styled(Body2)`
    color: ${props => props.theme.accentOrange};
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
`;

const SpamNftLabel = styled(Body2)`
    color: ${p => p.theme.textPrimary};
`;

const NftActivityHeader: FC<{
    kind: 'send' | 'received';
    timestamp: number;
    data?: NftItem;
    amount?: Price;
    status?: ActionStatusEnum;
}> = ({ kind, timestamp, data, amount, status }) => {
    const [revealImage, setRevealImage] = useState(false);
    const { t } = useTranslation();
    const isUnverified = useIsUnverifiedNft(data);
    const isSpam = useIsSpamNft(data);

    const {
        isOpen: isSpamModalOpen,
        onClose: onCloseSpamModal,
        onOpen: onOpenSpamModal
    } = useDisclosure();

    const { mutate: markNftAsSpam } = useMarkNftAsSpam();
    const { mutate: markNftAsTrusted } = useMarkNftAsTrusted();

    const handleCloseSpamModal = (action?: 'mark_spam' | 'mark_trusted') => {
        if (action === 'mark_spam') {
            markNftAsSpam(data!);
        } else if (action === 'mark_trusted') {
            markNftAsTrusted(data!);
        }
        onCloseSpamModal();
    };

    const preview = data?.previews?.find(item => item.resolution === '100x100');

    return (
        <div>
            {preview && (
                <Image
                    onMouseOver={() => setRevealImage(true)}
                    onMouseLeave={() => setRevealImage(false)}
                    isSpam={!revealImage && isSpam}
                    isUnverified={!revealImage && isUnverified}
                    src={preview.url}
                    alt="NFT Preview"
                />
            )}
            {data && (
                <>
                    <Title secondary={isUnverified && !isSpam} tertiary={isSpam}>
                        {data.dns ?? data.metadata.name}
                        {isSpam && (
                            <SpamBadge color="accentOrange">{t('transactions_spam')}</SpamBadge>
                        )}
                    </Title>
                    <Amount>
                        {isSpam ? (
                            <SpamNftLabel>{t('history_spam_nft')}</SpamNftLabel>
                        ) : isUnverified ? (
                            <>
                                <UnverifiedNftNotification
                                    isOpen={isSpamModalOpen}
                                    onClose={handleCloseSpamModal}
                                    isTrusted={false}
                                />
                                <UnverifiedLabel onClick={onOpenSpamModal}>
                                    {t('suspicious_label_full')}&nbsp;
                                    <InfoCircleIcon color="accentOrange" />
                                </UnverifiedLabel>
                            </>
                        ) : (
                            <>
                                {data.collection?.name ?? data.metadata.description}
                                {data && data.approvedBy && data.approvedBy.length > 0 && (
                                    <Icon>
                                        <VerificationIcon />
                                    </Icon>
                                )}
                            </>
                        )}
                    </Amount>
                </>
            )}
            {amount && (
                <Amount>
                    {formatDecimals(amount.value)} {amount.tokenName}
                </Amount>
            )}
            <ActionDate kind={kind} timestamp={timestamp} />
            <FailedDetail status={status} />
        </div>
    );
};

export const NftItemTransferActionDetails: FC<ActionData> = ({ action, timestamp, event }) => {
    const wallet = useActiveWallet();
    const { nftItemTransfer } = action;

    const { data } = useNftItemData(nftItemTransfer?.nft);

    if (!nftItemTransfer) {
        return <ErrorActivityNotification event={event} />;
    }

    const kind = nftItemTransfer.recipient?.address === wallet.rawAddress ? 'received' : 'send';

    return (
        <ActionDetailsBlock event={event}>
            <NftActivityHeader
                data={data}
                timestamp={timestamp}
                kind={kind}
                status={action.status}
            />
            <ListBlock margin={false} fullWidth>
                {kind === 'received' && nftItemTransfer.sender && (
                    <ActionSenderDetails sender={nftItemTransfer.sender} />
                )}
                {kind === 'send' && nftItemTransfer.recipient && (
                    <ActionRecipientDetails recipient={nftItemTransfer.recipient} />
                )}
                <ActionTransactionDetails eventId={event.eventId} />
                <ActionExtraDetails extra={event.extra} />
                <TransferComment comment={nftItemTransfer.comment} />
            </ListBlock>
        </ActionDetailsBlock>
    );
};

export const NftPurchaseActionDetails: FC<ActionData> = ({ action, timestamp, event }) => {
    const { nftPurchase } = action;

    if (!nftPurchase) {
        return <ErrorActivityNotification event={event} />;
    }

    return (
        <ActionDetailsBlock event={event}>
            <NftActivityHeader
                data={nftPurchase.nft}
                amount={nftPurchase.amount}
                timestamp={timestamp}
                kind="send"
                status={action.status}
            />
            <ListBlock margin={false} fullWidth>
                <ActionTransactionDetails eventId={event.eventId} />
                <ActionExtraDetails extra={event.extra} />
            </ListBlock>
        </ActionDetailsBlock>
    );
};
