import { FC, ReactNode, useEffect, useState } from 'react';

import { SubscriptionSource } from '@tonkeeper/core/dist/pro';
import { SubscriptionService } from '@tonkeeper/core/dist/SubscriptionService';
import { ExtensionSubscriptionStrategy } from '@tonkeeper/core/dist/ExtensionSubscriptionStrategy';

import { useAppSdk } from '../../hooks/appSdk';
import { useUserLanguage } from '../../state/language';
import { useProInstallExtensionNotification } from '../modals/ProInstallExtensionNotificationControlled';
import { useProRemoveExtensionNotification } from '../modals/ProRemoveExtensionNotificationControlled';
import { useIsOnIosReview } from '../../hooks/ios';

interface Props {
    children: ReactNode;
}

export const CryptoStrategyInstaller: FC<Props> = ({ children }) => {
    const sdk = useAppSdk();
    const { data: lang } = useUserLanguage();
    const isOnReview = useIsOnIosReview();
    const { onOpen: onProConfirmOpen } = useProInstallExtensionNotification();
    const { onOpen: onRemoveExtensionConfirmOpen } = useProRemoveExtensionNotification();

    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!sdk || lang === undefined) return;

        if (isOnReview) {
            setIsReady(true);

            return;
        }

        if (!sdk.subscriptionService) {
            sdk.subscriptionService = new SubscriptionService(sdk.storage, {
                initialStrategyMap: new Map([
                    [
                        SubscriptionSource.EXTENSION,
                        new ExtensionSubscriptionStrategy({
                            lang,
                            onDataStore: sdk.storage.set,
                            onProConfirmOpen,
                            onRemoveExtensionConfirmOpen
                        })
                    ]
                ])
            });
        }

        if (!sdk.subscriptionService.getStrategy(SubscriptionSource.EXTENSION)) {
            sdk.subscriptionService.addStrategy(
                new ExtensionSubscriptionStrategy({
                    lang,
                    onDataStore: sdk.storage.set,
                    onProConfirmOpen,
                    onRemoveExtensionConfirmOpen
                })
            );
        }

        setIsReady(true);
    }, [sdk, lang, isOnReview]);

    return isReady ? <>{children}</> : null;
};
