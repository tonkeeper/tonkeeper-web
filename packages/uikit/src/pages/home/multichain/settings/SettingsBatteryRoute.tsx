import { FC, useState } from 'react';

import { Navigate } from '../../../../components/shared/Navigate';
import { useIsOnIosReview } from '../../../../hooks/ios';
import { useNavigate } from '../../../../hooks/router/useNavigate';
import { MultichainRoute } from '../../../../libs/routes';
import { useCanSeeBattery } from '../../../../state/battery';
import { BatteryModal } from '../battery/BatteryModal';
import { MultichainSettingsPage } from './MultichainSettingsPage';

/**
 * `/multichain/settings/battery`: the settings list with the battery sheet
 * open on top, so the settings row and the `tonkeeper://battery` deeplink
 * both land on the same screen. Closing the sheet returns to settings.
 */
export const SettingsBatteryRoute: FC<{ compact?: boolean }> = ({ compact = false }) => {
    const canSeeBattery = useCanSeeBattery();
    const isOnReview = useIsOnIosReview();
    const navigate = useNavigate();
    const [open, setOpen] = useState(true);

    if (!canSeeBattery || isOnReview) {
        return <Navigate to={MultichainRoute.settings} replace />;
    }

    return (
        <>
            <MultichainSettingsPage compact={compact} />
            <BatteryModal
                isOpen={open}
                onClose={() => setOpen(false)}
                afterClose={() => navigate(MultichainRoute.settings, { replace: true })}
                from="settings"
            />
        </>
    );
};
