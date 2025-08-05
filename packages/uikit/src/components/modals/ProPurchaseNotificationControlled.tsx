import { createModalControl } from './createModalControl';
import { ProPurchaseNotification } from '../desktop/pro/ProPurchaseNotification';

const { hook } = createModalControl();

export const useProPurchaseNotification = hook;

export const ProPurchaseNotificationControlled = () => {
    const { isOpen, onClose } = useProPurchaseNotification();

    return <ProPurchaseNotification isOpen={isOpen} onClose={onClose} />;
};
