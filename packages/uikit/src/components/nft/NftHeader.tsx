import { NftItem, TrustType } from '@tonkeeper/core/dist/tonApiV2';
import React, { FC } from 'react';
import styled, { css } from 'styled-components';
import { VerificationIcon } from '../Icon';
import { Body2, Body3, Label2 } from '../Text';
import { useActiveTonWalletConfig } from '../../state/wallet';
import { useTranslation } from '../../hooks/translation';
import { SpamBadge } from '../activity/NotificationCommon';

const TextContent = styled.span`
    display: inline-block;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const Icon = styled.span`
    position: absolute;
    top: 2px;
    right: 0;
`;

const LabelHeader = styled(Label2)`
    overflow: hidden;
    text-overflow: ellipsis;
`;

export const NftHeaderLabel2: FC<{ nft: NftItem }> = React.memo(({ nft }) => {
    return <LabelHeader>{nft.dns ?? nft.metadata.name}</LabelHeader>;
});

const HeaderBody3Secondary = styled(Body3)<{ verified?: boolean }>`
    color: ${props => props.theme.textSecondary};

    display: inline-flex;
    width: fit-content;
    max-width: 100%;
    box-sizing: border-box;

    ${props =>
        props.verified &&
        css`
            padding-right: 19px;
            position: relative;
        `}
`;

const HeaderSuspicious = styled(Body3)`
    color: ${props => props.theme.accentOrange};
    overflow: hidden;
    text-overflow: ellipsis;
`;

const IconBody = styled.span`
    position: absolute;
    top: 0;
    right: 0;
`;

export const NftCollectionBody3: FC<{ nft: NftItem }> = React.memo(({ nft }) => {
    const { t } = useTranslation();
    const { data } = useActiveTonWalletConfig();
    const isTrusted = data?.trustedNfts.includes(nft.collection?.address || nft.address);
    const isSuspicious = nft.trust !== TrustType.Whitelist;

    const verified = nft.trust === TrustType.Whitelist;

    if (isSuspicious && !isTrusted) {
        return <HeaderSuspicious>{t('suspicious_label_short')}</HeaderSuspicious>;
    }

    return (
        <HeaderBody3Secondary verified={verified}>
            <TextContent>{nft.collection?.name ?? nft.metadata.description}</TextContent>
            {verified && (
                <IconBody>
                    <VerificationIcon />
                </IconBody>
            )}
        </HeaderBody3Secondary>
    );
});

const BodyHeader = styled(Body2)<{ isSpam?: boolean; isUnverified?: boolean }>`
    overflow: hidden;
    text-overflow: ellipsis;

    ${p =>
        p.isSpam
            ? css`
                  color: ${p.theme.textTertiary};
              `
            : p.isUnverified
            ? css`
                  color: ${p.theme.textSecondary};
              `
            : undefined}
`;

const BodyHeaderContainer = styled.div`
    display: flex;
    overflow: hidden;
    gap: 8px;

    ${SpamBadge} {
        flex-shrink: 0;
    }
`;

export const NftHeaderBody2: FC<{ nft: NftItem; isSpam?: boolean; isUnverified?: boolean }> =
    React.memo(({ nft, isSpam, isUnverified }) => {
        const { t } = useTranslation();

        if (isSpam) {
            return (
                <BodyHeaderContainer>
                    <BodyHeader isSpam={true}>{nft.dns ?? nft.metadata.name}</BodyHeader>
                    <SpamBadge>{t('spam_action')}</SpamBadge>
                </BodyHeaderContainer>
            );
        }

        return <BodyHeader isUnverified={isUnverified}>{nft.dns ?? nft.metadata.name}</BodyHeader>;
    });

const HeaderBody2Secondary = styled(Body2)<{ verified?: boolean }>`
    color: ${props => props.theme.textSecondary};

    display: inline-flex;
    width: fit-content;
    max-width: 100%;
    box-sizing: border-box;

    ${props =>
        props.verified &&
        css`
            padding-right: 19px;
            position: relative;
        `}
`;

export const NftCollectionBody2: FC<{ nft: NftItem }> = React.memo(({ nft }) => {
    const verified = nft.approvedBy && nft.approvedBy.length > 0;
    return (
        <HeaderBody2Secondary verified={verified}>
            <TextContent>{nft.collection?.name ?? nft.metadata.description}</TextContent>
            {verified && (
                <Icon>
                    <VerificationIcon />
                </Icon>
            )}
        </HeaderBody2Secondary>
    );
});
