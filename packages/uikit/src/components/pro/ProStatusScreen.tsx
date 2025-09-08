import { useProState } from '../../state/pro';
import { useNavigate } from '../../hooks/router/useNavigate';
import { useEffect } from 'react';
import { AppRoute } from '../../libs/routes';
import { SubscriptionSource } from '@tonkeeper/core/dist/pro';
import { IosStatusScreenState } from './IosStatusScreenState';
import { CryptoStatusScreenState } from './CryptoStatusScreenState';
import { TelegramStatusScreenState } from './TelegramStatusScreenState';
import { ExtensionStatusScreenState } from './ExtensionStatusScreenState';

export const ProStatusScreen = () => {
    const navigate = useNavigate();
    const { data: subscription, isLoading: isProStateLoading } = useProState();

    useEffect(() => {
        if (!subscription && !isProStateLoading) {
            navigate(AppRoute.home);
        }
    }, [subscription, isProStateLoading]);

    if (!subscription) return null;

    if (subscription.source === SubscriptionSource.IOS) {
        return <IosStatusScreenState subscription={subscription} />;
    }

    if (subscription.source === SubscriptionSource.CRYPTO) {
        return <CryptoStatusScreenState subscription={subscription} />;
    }

    if (subscription.source === SubscriptionSource.TELEGRAM) {
        return <TelegramStatusScreenState subscription={subscription} />;
    }

    if (subscription.source === SubscriptionSource.EXTENSION) {
        return <ExtensionStatusScreenState subscription={subscription} />;
    }

    return null;
};
