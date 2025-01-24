import styled from 'styled-components';
import { MobileProHomeBalance } from '../components/mobile-pro/home/MobileProHomeBalance';
import { IonContent, IonPage } from '@ionic/react';
import React, { useMemo } from 'react';
import { MobileProHomeActions } from '../components/mobile-pro/home/MobileProHomeActions';
import { MobileProHomeWidgetTokens } from '../components/mobile-pro/home/widgets/MobileProHomeWidgetTokens';
import { MobileProWidgetNfts } from '../components/mobile-pro/home/widgets/MobileProWidgetNfts';
import { useWalletFilteredNftList } from '../state/nft';
import { KnownNFTDnsCollections } from '../components/nft/NftView';

const IonContentStyled = styled(IonContent)`
    &::part(background) {
        background: transparent;
    }
`;

const PageWrapper = styled.div`
    overflow: auto;
    height: 100%;
`;
const MobileProHomeBalanceStyled = styled(MobileProHomeBalance)`
    margin: 32px 8px 8px;
`;

const MobileProHomeActionsStyled = styled(MobileProHomeActions)`
    margin: 0 16px 24px;
`;

export const mobileProHomePageId = 'mobile-pro-home-page';

export const MobileProHomePage = () => {
    const { data: nfts } = useWalletFilteredNftList();

    const filteredNft = useMemo(
        () =>
            nfts?.filter(
                nft =>
                    !nft.collection?.address ||
                    !KnownNFTDnsCollections.includes(nft.collection.address)
            ),
        [nfts]
    );

    const showNftWidget = filteredNft?.length && filteredNft.length >= 3;

    return (
        <IonPage id={mobileProHomePageId}>
            <IonContentStyled>
                <PageWrapper>
                    <MobileProHomeBalanceStyled />
                    <MobileProHomeActionsStyled />
                    <MobileProHomeWidgetTokens />
                    {showNftWidget && <MobileProWidgetNfts nfts={filteredNft} />}
                </PageWrapper>
            </IonContentStyled>
        </IonPage>
    );
};
