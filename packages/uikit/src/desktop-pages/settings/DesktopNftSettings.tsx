import {
    DesktopViewHeader,
  DesktopViewHeaderContent,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
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
                <DesktopViewHeaderContent title={t('settings_collectibles_list')} />
            </DesktopViewHeader>
            <ContentWrapper>
                <NFTSettingsContent />
            </ContentWrapper>
        </DesktopViewPageLayout>
    );
};
