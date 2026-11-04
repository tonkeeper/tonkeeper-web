import { FC } from 'react';

import { useAppSdk } from '../../../../hooks/appSdk';
import { useIsOnIosReview } from '../../../../hooks/ios';
import { useNavigate } from '../../../../hooks/router/useNavigate';
import { useTranslation } from '../../../../hooks/translation';
import { MultichainRoute } from '../../../../libs/routes';
import { useLegalLinks } from '../../../../state/legal';
import { SettingsListCell, SettingsListGroup } from './SettingsList';
import { SettingsPageLayout } from './SettingsPageLayout';

/**
 * Legal documents screen: terms of service and privacy policy plus the
 * licenses section. The terms row is hidden while the iOS build is in
 * review, matching the legacy screen.
 */
export const SettingsLegalPage: FC<{ compact?: boolean }> = ({ compact = false }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const navigate = useNavigate();
    const isOnReview = useIsOnIosReview();
    const { termsLink, privacyLink } = useLegalLinks();

    return (
        <SettingsPageLayout
            compact={compact}
            title={t('legal_header_title')}
            onBack={() => navigate(MultichainRoute.settings)}
        >
            <div className="px-4 pb-4">
                <SettingsListGroup>
                    {!isOnReview && (
                        <SettingsListCell
                            title={t('legal_terms')}
                            chevron
                            onClick={() => sdk.openPage(termsLink)}
                        />
                    )}
                    <SettingsListCell
                        title={t('legal_privacy')}
                        chevron
                        onClick={() => sdk.openPage(privacyLink)}
                    />
                </SettingsListGroup>
            </div>
        </SettingsPageLayout>
    );
};
