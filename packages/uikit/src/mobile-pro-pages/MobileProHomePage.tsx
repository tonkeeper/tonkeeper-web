import styled from 'styled-components';
import { MobileProHomeBalance } from '../components/mobile-pro/home/MobileProHomeBalance';
import { IonContent, IonPage } from '@ionic/react';
import React from 'react';

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
    margin: 32px 8px;
`;

export const mobileProHomePageId = 'mobile-pro-home-page';

export const MobileProHomePage = () => {
    return (
        <IonPage id={mobileProHomePageId}>
            <IonContentStyled>
                <PageWrapper>
                    <MobileProHomeBalanceStyled />

                    <div>ТУТ КОНТЕНТ ОТ ЛЕШИ</div>
                </PageWrapper>
            </IonContentStyled>
        </IonPage>
    );
};
