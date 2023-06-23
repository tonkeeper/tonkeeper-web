import * as amplitude from '@amplitude/analytics-browser';
import { AmplitudeAnalyticsContext } from '@tonkeeper/uikit/dist/hooks/amplitude';
import { useContext, useEffect } from 'react';
import { NotificationData } from './event';

export const useNotificationAnalytics = (
  item: NotificationData | undefined
) => {
  const enable = useContext(AmplitudeAnalyticsContext);

  useEffect(() => {
    if (enable !== true && item != null) {
      amplitude.track('Notification', {
        name: item.kind,
        origin: item.origin,
      });
    }
  }, [enable, item]);
};
