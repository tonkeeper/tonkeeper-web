import { FC, useRef } from 'react';

import { useAppSdk } from '../../../../hooks/appSdk';
import { useNavigate } from '../../../../hooks/router/useNavigate';
import { useTranslation } from '../../../../hooks/translation';
import { MultichainRoute, MultichainSettingsRoute } from '../../../../libs/routes';
import IcLogo from '../../../../icons/components/IcLogo';

const DEV_MENU_TAPS = 6;
const TAP_WINDOW_MS = 300;

/**
 * Version block at the bottom of the settings screen. Tapping the logo
 * six times in quick succession opens the hidden dev menu; tapping the
 * version copies it.
 */
export const SettingsVersionFooter: FC = () => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const navigate = useNavigate();
    const taps = useRef<{ count: number; timer: ReturnType<typeof setTimeout> | undefined }>({
        count: 0,
        timer: undefined
    });

    const onLogoClick = () => {
        clearTimeout(taps.current.timer);
        taps.current.count += 1;
        taps.current.timer = setTimeout(() => {
            taps.current.count = 0;
        }, TAP_WINDOW_MS);
        if (taps.current.count === DEV_MENU_TAPS) {
            navigate(MultichainRoute.settings + MultichainSettingsRoute.dev);
        }
    };

    return (
        <div className="flex select-none flex-col items-center px-4 pb-4 pt-4">
            <button
                type="button"
                onClick={onLogoClick}
                aria-label="Keeper"
                className="cursor-pointer"
            >
                <IcLogo className="size-8 text-iconPrimary" />
            </button>
            <div className="mt-2 text-label2 text-textPrimary">Keeper</div>
            <button
                type="button"
                className="cursor-pointer text-body3 text-textSecondary transition-colors duration-100 hover:text-textPrimary"
                onClick={() => sdk.copyToClipboard(sdk.version, t('App_version_copied'))}
            >
                {t('settings_version')} {sdk.version}
            </button>
        </div>
    );
};
