import { useTranslation } from '../../hooks/translation';
import { SubHeader } from '../../components/SubHeader';
import { InnerBody } from '../../components/Body';
import { NFTSettingsContent } from '../../components/settings/nft/NFTSettingsContent';

export const NFTSettings = () => {
    const { t } = useTranslation();
    return (
        <>
            <SubHeader title={t('settings_collectibles_list')} />
            <InnerBody>
                <NFTSettingsContent />
            </InnerBody>
        </>
    );
};
