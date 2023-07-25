import { NFT } from '@tonkeeper/core/dist/entries/nft';
import React, { FC, useCallback, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { useTranslation } from '../../hooks/translation';
import { useNftCollectionData } from '../../state/wallet';
import { ChevronDownIcon, VerificationIcon } from '../Icon';
import { Notification, NotificationBlock, NotificationTitleBlock } from '../Notification';
import { H2, H3, Label1, Label4 } from '../Text';
import { BackButton, ButtonMock } from '../fields/BackButton';
import { Body, CroppedBodyText } from '../jettons/CroppedText';
import { NftAction } from './NftAction';
import { NftDetails } from './NftDetails';
import { Image, NftBlock } from './Nfts';

const Text = styled.div`
    display: flex;
    flex-direction: column;
    padding: 0.875rem 1rem;
`;

const Delimiter = styled.div`
    border-top: 1px solid ${props => props.theme.separatorCommon};
`;

const CollectionTitle = styled(Label1)`
    margin-bottom: 0.5rem;
`;

const Icon = styled.span`
    position: relative;
    top: 3px;
    margin-left: 4px;
`;

const TonDnsRoot = '0:b774d95eb20543f186c06b371ab88ad704f7e256130caf96189368a7d0cb6ccf';
const TelegramUsernames = '0:80d78a35f955a14b679faa887ff4cd5bfc0f43b4a4eea2a7e6927f3701b273c2';

const TelegramNumbers = '0:0e41dc1dc3c9067ed24248580e12b3359818d83dee0304fabcf80845eafafdb2';

const Title = styled(H2)`
    word-break: break-word;

    user-select: none;
`;

const SaleBlock = styled(Label4)`
    color: ${props => props.theme.textSecondary};
    border: 1px solid ${props => props.theme.buttonTertiaryBackground};
    border-radius: 6px;
    padding: 3.5px 6px 4.5px;
    text-transform: uppercase;

    position: relative;
    top: -3px;

    white-space: nowrap;
`;

const NftPreview: FC<{
    onClose: () => void;
    nftItem: NFT;
}> = ({ onClose, nftItem }) => {
    const ref = useRef<HTMLImageElement | null>(null);
    const { t } = useTranslation();
    const { data: collection } = useNftCollectionData(nftItem);

    const { description } = nftItem.metadata;
    const name = nftItem.dns ?? nftItem.metadata.name;

    const itemKind = useMemo(() => {
        switch (nftItem.collection?.address) {
            case TonDnsRoot:
                return 'ton.dns';
            case TelegramUsernames:
                return 'telegram.name';
            case TelegramNumbers:
                return 'telegram.number';
            default:
                return 'token';
        }
    }, [nftItem]);

    const collectionName = nftItem?.collection?.name;

    const image = nftItem.previews?.find(item => item.resolution === '1500x1500');

    return (
        <NotificationBlock>
            <NotificationTitleBlock>
                <BackButton onClick={onClose}>
                    <ChevronDownIcon />
                </BackButton>
                <H3>{nftItem.dns ?? nftItem.metadata.name}</H3>
                <ButtonMock />
            </NotificationTitleBlock>
            <NftBlock>
                {image && <Image ref={ref} url={image.url} />}
                <Text>
                    <Title>
                        {name}
                        {nftItem.sale && (
                            <>
                                {'  '}
                                <SaleBlock>{t('nft_on_sale')}</SaleBlock>
                            </>
                        )}
                    </Title>
                    {collectionName && (
                        <Body open margin="small">
                            {collectionName}
                            {nftItem.approvedBy && nftItem.approvedBy.length > 0 && (
                                <Icon>
                                    <VerificationIcon />
                                </Icon>
                            )}
                        </Body>
                    )}
                    {description && (
                        <CroppedBodyText text={description} margin="last" contentColor />
                    )}
                </Text>
                {collection && collection.metadata.description && (
                    <>
                        <Delimiter />
                        <Text>
                            <CollectionTitle>{t('About_collection')}</CollectionTitle>
                            <CroppedBodyText
                                text={collection.metadata.description}
                                margin="last"
                                contentColor
                            />
                        </Text>
                    </>
                )}
            </NftBlock>

            <NftAction nftItem={nftItem} kind={itemKind} />

            <NftDetails nftItem={nftItem} kind={itemKind} />
        </NotificationBlock>
    );
};
export const NftNotification: FC<{
    nftItem: NFT | undefined;
    handleClose: () => void;
}> = ({ nftItem, handleClose }) => {
    const Content = useCallback(() => {
        if (!nftItem) return undefined;
        return <NftPreview onClose={handleClose} nftItem={nftItem} />;
    }, [nftItem, handleClose]);

    return (
        <Notification
            isOpen={nftItem !== undefined}
            hideButton
            handleClose={handleClose}
            backShadow
        >
            {Content}
        </Notification>
    );
};
