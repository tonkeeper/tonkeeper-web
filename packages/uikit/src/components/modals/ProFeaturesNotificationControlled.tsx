import { createModalControl } from './createModalControl';
import { PurchaseSubscriptionScreens } from '../../enums/pro';
import { ProFeaturesNotification } from '../desktop/pro/ProFeaturesNotification';

interface IAtomParams {
    initialScreen?: PurchaseSubscriptionScreens;
}
const { hook } = createModalControl<IAtomParams>();

export const useProFeaturesNotification = hook;

export const ProFeaturesNotificationControlled = () => {
    const { isOpen, onClose } = useProFeaturesNotification();

    return <ProFeaturesNotification isOpen={isOpen} onClose={onClose} />;
};
