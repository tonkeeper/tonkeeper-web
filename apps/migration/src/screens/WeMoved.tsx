import { FC } from 'react';

import { NEW_HOST, NEW_ORIGIN } from '../config';
import { t } from '../i18n';
import { MANUAL_RECOVERY_PATH, moveOfferUrl } from '../routing';
import { readLanguage, readStorageSnapshot } from '../storage';
import {
    AppIcon,
    Emphasis,
    Layout,
    PrimaryButton,
    SecondaryButton,
    TextLink,
    Trans
} from './Layout';

/**
 * What someone with wallet data still on this origin sees when they open it
 * directly. "Move my wallets" lands on the new origin's offer to move them,
 * which opens this origin in a popup to approve the handoff.
 *
 * The way out below it is the one thing only this origin can offer: the secrets
 * are here, so it can read them back to their owner. It is left out for a
 * profile of watch-only and hardware accounts, which have nothing to read.
 *
 * Launched from a Home Screen icon, it also says how to replace the icon, which
 * keeps opening this origin after the move.
 */
export const WeMoved: FC<{ canRecoverManually: boolean; isHomeScreenApp: boolean }> = ({
    canRecoverManually,
    isHomeScreenApp
}) => (
    <Layout
        icon={<AppIcon />}
        title={t('moved_title')}
        subtitle={<Trans k="moved_new_address" parts={{ host: <Emphasis>{NEW_HOST}</Emphasis> }} />}
        description={t('moved_description')}
        actions={
            <>
                <PrimaryButton href={moveOfferUrl(NEW_ORIGIN, readLanguage(readStorageSnapshot()))}>
                    {t('moved_move_my_wallets')}
                </PrimaryButton>
                <SecondaryButton href={`${NEW_ORIGIN}/`}>
                    {t('moved_just_open_new_app')}
                </SecondaryButton>
                {canRecoverManually && (
                    <TextLink href={MANUAL_RECOVERY_PATH}>{t('manual_recovery_link')}</TextLink>
                )}
            </>
        }
    >
        {isHomeScreenApp && (
            <p className="break-words px-8 pb-4 text-center text-body2 text-textTertiary">
                {t('moved_home_screen_hint', { host: NEW_HOST })}
            </p>
        )}
    </Layout>
);
