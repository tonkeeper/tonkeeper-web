import {
    DesktopViewHeader,
    DesktopViewHeaderContent,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { styled } from 'styled-components';

import { useTranslation } from '../../hooks/translation';
import { NFTSettingsContent } from '../../components/settings/nft/NFTSettingsContent';
import { FLAGGED_FEATURE, useIsFeatureEnabled } from '../../state/tonendpoint';
import { AppRoute } from '../../libs/routes';
import { Navigate } from '../../components/shared/Navigate';

const ContentWrapper = styled.div`
    padding: 0 1rem;
`;

export const DesktopNftSettings = () => {
    const { t } = useTranslation();

    const isNftEnabled = useIsFeatureEnabled(FLAGGED_FEATURE.NFT);
    if (!isNftEnabled) {
        return <Navigate to={AppRoute.home} />;
    }

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
