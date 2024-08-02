import { Action } from '@tonkeeper/core/dist/tonApiV2';
import React, { FC } from 'react';

import { eqAddresses } from '@tonkeeper/core/dist/utils/address';
import {
    ActionRow,
    HistoryCellActionReceived,
    HistoryCellActionSent,
    HistoryCellComment,
    HistoryCellAccount,
    ErrorRow,
    HistoryCellActionGeneric
} from './HistoryCell';
import { useActiveWallet } from '../../../../state/wallet';
import styled, { css } from 'styled-components';
import { Body2 } from '../../../Text';
import { Skeleton } from '../../../shared/Skeleton';
import { useFormatCoinValue } from '../../../../hooks/balance';
import { ChevronRightIcon, CoinsIcon } from '../../../Icon';
import { useTranslation } from '../../../../hooks/translation';
import { ContractDeployIcon } from '../../../activity/ActivityIcons';
import { useIsSpamNft, useIsUnverifiedNft, useNftCollectionData, useNftItemData } from "../../../../state/nft";

const NftImage = styled.img<{ isUnverified?: boolean }>`
    width: 20px;
    height: 20px;
    border-radius: ${props => props.theme.corner3xSmall};
    user-select: none;
    flex-shrink: 0;

    ${props =>
        props.isUnverified &&
        css`
            opacity: 0.5;
        `};
`;

const NftTitle = styled(Body2)<{ isFailed: boolean; isUnverified?: boolean }>`
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    ${props =>
        props.isFailed &&
        css`
            color: ${props.theme.textTertiary};
        `};

    ${props =>
        props.isUnverified &&
        css`
            color: ${props.theme.textSecondary};
        `};
`;

const NftContainer = styled.div`
    display: flex;
    gap: 0.5rem;
`;

const NftPurchaseContainer = styled.div`
    display: flex;
`;

const ActionRowNftStyled = styled(ActionRow)<{ fullComment?: boolean }>`
    grid-template-columns: ${p => (p.fullComment ? 'minmax(max-content, 1fr)' : '1fr')} minmax(
            50px,
            max-content
        );
`;

const UnverifiedNftComment = styled(Body2)`
    color: ${p => p.theme.accentOrange};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 40px;
`;

const SpamNftPlaceholder = styled(Body2)`
    color: ${p => p.theme.textTertiary};
`;

const HistoryCellNft: FC<{
    nftAddress: string;
    isFailed: boolean;
    isUnverified?: boolean;
}> = ({ nftAddress, isFailed, isUnverified }) => {
    const { data } = useNftItemData(nftAddress);

    if (!data) {
        return <Skeleton width="100px" height="20px" />;
    }

    const preview = data?.previews?.find(item => item.resolution === '100x100');

    return (
        <NftContainer>
            <NftTitle isUnverified={isUnverified} isFailed={isFailed}>
                {data.dns ?? data.metadata.name}
            </NftTitle>
            {preview && (
                <NftImage isUnverified={isUnverified} src={preview.url} alt="NFT Preview" />
            )}
        </NftContainer>
    );
};

const HistoryCellNftPurchase: FC<{
    nftAddress: string;
    isFailed: boolean;
    amount: string | number;
    symbol: string;
}> = ({ nftAddress, amount, symbol, isFailed }) => {
    const format = useFormatCoinValue();

    return (
        <NftPurchaseContainer>
            <NftTitle isFailed={isFailed}>
                {format(amount)}&nbsp;{symbol}
            </NftTitle>
            <ChevronRightIcon />
            <HistoryCellNft nftAddress={nftAddress} isFailed={isFailed} />
        </NftPurchaseContainer>
    );
};

export const NftTransferDesktopAction: FC<{
    action: Action;
    isScam: boolean;
}> = ({ action, isScam }) => {
    const { t } = useTranslation();
    const wallet = useActiveWallet();
    const { nftItemTransfer } = action;

    const { data: nftInfo } = useNftItemData(action.nftItemTransfer?.nft || '');

    const isSpam = useIsSpamNft(nftInfo) || isScam;
    const isUnverified = useIsUnverifiedNft(nftInfo);

    if (!nftItemTransfer) {
        return <ErrorRow />;
    }

    if (eqAddresses(wallet.rawAddress, nftItemTransfer.sender?.address)) {
        return (
            <>
                <HistoryCellActionSent isFailed={action.status === 'failed'} />
                <HistoryCellAccount account={nftItemTransfer.recipient} />
                <ActionRowNftStyled>
                    <HistoryCellComment comment={nftItemTransfer.comment} />
                    <HistoryCellNft
                        nftAddress={nftItemTransfer.nft}
                        isFailed={action.status === 'failed'}
                    />
                </ActionRowNftStyled>
            </>
        );
    }

    return (
        <>
            <HistoryCellActionReceived isScam={isSpam} isFailed={action.status === 'failed'} />
            <HistoryCellAccount account={nftItemTransfer.sender} />
            <ActionRowNftStyled fullComment={isUnverified}>
                {isUnverified && !isSpam ? (
                    <UnverifiedNftComment>{t('suspicious_label_short')}</UnverifiedNftComment>
                ) : (
                    <HistoryCellComment comment={nftItemTransfer.comment} isScam={isSpam} />
                )}
                {isSpam ? (
                    <SpamNftPlaceholder>{t('history_spam_nft')}</SpamNftPlaceholder>
                ) : (
                    <HistoryCellNft
                        nftAddress={nftItemTransfer.nft}
                        isFailed={action.status === 'failed'}
                        isUnverified={isUnverified}
                    />
                )}
            </ActionRowNftStyled>
        </>
    );
};

export const NftPurchaseDesktopAction: FC<{
    action: Action;
}> = ({ action }) => {
    const { nftPurchase } = action;
    const { t } = useTranslation();

    if (!nftPurchase) {
        return <ErrorRow />;
    }
    const isFailed = action.status === 'failed';

    return (
        <>
            <HistoryCellActionGeneric icon={<CoinsIcon />} isFailed={isFailed}>
                {t('transactions_nft_purchase')}
            </HistoryCellActionGeneric>
            <HistoryCellAccount account={nftPurchase.seller} />
            <ActionRow>
                <HistoryCellComment />
                <HistoryCellNftPurchase
                    nftAddress={nftPurchase.nft.address}
                    isFailed={action.status === 'failed'}
                    amount={nftPurchase.amount.value}
                    symbol={nftPurchase.amount.tokenName}
                />
            </ActionRow>
        </>
    );
};

const ContractDeployIconStyled = styled(ContractDeployIcon)`
    color: ${p => p.theme.iconPrimary};
    width: 16px;
    height: 16px;
`;

export const NftDeployDesktopAction: FC<{ address: string; isFailed: boolean }> = ({
    address,
    isFailed
}) => {
    const { t } = useTranslation();

    return (
        <>
            <HistoryCellActionGeneric icon={<ContractDeployIconStyled />} isFailed={isFailed}>
                {t('NFT_creation')}
            </HistoryCellActionGeneric>
            <HistoryCellAccount account={{ address }} />
            <ActionRowNftStyled>
                <HistoryCellComment />
                <HistoryCellNft nftAddress={address} isFailed={isFailed} />
            </ActionRowNftStyled>
        </>
    );
};

export const NftCollectionDeployDesktopAction: FC<{ address: string; isFailed: boolean }> = ({
    address,
    isFailed
}) => {
    const { t } = useTranslation();
    const { data } = useNftCollectionData(address);

    if (!data) {
        return <Skeleton width="100px" height="20px" />;
    }

    const preview = data?.previews?.find(item => item.resolution === '100x100');

    return (
        <>
            <HistoryCellActionGeneric icon={<ContractDeployIconStyled />} isFailed={isFailed}>
                {t('nft_deploy_collection_title')}
            </HistoryCellActionGeneric>
            <HistoryCellAccount account={{ address }} />
            <ActionRowNftStyled>
                <HistoryCellComment />
                <NftContainer>
                    <NftTitle isFailed={isFailed}>
                        {data.metadata?.name || 'Unnamed Collection'}
                    </NftTitle>
                    {preview && <NftImage src={preview.url} alt="NFT Preview" />}
                </NftContainer>
            </ActionRowNftStyled>
        </>
    );
};
