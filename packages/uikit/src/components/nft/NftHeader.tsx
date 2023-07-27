import { NftItemRepr } from '@tonkeeper/core/dist/tonApiV1';
import React, { FC } from 'react';
import styled, { css } from 'styled-components';
import { VerificationIcon } from '../Icon';
import { Body2, Body3, Label2 } from '../Text';

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

export const NftHeaderLabel2: FC<{ nft: NftItemRepr }> = React.memo(({ nft }) => {
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

const IconBody = styled.span`
    position: absolute;
    top: 0;
    right: 0;
`;

export const NftCollectionBody3: FC<{ nft: NftItemRepr }> = React.memo(({ nft }) => {
    const verified = nft.approvedBy && nft.approvedBy.length > 0;
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

const BodyHeader = styled(Body2)`
    overflow: hidden;
    text-overflow: ellipsis;
`;

export const NftHeaderBody2: FC<{ nft: NftItemRepr }> = React.memo(({ nft }) => {
    return <BodyHeader>{nft.dns ?? nft.metadata.name}</BodyHeader>;
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

export const NftCollectionBody2: FC<{ nft: NftItemRepr }> = React.memo(({ nft }) => {
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
