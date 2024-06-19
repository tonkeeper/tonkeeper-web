import { FC, useMemo, useState } from 'react';
import styled from 'styled-components';
import { InnerBody } from '../../../components/Body';
import { ChevronRightIcon, MinusIcon, PlusIcon } from '../../../components/Icon';
import { ListBlock, ListItemElement, ListItemPayload } from '../../../components/List';
import { SkeletonList } from '../../../components/Skeleton';
import { SubHeader } from '../../../components/SubHeader';
import { Body2, H3, Label1 } from '../../../components/Text';
import { useTranslation } from '../../../hooks/translation';
import { useActiveWalletConfig, useWalletNftList } from '../../../state/wallet';
import { IconButton } from '../../../components/fields/IconButton';
import { BorderSmallResponsive } from '../../../components/shared/Styles';
import { useHideNft, useMakeNftVisible, useMarkNftAsTrusted } from '../../../state/nft';
import { SettingsNFTCollection, SettingsSingleNFT } from './models';
import { SpamNftInfoNotification } from './SpamNftInfoNotification';
import { Image } from '../../../components/shared/Image';

const NFTSkeleton = () => {
    const { t } = useTranslation();

    return (
        <>
            <SubHeader title={t('settings_jettons_list')} />
            <InnerBody>
                <SkeletonList size={5} />
            </InnerBody>
        </>
    );
};

const NFTSection = styled.div`
    margin-bottom: 1rem;
`;

const NftSectionTitle = styled(H3)`
    padding: 14px 18px;
    margin: 0;
`;

const ListItemPayloadStyled = styled(ListItemPayload)`
    gap: 1rem;
    justify-content: flex-start;
`;

const NftImageStyled = styled(Image)`
    height: 44px;
    width: 44px;
    ${BorderSmallResponsive}
`;

const NftButton = styled(IconButton)`
    padding: 8px;

    background-color: ${props => props.theme.backgroundContentTint};
    &:hover {
        background-color: ${props => props.theme.backgroundContentAttention};
    }
`;

const NftTextContainer = styled.div`
    display: flex;
    flex-direction: column;
    overflow: hidden;

    > * {
        overflow: hidden;
        text-overflow: ellipsis;
    }

    > ${Body2} {
        color: ${props => props.theme.textSecondary};
    }
`;

const ChevronRightIconStyled = styled(ChevronRightIcon)`
    margin-left: auto;
    color: ${props => props.theme.iconTertiary};
`;

const NftsSection: FC<{
    collections: (SettingsNFTCollection | SettingsSingleNFT)[];
    type: 'visible' | 'hidden' | 'spam';
    onClick: (nft: SettingsNFTCollection | SettingsSingleNFT) => void;
}> = ({ collections, type, onClick }) => {
    const showButton = type !== 'spam';
    return (
        <NFTSection>
            <NftSectionTitle>{type}</NftSectionTitle>
            <ListBlock>
                {collections.map(collection => (
                    <ListItemElement
                        hover={type === 'spam'}
                        key={collection.address}
                        onClick={() => type === 'spam' && onClick(collection)}
                    >
                        <ListItemPayloadStyled>
                            {showButton && (
                                <NftButton onClick={() => onClick(collection)}>
                                    {type === 'hidden' ? <PlusIcon /> : <MinusIcon />}
                                </NftButton>
                            )}
                            <NftImageStyled src={collection.image} />
                            <NftTextContainer>
                                <Label1>{collection.name || 'Unknown'}</Label1>
                                <Body2>
                                    {collection.type === 'collection'
                                        ? collection.nfts.length > 1
                                            ? `${collection.nfts.length} NFTs`
                                            : `${collection.nfts.length} NFT`
                                        : 'Single NFT'}
                                </Body2>
                            </NftTextContainer>
                            {type === 'spam' && <ChevronRightIconStyled />}
                        </ListItemPayloadStyled>
                    </ListItemElement>
                ))}
            </ListBlock>
        </NFTSection>
    );
};

export const NFTSettings = () => {
    const { t } = useTranslation();
    const [selectedSpamNft, setSelectedSpamNft] = useState<
        SettingsNFTCollection | SettingsSingleNFT | undefined
    >();

    const { data: nfts } = useWalletNftList();
    const { data: config } = useActiveWalletConfig();

    const collections: (SettingsNFTCollection | SettingsSingleNFT)[] = useMemo(() => {
        if (!config || !nfts) return [];
        return nfts.reduce((acc, item) => {
            const image = item.previews?.find(i => i.resolution === '100x100')?.url;
            if (!item.collection) {
                return acc.concat({
                    type: 'single',
                    isSpam:
                        config.spamNfts.includes(item.address) ||
                        (item.trust === 'blacklist' && !config.trustedNfts.includes(item.address)),
                    isHidden: config.hiddenNfts.includes(item.address),
                    ...item,
                    image,
                    name: item.metadata.name
                });
            }
            let collection: SettingsNFTCollection | undefined = acc.find(
                c => c.type === 'collection' && c.address === item.collection!.address
            ) as SettingsNFTCollection | undefined;

            if (!collection) {
                collection = {
                    type: 'collection',
                    ...item.collection,
                    nfts: [],
                    isSpam: false,
                    isHidden: config.hiddenNfts.includes(item.collection.address)
                };
                acc.push(collection);
            }

            if (config.spamNfts.includes(collection.address)) {
                collection.isSpam = true;
            } else {
                const isTrustedCollection = config.trustedNfts.includes(collection.address);
                if (!isTrustedCollection) {
                    collection.isSpam = collection.isSpam || item.trust === 'blacklist';
                }
            }

            collection.nfts.push(item);

            if (!collection.image && image) {
                collection.image = image;
            }

            return acc;
        }, [] as (SettingsNFTCollection | SettingsSingleNFT)[]);
    }, [nfts, config?.spamNfts, config?.hiddenNfts, config?.trustedNfts]);

    const visibleCollections = useMemo(
        () => collections.filter(collection => !collection.isHidden && !collection.isSpam),
        [collections]
    );

    const hiddenCollections = useMemo(
        () => collections.filter(collection => collection.isHidden),
        [collections]
    );

    const spamCollections = useMemo(
        () => collections.filter(collection => collection.isSpam),
        [collections]
    );

    const { mutate: makeNftVisible } = useMakeNftVisible();
    const { mutate: hideNft } = useHideNft();
    const { mutate: trustNft } = useMarkNftAsTrusted();

    if (!nfts || !config) {
        return <NFTSkeleton />;
    }

    const onCloseSpamNftInfo = (confirmNotSpam?: boolean) => {
        if (confirmNotSpam) {
            trustNft(selectedSpamNft!.address);
        }

        setSelectedSpamNft(undefined);
    };

    return (
        <>
            <SubHeader title={t('settings_jettons_list')} />
            <InnerBody>
                {visibleCollections.length > 0 && (
                    <NftsSection
                        collections={visibleCollections}
                        type="visible"
                        onClick={c => hideNft(c.address)}
                    />
                )}
                {hiddenCollections.length > 0 && (
                    <NftsSection
                        collections={hiddenCollections}
                        type="hidden"
                        onClick={c => makeNftVisible(c.address)}
                    />
                )}
                {spamCollections.length > 0 && (
                    <NftsSection
                        collections={spamCollections}
                        type="spam"
                        onClick={setSelectedSpamNft}
                    />
                )}
                <SpamNftInfoNotification
                    isOpen={!!selectedSpamNft}
                    onClose={onCloseSpamNftInfo}
                    nft={selectedSpamNft}
                />
            </InnerBody>
        </>
    );
};