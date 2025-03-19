import {
    DesktopViewHeader,
    DesktopViewHeaderContent,
    DesktopViewPageLayout
} from '../components/desktop/DesktopViewLayout';
import { PreferencesAsideMenu } from '../components/desktop/aside/PreferencesAsideMenu';
import styled from 'styled-components';
import { useTranslation } from '../hooks/translation';
import { IconButtonTransparentBackground } from '../components/fields/IconButton';
import { CloseIcon } from '../components/Icon';
import { FC } from 'react';

const PreferencesAsideMenuStyled = styled(PreferencesAsideMenu)`
    width: 100%;
    border-right: none;
    background: ${p => p.theme.backgroundPage};
`;

export const MobileProPreferencesPage: FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t } = useTranslation();
    return (
        <DesktopViewPageLayout>
            <DesktopViewHeader backButton={false}>
                <DesktopViewHeaderContent
                    title={t('aside_settings')}
                    right={
                        <IconButtonTransparentBackground onClick={onClose}>
                            <CloseIcon />
                        </IconButtonTransparentBackground>
                    }
                ></DesktopViewHeaderContent>
            </DesktopViewHeader>
            <PreferencesAsideMenuStyled />
        </DesktopViewPageLayout>
    );
};
