import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FC } from 'react';

import { useAppSdk } from '../../../../hooks/appSdk';
import { useIsOnIosReview } from '../../../../hooks/ios';
import { useNavigate } from '../../../../hooks/router/useNavigate';
import { useTranslation } from '../../../../hooks/translation';
import { useToastMutationError } from '../../../../hooks/useNotification';
import { QueryKey } from '../../../../libs/queryKey';
import { MultichainRoute } from '../../../../libs/routes';
import { Switch } from '../../../../primitives/Switch';
import { ModalCenterError } from '../../../../components/shared/ModalCenterState';
import IcExclamationmarkCircle28 from '../../../../icons/components/IcExclamationmarkCircle28';
import { signTonConnectOver } from '../../../../state/mnemonic';
import {
    useActiveAccount,
    useActiveApi,
    useActiveTonNetwork,
    useActiveWallet
} from '../../../../state/wallet';
import { SettingsListCell, SettingsListGroup } from './SettingsList';
import { SettingsPageLayout } from './SettingsPageLayout';

const useSubscribed = () => {
    const sdk = useAppSdk();
    const wallet = useActiveWallet();
    const network = useActiveTonNetwork();

    return useQuery<boolean, Error>(
        [wallet.id, network, QueryKey.subscribed],
        async () => sdk.notifications!.subscribed(wallet.id),
        { enabled: !!sdk.notifications }
    );
};

const useToggleSubscribe = () => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const account = useActiveAccount();
    const client = useQueryClient();
    const api = useActiveApi();
    const network = useActiveTonNetwork();

    return useMutation<void, Error, boolean>(async checked => {
        const wallet = account.activeTonWallet;
        const { notifications } = sdk;
        if (!notifications) {
            throw new Error('Missing notifications');
        }
        if (checked) {
            await notifications.subscribe(
                api,
                wallet,
                signTonConnectOver({ sdk, accountId: account.id, t })
            );
        } else {
            await notifications.unsubscribe(wallet.rawAddress);
        }

        await client.invalidateQueries([wallet.id, network, QueryKey.subscribed]);
    });
};

/**
 * Presentational part of the notifications settings screen. Exported
 * separately so component tests can mount it without the push-subscription
 * queries behind {@link SettingsNotificationsPage}.
 */
export const SettingsNotificationsView: FC<{
    compact?: boolean;
    subscribed: boolean;
    disabled?: boolean;
    caption?: string;
    onToggle: (checked: boolean) => void;
    onBack: () => void;
}> = ({ compact = false, subscribed, disabled, caption, onToggle, onBack }) => {
    const { t } = useTranslation();

    return (
        <SettingsPageLayout compact={compact} title={t('settings_notifications')} onBack={onBack}>
            <div className="px-4 pb-4">
                <SettingsListGroup>
                    <SettingsListCell
                        title={t('reminder_notifications_title')}
                        subtitle={caption}
                        rightNode={
                            <Switch checked={subscribed} onChange={onToggle} disabled={disabled} />
                        }
                    />
                </SettingsListGroup>
            </div>
        </SettingsPageLayout>
    );
};

export const SettingsNotificationsPage: FC<{ compact?: boolean }> = ({ compact = false }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const navigate = useNavigate();
    const isOnReview = useIsOnIosReview();
    const { data: subscribed, isFetching, isError, refetch } = useSubscribed();
    const { mutate: toggle, isLoading } = useToggleSubscribe();
    const toastError = useToastMutationError();

    const onBack = () => navigate(MultichainRoute.settings);

    if (!sdk.notifications) {
        return (
            <SettingsPageLayout
                compact={compact}
                title={t('settings_notifications')}
                onBack={onBack}
            >
                {null}
            </SettingsPageLayout>
        );
    }

    // An unreadable subscription state must not render as "off" — the user
    // would flip a toggle that never reflected reality.
    if (subscribed === undefined && isError) {
        return (
            <SettingsPageLayout
                compact={compact}
                title={t('settings_notifications')}
                onBack={onBack}
            >
                <div className="px-4 pb-4 pt-16">
                    <ModalCenterError
                        icon={<IcExclamationmarkCircle28 />}
                        onRetry={() => refetch()}
                    />
                </div>
            </SettingsPageLayout>
        );
    }

    return (
        <SettingsNotificationsView
            compact={compact}
            subscribed={!!subscribed}
            disabled={isFetching || isLoading}
            caption={isOnReview ? undefined : t('reminder_notifications_caption')}
            onToggle={checked => toggle(checked, { onError: toastError })}
            onBack={onBack}
        />
    );
};
