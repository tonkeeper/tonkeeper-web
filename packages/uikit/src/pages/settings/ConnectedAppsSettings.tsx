import { SubHeader } from '../../components/SubHeader';
import { InnerBody } from '../../components/Body';
import React from 'react';
import { useTranslation } from '../../hooks/translation';
import { styled } from 'styled-components';
import { ConnectedAppsList } from '../../components/connected-apps/ConnectedAppsList';

const InnerBodyStyled = styled(InnerBody)`
    display: flex;
    flex-direction: column;
`;

export const ConnectedAppsSettings = () => {
    const { t } = useTranslation();
    return (
        <>
            <SubHeader title={'Apps'} />
            <InnerBodyStyled>
                <ConnectedAppsList />
            </InnerBodyStyled>
        </>
    );
};
