import { NftItemCollection } from '@tonkeeper/core/dist/tonApiV2';
import { FC, useMemo } from 'react';
import styled from 'styled-components';
import { InnerBody } from '../../components/Body';
import { MinusIcon, PlusIcon } from '../../components/Icon';
import { ListBlock, ListItemElement, ListItemPayload } from '../../components/List';
import { SkeletonList } from '../../components/Skeleton';
import { SubHeader } from '../../components/SubHeader';
import { Body2, H3, Label1 } from '../../components/Text';
import { useTranslation } from '../../hooks/translation';
import { useActiveWalletConfig, useWalletNftList } from '../../state/wallet';
import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { IconButton } from '../../components/fields/IconButton';
import { BorderSmallResponsive } from '../../components/shared/Styles';
import { useHideNft, useMakeNftVisible } from '../../state/nft';

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

const NftImageStyled = styled.img`
    height: 44px;
    width: 44px;
    ${BorderSmallResponsive}
`;

const NftButton = styled(IconButton)`
    padding: 8px;
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

const NftsSection: FC<{
    collections: (NFTCollection | SingleNFT)[];
    type: 'visible' | 'hidden' | 'spam';
    onClick: (nft: string) => void;
}> = ({ collections, type, onClick }) => {
    const showButton = type !== 'spam';
    return (
        <NFTSection>
            <NftSectionTitle>{type}</NftSectionTitle>
            <ListBlock>
                {collections.map((collection, index) => (
                    <ListItemElement hover={false} key={collection.address}>
                        <ListItemPayloadStyled>
                            {showButton && (
                                <NftButton onClick={() => onClick(collection.address)}>
                                    {type === 'hidden' ? <PlusIcon /> : <MinusIcon />}
                                </NftButton>
                            )}
                            <NftImageStyled src={collection.image} />
                            <NftTextContainer>
                                <Label1>{collection.name}</Label1>
                                <Body2>
                                    {collection.type === 'collection'
                                        ? collection.nfts.length > 1
                                            ? `${collection.nfts.length} NFTs`
                                            : `${collection.nfts.length} NFT`
                                        : 'Single NFT'}
                                </Body2>
                            </NftTextContainer>
                        </ListItemPayloadStyled>
                    </ListItemElement>
                ))}
            </ListBlock>
        </NFTSection>
    );
};

type NFTCollection = NftItemCollection & {
    type: 'collection';
    nfts: NFT[];
    isSpam: boolean;
    isHidden: boolean;
    image?: string;
    name: string;
};

type SingleNFT = NFT & {
    type: 'single';
    isSpam: boolean;
    isHidden: boolean;
    image?: string;
    name: string;
};

export const NFTSettings = () => {
    const { t } = useTranslation();

    const { data: nfts } = useWalletNftList();
    const { data: config } = useActiveWalletConfig();

    const collections: (NFTCollection | SingleNFT)[] = useMemo(() => {
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
            let collection: NFTCollection | undefined = acc.find(
                c => c.type === 'collection' && c.address === item.collection!.address
            ) as NFTCollection | undefined;

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
        }, [] as (NFTCollection | SingleNFT)[]);
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

    if (!nfts || !config) {
        return <NFTSkeleton />;
    }

    return (
        <>
            <SubHeader title={t('settings_jettons_list')} />
            <InnerBody>
                {visibleCollections.length > 0 && (
                    <NftsSection
                        collections={visibleCollections}
                        type="visible"
                        onClick={hideNft}
                    />
                )}
                {hiddenCollections.length > 0 && (
                    <NftsSection
                        collections={hiddenCollections}
                        type="hidden"
                        onClick={makeNftVisible}
                    />
                )}
                {spamCollections.length > 0 && (
                    <NftsSection collections={spamCollections} type="spam" onClick={() => {}} />
                )}
            </InnerBody>
        </>
    );
};
