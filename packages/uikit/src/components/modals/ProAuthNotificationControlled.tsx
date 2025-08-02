import { createModalControl } from './createModalControl';
import { ProAuthNotification } from '../desktop/pro/ProAuthNotification';

const { hook } = createModalControl();

export const useProAuthNotification = hook;

export const ProAuthNotificationControlled = () => {
    const { isOpen, onClose } = useProAuthNotification();

    return <ProAuthNotification isOpen={isOpen} onClose={onClose} />;
};
