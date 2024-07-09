import { NftsList } from '../../components/nft/Nfts';
import styled from 'styled-components';
import { Body2, Label2 } from '../../components/Text';
import { Button } from '../../components/fields/Button';
import { Link, useNavigate } from 'react-router-dom';
import { AppRoute, WalletSettingsRoute } from '../../libs/routes';
import { useTranslation } from '../../hooks/translation';
import {
    DesktopViewHeader,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { useIsScrolled } from '../../hooks/useIsScrolled';
import { KnownNFTDnsCollections } from '../../components/nft/NftView';
import { useMemo } from 'react';
import { SlidersIcon } from '../../components/Icon';
import { IconButtonTransparentBackground } from '../../components/fields/IconButton';
import { useWalletFilteredNftList } from "../../state/nft";

const gap = '10px';
const maxColumnsNumber = 4;
const maxGapWidth = (maxColumnsNumber - 1) * parseInt(gap) + 'px';
const minColumnWidth = '130px';

const NftsListStyled = styled(NftsList)`
    --grid-item--max-width: calc((100% - ${maxGapWidth}) / ${maxColumnsNumber});

    grid-template-columns: repeat(
        auto-fill,
        minmax(max(${minColumnWidth}, var(--grid-item--max-width)), 1fr)
    );
    grid-gap: ${gap};

    margin-bottom: 0;
`;

const NFTEmptyPage = styled.div`
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const NFTPageBody = styled.div`
    padding: 0 1rem 1rem;
`;

const NFTEmptyContainer = styled.div`
    padding: 2rem;

    text-align: center;

    & > * {
        display: block;
    }

    & > ${Body2} {
        margin-bottom: 1.5rem;
        color: ${p => p.theme.textSecondary};
    }
`;

const LinkStyled = styled(Link)`
    text-decoration: unset;
    color: inherit;
    width: fit-content;
    margin: 0 auto;
`;

const SettingsButtonStyled = styled(IconButtonTransparentBackground)`
    margin-left: auto;
`;

export const DesktopCollectables = () => {
    const { data: nfts } = useWalletFilteredNftList();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const { ref: scrollRef, closeTop } = useIsScrolled();

    const filteredNft = useMemo(
        () =>
            nfts?.filter(
                nft =>
                    !nft.collection?.address ||
                    !KnownNFTDnsCollections.includes(nft.collection.address)
            ),
        [nfts]
    );

    if (!filteredNft) {
        return null;
    }

    if (!filteredNft.length) {
        return (
            <NFTEmptyPage>
                <NFTEmptyContainer>
                    <Label2>{t('collectibles_empty_header')}</Label2>
                    <Body2>{t('nft_empty_description')}</Body2>
                    <LinkStyled to={AppRoute.browser}>
                        <Button size="small">{t('nft_empty_go_discover_button')}</Button>
                    </LinkStyled>
                </NFTEmptyContainer>
            </NFTEmptyPage>
        );
    }

    return (
        <DesktopViewPageLayout ref={scrollRef}>
            <DesktopViewHeader borderBottom={!closeTop}>
                <Label2>{t('wallet_aside_collectibles')}</Label2>
                <SettingsButtonStyled
                    onClick={() => navigate(AppRoute.walletSettings + WalletSettingsRoute.nft)}
                >
                    <SlidersIcon />
                </SettingsButtonStyled>
            </DesktopViewHeader>
            <NFTPageBody>{filteredNft && <NftsListStyled nfts={filteredNft} />}</NFTPageBody>
        </DesktopViewPageLayout>
    );
};
