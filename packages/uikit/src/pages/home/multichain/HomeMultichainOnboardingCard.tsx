import { FC } from 'react';
import { useTranslation } from '../../../hooks/translation';
import { Link } from '../../../primitives';

/**
 * Empty-wallet onboarding card rendered when the multichain total fiat
 * balance is zero. Structural for phase 1 — the "Start Now" CTA links
 * to the actual onboarding checklist in a follow-up.
 */
export const HomeMultichainOnboardingCard: FC = () => {
    const { t } = useTranslation();
    return (
        <div className="mx-4 mb-4 flex items-center gap-3 overflow-hidden rounded-medium bg-backgroundContent px-4 py-3">
            <div className="min-w-0 flex-1">
                <div className="truncate text-label2 text-textPrimary">
                    {t('wallet_onboarding_card_title')}
                </div>
                <div className="truncate text-body3 text-textSecondary">
                    {t('wallet_onboarding_card_subtitle')}
                </div>
                <Link
                    className="mt-1 text-body3 text-accentBlue transition-opacity hover:opacity-80"
                    onClick={() => {
                        /* Hook up onboarding checklist in a follow-up */
                    }}
                >
                    {t('wallet_onboarding_card_cta')}
                </Link>
            </div>
            <div
                aria-hidden="true"
                className="h-16 w-16 shrink-0 rounded-full bg-gradient-to-br from-accentBlue/40 to-buttonTertiaryBackground"
            />
        </div>
    );
};
