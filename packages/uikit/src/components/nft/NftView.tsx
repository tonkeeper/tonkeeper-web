import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { TrustType } from '@tonkeeper/core/dist/tonApiV2';
import { FC, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { useDisclosure } from '../../hooks/useDisclosure';
import {
    useHideNft,
    useMarkNftAsSpam,
    useMarkNftAsTrusted,
    useNftCollectionData
} from '../../state/nft';
import { useActiveTonWalletConfig } from '../../state/wallet';
import { DropDown } from '../DropDown';
import {
    BlockIcon,
    ChevronDownIcon,
    EllipsisIcon,
    EyeDisableIcon,
    GlobeIcon,
    InfoCircleIcon,
    VerificationIcon
} from '../Icon';
import { ListBlock, ListItemElement, ListItemPayload } from '../List';
import { NotificationBlock, NotificationTitleBlock } from '../Notification';
import { Body2, H2, H3, Label1, Label4 } from '../Text';
import { Button } from '../fields/Button';
import { RoundedButton } from '../fields/RoundedButton';
import { Body, CroppedBodyText } from '../jettons/CroppedText';
import { NftAction } from './NftAction';
import { NftDetails } from './NftDetails';
import { Image, NftBlock } from './Nfts';
import { UnverifiedNftNotification } from './UnverifiedNftNotification';

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

export const TonDnsRootCollectionAddress =
    '0:b774d95eb20543f186c06b371ab88ad704f7e256130caf96189368a7d0cb6ccf';
export const TelegramUsernamesCollectionAddress =
    '0:80d78a35f955a14b679faa887ff4cd5bfc0f43b4a4eea2a7e6927f3701b273c2';
export const TelegramNumbersCollectionAddress =
    '0:0e41dc1dc3c9067ed24248580e12b3359818d83dee0304fabcf80845eafafdb2';
export const GetGemsDnsCollectionAddress =
    '0:e1955aba7249f23e4fd2086654a176516d98b134e0df701302677c037c358b17';

export const KnownNFTDnsCollections = [
    TonDnsRootCollectionAddress,
    TelegramNumbersCollectionAddress,
    TelegramUsernamesCollectionAddress,
    GetGemsDnsCollectionAddress
];

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

const UnverifiedLabel = styled(Body2)<{ isTrusted: boolean }>`
    color: ${props => (props.isTrusted ? props.theme.textSecondary : props.theme.accentOrange)};
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
`;

const NftNameContainer = styled.div`
    text-align: center;
`;

const ButtonsBlock = styled.div`
    display: flex;
    gap: 8px;
    width: 100%;

    > * {
        flex: 1;
    }
`;

const DropDownWrapper = styled.div`
    .drop-down-container {
        z-index: 100;
        top: calc(100% + 12px);
        right: 0;
    }
`;

const ListBlockStyled = styled(ListBlock)`
    margin: 0;

    svg {
        color: ${p => p.theme.accentBlue};
    }
`;

export const NftPreview: FC<{
    onClose?: () => void;
    nftItem: NFT;
}> = ({ onClose, nftItem }) => {
    const { mutateAsync: markNftAsSpam, isLoading: markNftAsSpamLoading } = useMarkNftAsSpam();
    const { mutate: markNftAsTrusted, isLoading: markNftAsTrustedLoading } = useMarkNftAsTrusted();
    const { mutateAsync: hideNft } = useHideNft();

    const { data } = useActiveTonWalletConfig();
    const isSuspicious = nftItem.trust !== TrustType.Whitelist;
    const isTrusted = !!data?.trustedNfts.includes(nftItem.collection?.address || nftItem.address);

    const ref = useRef<HTMLImageElement | null>(null);
    const { t } = useTranslation();
    const { data: collection } = useNftCollectionData(nftItem);

    const { description } = nftItem.metadata;
    const name = nftItem.dns ?? nftItem.metadata.name;

    const itemKind = useMemo(() => {
        switch (nftItem.collection?.address) {
            case TonDnsRootCollectionAddress:
                return 'ton.dns';
            case TelegramUsernamesCollectionAddress:
                return 'telegram.name';
            case TelegramNumbersCollectionAddress:
                return 'telegram.number';
            default:
                return 'token';
        }
    }, [nftItem]);

    const collectionName = nftItem?.collection?.name;

    const image = nftItem.previews?.find(item => item.resolution === '1500x1500');

    const {
        isOpen: isSpamModalOpen,
        onClose: onCloseSpamModal,
        onOpen: onOpenSpamModal
    } = useDisclosure();

    const handleCloseSpamModal = (action?: 'mark_spam' | 'mark_trusted') => {
        if (action === 'mark_spam') {
            markNftAsSpam(nftItem).then(onClose);
        } else if (action === 'mark_trusted') {
            markNftAsTrusted(nftItem);
        }
        onCloseSpamModal();
    };

    const { config } = useAppContext();
    const sdk = useAppSdk();

    const explorerUrl = config.NFTOnExplorerUrl ?? 'https://tonviewer.com/nft/%s';

    return (
        <NotificationBlock>
            {onClose && (
                <NotificationTitleBlock>
                    <RoundedButton onClick={onClose}>
                        <ChevronDownIcon />
                    </RoundedButton>
                    <NftNameContainer>
                        <H3>{nftItem.dns ?? nftItem.metadata.name}</H3>
                        {isSuspicious && (
                            <UnverifiedLabel isTrusted={isTrusted} onClick={onOpenSpamModal}>
                                {t('suspicious_label_full')}&nbsp;
                                <InfoCircleIcon
                                    color={isTrusted ? 'textSecondary' : 'accentOrange'}
                                />
                            </UnverifiedLabel>
                        )}
                    </NftNameContainer>
                    <UnverifiedNftNotification
                        isOpen={isSpamModalOpen}
                        onClose={handleCloseSpamModal}
                        isTrusted={isTrusted}
                    />
                    <DropDownWrapper>
                        <DropDown
                            containerClassName="drop-down-container"
                            payload={closeDropDown => (
                                <ListBlockStyled>
                                    <ListItemElement
                                        onClick={() => {
                                            closeDropDown();
                                            hideNft(nftItem).then(onClose);
                                        }}
                                    >
                                        <ListItemPayload>
                                            <Label1>{t('nft_actions_hide_nft')}</Label1>
                                            <EyeDisableIcon />
                                        </ListItemPayload>
                                    </ListItemElement>
                                    <ListItemElement
                                        onClick={() => {
                                            closeDropDown();
                                            markNftAsSpam(nftItem).then(onClose);
                                        }}
                                    >
                                        <ListItemPayload>
                                            <Label1>{t('nft_actions_hide_and_report')}</Label1>
                                            <BlockIcon />
                                        </ListItemPayload>
                                    </ListItemElement>
                                    <ListItemElement
                                        onClick={() =>
                                            sdk.openPage(explorerUrl.replace('%s', nftItem.address))
                                        }
                                    >
                                        <ListItemPayload>
                                            <Label1>{t('nft_actions_view_on_explorer')}</Label1>
                                            <GlobeIcon />
                                        </ListItemPayload>
                                    </ListItemElement>
                                </ListBlockStyled>
                            )}
                        >
                            <RoundedButton>
                                <EllipsisIcon />
                            </RoundedButton>
                        </DropDown>
                    </DropDownWrapper>
                </NotificationTitleBlock>
            )}
            {isSuspicious && !isTrusted && (
                <ButtonsBlock>
                    <Button
                        warn
                        type="button"
                        onClick={() => markNftAsSpam(nftItem).then(onClose)}
                        loading={markNftAsSpamLoading}
                    >
                        {t('suspicious_buttons_report')}
                    </Button>
                    <Button
                        type="button"
                        onClick={() => markNftAsTrusted(nftItem)}
                        loading={markNftAsTrustedLoading}
                    >
                        {t('suspicious_buttons_not_spam')}
                    </Button>
                </ButtonsBlock>
            )}
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
                {collection && collection.metadata?.description && (
                    <>
                        <Delimiter />
                        <Text>
                            <CollectionTitle>{t('nft_about_collection')}</CollectionTitle>
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
