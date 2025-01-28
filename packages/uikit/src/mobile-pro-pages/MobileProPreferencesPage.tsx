import { DesktopViewPageLayout } from '../components/desktop/DesktopViewLayout';
import { PreferencesAsideMenu } from '../components/desktop/aside/PreferencesAsideMenu';
import styled from 'styled-components';

const PreferencesAsideMenuStyled = styled(PreferencesAsideMenu)`
    width: 100%;
    height: 100%;
    border-right: none;
    background: ${p => p.theme.backgroundPage};
`;

export const MobileProPreferencesPage = () => {
    return (
        <DesktopViewPageLayout>
            <PreferencesAsideMenuStyled />
        </DesktopViewPageLayout>
    );
};
