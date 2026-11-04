import { FC } from 'react';

import { useTranslation } from '@tonkeeper/uikit/dist/hooks/translation';

import { MIGRATE_ROUTE, OLD_HOST } from './config';

/**
 * Way in for someone whose wallets are still on the previous origin — the
 * manual counterpart to the check that runs at boot, and where declining the
 * move lands you. It stays on the start screen for as long as the old origin
 * answers handoffs.
 *
 * It leads to the move offer on `/migrate`, whose button opens the old origin
 * as a popup. The popup needs a click of its own on that page, so this is a
 * plain link rather than something that tries to open it from here, and
 * nothing on either side can block a retry.
 */
export const OldOriginEntry: FC = () => {
    const { t } = useTranslation();

    return (
        <a
            href={MIGRATE_ROUTE}
            className="cursor-pointer px-4 pt-2 text-center text-body1 text-textAccent transition-opacity hover:opacity-80"
        >
            {t('domain_move_old_origin_entry', { host: OLD_HOST })}
        </a>
    );
};
