import { createModalControl } from './createModalControl';
import { ProFeaturesNotification } from '../desktop/pro/ProFeaturesNotification';

const { hook } = createModalControl();

export const useProFeaturesNotification = hook;

export const ProFeaturesNotificationControlled = () => {
    const { isOpen, onClose } = useProFeaturesNotification();

    return <ProFeaturesNotification isOpen={isOpen} onClose={onClose} />;
};
