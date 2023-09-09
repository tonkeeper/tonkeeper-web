import * as amplitude from '@amplitude/analytics-browser';
import { AmplitudeAnalyticsContext } from '@tonkeeper/uikit/dist/hooks/amplitude';
import { useContext, useEffect } from 'react';
import ReactGA from 'react-ga4';
import { NotificationData } from './event';

export const useNotificationAnalytics = (item: NotificationData | undefined) => {
    const enable = useContext(AmplitudeAnalyticsContext);

    useEffect(() => {
        if (enable && item != null) {
            if (enable[0] === true) {
                ReactGA.event('Notification', {
                    name: item.kind,
                    origin: item.origin
                });
            }
            if (enable[1] === true) {
                amplitude.track('Notification', {
                    name: item.kind,
                    origin: item.origin
                });
            }
        }
    }, [enable, item]);
};
