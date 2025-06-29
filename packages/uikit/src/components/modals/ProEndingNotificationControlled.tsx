import { createModalControl } from './createModalControl';
import { ProEndingNotification } from '../desktop/pro/ProEndingNotification';

const { hook } = createModalControl();

export const useProEndingNotification = hook;

export const ProEndingNotificationControlled = () => {
    const { isOpen, onClose } = useProEndingNotification();

    return <ProEndingNotification isOpen={isOpen} onClose={onClose} />;
};
