import {
    DesktopViewHeader,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { Label2 } from '../../components/Text';
import { styled } from 'styled-components';

import { useTranslation } from '../../hooks/translation';
import { NFTSettingsContent } from '../../components/settings/nft/NFTSettingsContent';

const ContentWrapper = styled.div`
    padding: 0 1rem;
`;

export const DesktopNftSettings = () => {
    const { t } = useTranslation();

    return (
        <DesktopViewPageLayout>
            <DesktopViewHeader backButton>
                <Label2>{t('settings_collectibles_list')}</Label2>
            </DesktopViewHeader>
            <ContentWrapper>
                <NFTSettingsContent />
            </ContentWrapper>
        </DesktopViewPageLayout>
    );
};
