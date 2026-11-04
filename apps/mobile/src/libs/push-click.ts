import { useEffect } from 'react';
import { ActionPerformed, PushNotifications } from '@capacitor/push-notifications';
import { useAnalyticsTrack } from '@tonkeeper/uikit/dist/hooks/analytics';
import { useAppContext } from '@tonkeeper/uikit/dist/hooks/appContext';

type PushClick = { push_id?: string; deep_link?: string };

const PRIVATE_DATA = /[a-fA-F0-9]{64}|0:[a-fA-F0-9]{64}/g;

const stringField = (data: Record<string, unknown>, key: string) => {
    const value = data[key];
    return typeof value === 'string' && value.trim() ? value : undefined;
};

/**
 * Reads the payload keys the native apps read. A transaction push (`event_id`)
 * carries no link to report.
 */
const toPushClick = ({ notification }: ActionPerformed): PushClick => {
    const data: Record<string, unknown> =
        notification.data && typeof notification.data === 'object' ? notification.data : {};
    const push_id = stringField(data, 'push_id');
    if (stringField(data, 'event_id')) return { push_id };

    const link =
        stringField(data, 'link') ?? stringField(data, 'dapp_url') ?? stringField(data, 'deeplink');
    return { push_id, deep_link: link?.replace(PRIVATE_DATA, 'X') };
};

const pendingClicks: PushClick[] = [];
let deliverClick: ((click: PushClick) => void) | undefined;
let listening = false;

/**
 * Registered at boot rather than from the tracking hook: the plugin holds a
 * cold-start tap only until the first listener consumes it, and the tracker
 * resolves well after that — so taps are queued here until it does.
 */
export const listenForPushClicks = () => {
    if (listening) return;
    listening = true;

    PushNotifications.addListener('pushNotificationActionPerformed', action => {
        const click = toPushClick(action);
        if (deliverClick) deliverClick(click);
        else pendingClicks.push(click);
    }).catch(() => undefined);
};

export const useTrackPushClick = () => {
    const { tracker } = useAppContext();
    const track = useAnalyticsTrack();

    useEffect(() => {
        if (!tracker) return;

        deliverClick = click =>
            track({ eventName: 'push_click', push_id: click.push_id, deep_link: click.deep_link });
        pendingClicks.splice(0).forEach(deliverClick);

        return () => {
            deliverClick = undefined;
        };
    }, [tracker, track]);
};
