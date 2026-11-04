import { FC } from 'react';

import { NEW_HOST, NEW_ORIGIN } from '../config';
import { t } from '../i18n';
import { AppIcon, Layout, PrimaryButton } from './Layout';

/**
 * A Home Screen icon keeps opening this origin however many times it is sent
 * on, and each navigation away leaves the icon's own window, so the only fix is
 * a new icon added from the new origin.
 */
export const HomeScreenMoved: FC = () => (
    <Layout
        icon={<AppIcon />}
        title={t('home_screen_title')}
        description={t('home_screen_description', { host: NEW_HOST })}
        actions={<PrimaryButton href={`${NEW_ORIGIN}/`}>{t('open_new_app')}</PrimaryButton>}
    />
);
