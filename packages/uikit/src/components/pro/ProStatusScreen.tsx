import { isIosStrategy } from '@tonkeeper/core/dist/entries/pro';

import { Label2 } from '../Text';
import { SlidersIcon } from '../Icon';
import { Button } from '../fields/Button';
import { useAppSdk } from '../../hooks/appSdk';
import { ProActiveWallet } from './ProActiveWallet';
import { ProFeaturesList } from './ProFeaturesList';
import { useToast } from '../../hooks/useNotification';
import { useTranslation } from '../../hooks/translation';
import { useDisclosure } from '../../hooks/useDisclosure';
import { ProStatusDetailsList } from './ProStatusDetailsList';
import { ProSubscriptionHeader } from './ProSubscriptionHeader';
import { ProScreenContentWrapper } from './ProScreenContentWrapper';

// TODO Implement different strategies rendering
export const ProStatusScreen = () => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const toast = useToast();

    const { isOpen: isLoading, onOpen: setLoading, onClose: removeLoading } = useDisclosure(false);

    const isIos = isIosStrategy(sdk.subscriptionStrategy);

    const handleManageClick = () => {
        if (!sdk || !isIosStrategy(sdk.subscriptionStrategy)) return;

        setLoading();
        sdk.subscriptionStrategy
            .manageSubscriptions()
            .catch(() => {
                toast(t('failed_to_manage'));
            })
            .finally(() => {
                removeLoading();
            });
    };

    return (
        <ProScreenContentWrapper>
            <ProSubscriptionHeader
                titleKey="tonkeeper_pro_is_active"
                subtitleKey="subscription_is_linked"
            />
            <ProActiveWallet />
            <ProStatusDetailsList />
            {isIos && (
                <Button secondary fullWidth onClick={handleManageClick} loading={isLoading}>
                    <SlidersIcon />
                    <Label2>{t('Manage')}</Label2>
                </Button>
            )}
            <ProFeaturesList />
        </ProScreenContentWrapper>
    );
};
