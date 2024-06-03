import {
    DesktopViewHeader,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { Label2 } from '../../components/Text';
import { ConnectedAppsList } from '../../components/connected-apps/ConnectedAppsList';
import { styled } from 'styled-components';

const DesktopViewPageLayoutStyled = styled(DesktopViewPageLayout)`
    display: flex;
    flex-direction: column;
    height: 100%;
`;

const ConnectedAppsListStyled = styled(ConnectedAppsList)`
    flex: 1;
`;

export const ConnectedAppsSettingsDesktop = () => {
    return (
        <DesktopViewPageLayoutStyled>
            <DesktopViewHeader backButton>
                <Label2>Connected Apps</Label2>
            </DesktopViewHeader>
            <ConnectedAppsListStyled />
        </DesktopViewPageLayoutStyled>
    );
};
