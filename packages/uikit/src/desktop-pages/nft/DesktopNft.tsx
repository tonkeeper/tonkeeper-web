import { NftsList } from '../../components/nft/Nfts';
import styled, { css } from 'styled-components';
import { Body2, Label2 } from '../../components/Text';
import { Button } from '../../components/fields/Button';
import { AppRoute, WalletSettingsRoute } from '../../libs/routes';
import { useTranslation } from '../../hooks/translation';
import {
    DesktopViewHeader,
    DesktopViewHeaderContent,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { useIsScrolled } from '../../hooks/useIsScrolled';
import { FC } from 'react';
import { SlidersIcon } from '../../components/Icon';
import { Link } from '../../components/shared/Link';
import { ForTargetEnv } from '../../components/shared/TargetEnv';
import { PullToRefresh } from '../../components/mobile-pro/PullToRefresh';
import { QueryKey } from '../../libs/queryKey';
import { NFT } from '@tonkeeper/core/dist/entries/nft';

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
    height: calc(100% - 54px);
    display: flex;
    align-items: center;
    justify-content: center;

    ${p =>
        p.theme.proDisplayType === 'mobile' &&
        css`
            height: unset;
            flex: 1;
        `}
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

const DesktopViewPageLayoutStyled = styled(DesktopViewPageLayout)<{ emptyList$: boolean }>`
    ${p =>
        p.emptyList$ &&
        css`
            height: 100%;
            
            ${
                p.theme.proDisplayType === 'mobile' &&
                css`
                    display: flex;
                    flex-direction: column;
                `
            }}
        `}
`;

const ExplorerLinkStyled = styled(Link)`
    padding-right: 1rem;
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
`;

export const DesktopNFTS: FC<{
    nfts: NFT[] | undefined;
    emptyPageTitle: string;
    pageTitle: string;
}> = ({ nfts, emptyPageTitle, pageTitle }) => {
    const { t } = useTranslation();

    const { ref: scrollRef, closeTop } = useIsScrolled();

    if (!nfts) {
        return null;
    }

    return (
        <DesktopViewPageLayoutStyled
            ref={scrollRef}
            mobileContentPaddingTop={!!nfts.length}
            emptyList$={!nfts.length}
        >
            <DesktopViewHeader borderBottom={!closeTop}>
                <DesktopViewHeaderContent
                    title={pageTitle}
                    right={
                        <DesktopViewHeaderContent.Right>
                            <DesktopViewHeaderContent.RightItem closeDropDownOnClick>
                                <ExplorerLinkStyled
                                    to={AppRoute.walletSettings + WalletSettingsRoute.nft}
                                    replace={false}
                                >
                                    <SlidersIcon />
                                    <ForTargetEnv env="mobile">{t('settings_title')}</ForTargetEnv>
                                </ExplorerLinkStyled>
                            </DesktopViewHeaderContent.RightItem>
                        </DesktopViewHeaderContent.Right>
                    }
                />
            </DesktopViewHeader>
            <PullToRefresh invalidate={QueryKey.nft} />
            {!nfts.length ? (
                <NFTEmptyPage>
                    <NFTEmptyContainer>
                        <Label2>{emptyPageTitle}</Label2>
                        <Body2>{t('nft_empty_description')}</Body2>
                        <LinkStyled to={AppRoute.browser}>
                            <Button size="small">{t('nft_empty_go_discover_button')}</Button>
                        </LinkStyled>
                    </NFTEmptyContainer>
                </NFTEmptyPage>
            ) : (
                <NFTPageBody>{nfts && <NftsListStyled nfts={nfts} />}</NFTPageBody>
            )}
        </DesktopViewPageLayoutStyled>
    );
};
