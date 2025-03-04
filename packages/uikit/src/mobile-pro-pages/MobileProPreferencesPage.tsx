import {
    DesktopViewHeader,
    DesktopViewHeaderContent,
    DesktopViewPageLayout
} from '../components/desktop/DesktopViewLayout';
import { PreferencesAsideMenu } from '../components/desktop/aside/PreferencesAsideMenu';
import styled from 'styled-components';
import { useTranslation } from '../hooks/translation';

const PreferencesAsideMenuStyled = styled(PreferencesAsideMenu)`
    width: 100%;
    border-right: none;
    background: ${p => p.theme.backgroundPage};
`;

export const MobileProPreferencesPage = () => {
    const { t } = useTranslation();
    return (
        <DesktopViewPageLayout>
            <DesktopViewHeader backButton={false}>
                <DesktopViewHeaderContent title={t('aside_settings')}></DesktopViewHeaderContent>
            </DesktopViewHeader>
            <PreferencesAsideMenuStyled />
        </DesktopViewPageLayout>
    );
};
