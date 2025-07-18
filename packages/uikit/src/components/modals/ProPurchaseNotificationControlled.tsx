import { createModalControl } from './createModalControl';
import { ProPurchaseNotification } from '../desktop/pro/ProPurchaseNotification';
import { useAtomValue } from '../../libs/useAtom';
import { PurchaseSubscriptionScreens } from '../../enums/pro';

interface IAtomParams {
    initialScreen?: PurchaseSubscriptionScreens;
}
const { hook, paramsControl } = createModalControl<IAtomParams>();
const useProPurchaseNotificationParams = () => useAtomValue(paramsControl);

export const useProPurchaseNotification = hook;

export const ProPurchaseNotificationControlled = () => {
    const { isOpen, onClose } = useProPurchaseNotification();
    const params = useProPurchaseNotificationParams();

    return (
        <ProPurchaseNotification
            isOpen={isOpen}
            onClose={onClose}
            initialScreen={params?.initialScreen}
        />
    );
};
