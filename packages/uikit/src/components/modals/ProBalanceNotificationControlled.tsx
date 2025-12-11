import { createModalControl } from './createModalControl';
import { ProBalanceNotification } from '../desktop/pro/ProBalanceNotification';

const { hook } = createModalControl();

export const useProBalanceNotification = hook;

export const ProBalanceNotificationControlled = () => {
    const { isOpen, onClose } = useProBalanceNotification();

    return <ProBalanceNotification isOpen={isOpen} onClose={onClose} />;
};
