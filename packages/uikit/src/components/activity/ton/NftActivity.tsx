import { NftItemRepr } from '@tonkeeper/core/dist/tonApiV1';
import { Action, ActionStatusEnum, Price } from '@tonkeeper/core/dist/tonApiV2';
import { formatDecimals } from '@tonkeeper/core/dist/utils/balance';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import React, { FC } from 'react';
import styled from 'styled-components';
import { useWalletContext } from '../../../hooks/appContext';
import { useAppSdk } from '../../../hooks/appSdk';
import { useTranslation } from '../../../hooks/translation';
import { useNftItemData } from '../../../state/wallet';
import { VerificationIcon } from '../../Icon';
import { ListBlock } from '../../List';
import { Body1 } from '../../Text';
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
    Title
} from '../NotificationCommon';
import { ActionData } from './ActivityNotification';

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

const NftImage = styled.img`
    user-select: none;
`;

export const NftComment: FC<{
    address: string;
}> = ({ address }) => {
    const sdk = useAppSdk();
    const { data } = useNftItemData(address);

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
                {preview && <NftImage height="64" width="64" src={preview.url} />}
                <NftText>
                    <NftHeaderBody2 nft={data} />
                    <NftCollectionBody2 nft={data} />
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
    const wallet = useWalletContext();
    const { nftItemTransfer } = action;
    if (!nftItemTransfer) {
        return <ErrorAction />;
    }

    if (nftItemTransfer.recipient?.address === wallet.active.rawAddress) {
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
                                wallet.network
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
                            wallet.network
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

const Image = styled.img`
    width: 96px;
    width: 96px;
    margin-bottom: 20px;
    border-radius: ${props => props.theme.cornerMedium};
    user-select: none;
`;

const Icon = styled.span`
    position: relative;
    top: 3px;
    margin-left: 4px;
    user-select: none;
`;

const NftActivityHeader: FC<{
    kind: 'send' | 'received';
    timestamp: number;
    data?: NftItemRepr;
    amount?: Price;
    status?: ActionStatusEnum;
}> = ({ kind, timestamp, data, amount, status }) => {
    const preview = data?.previews?.find(item => item.resolution === '100x100');

    return (
        <div>
            {preview && <Image src={preview.url} alt="NFT Preview" />}
            {data && (
                <>
                    <Title>{data.dns ?? data.metadata.name}</Title>
                    <Amount>
                        {data.collection?.name ?? data.metadata.description}
                        {data && data.approvedBy && data.approvedBy.length > 0 && (
                            <Icon>
                                <VerificationIcon />
                            </Icon>
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
    const wallet = useWalletContext();
    const { nftItemTransfer } = action;

    const { data } = useNftItemData(nftItemTransfer?.nft);

    if (!nftItemTransfer) {
        return <ErrorActivityNotification event={event} />;
    }

    const kind =
        nftItemTransfer.recipient?.address === wallet.active.rawAddress ? 'received' : 'send';

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
