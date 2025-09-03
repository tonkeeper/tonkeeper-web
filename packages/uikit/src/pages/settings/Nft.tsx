import { useTranslation } from '../../hooks/translation';
import { SubHeader } from '../../components/SubHeader';
import { InnerBody } from '../../components/Body';
import { NFTSettingsContent } from '../../components/settings/nft/NFTSettingsContent';
import { Navigate } from '../../components/shared/Navigate';
import { AppRoute } from '../../libs/routes';
import { FLAGGED_FEATURE, useIsFeatureEnabled } from '../../state/tonendpoint';

export const NFTSettings = () => {
    const { t } = useTranslation();

    const isNftEnabled = useIsFeatureEnabled(FLAGGED_FEATURE.NFT);

    if (!isNftEnabled) {
        return <Navigate to={AppRoute.home} />;
    }

    return (
        <>
            <SubHeader title={t('settings_collectibles_list')} />
            <InnerBody>
                <NFTSettingsContent />
            </InnerBody>
        </>
    );
};
