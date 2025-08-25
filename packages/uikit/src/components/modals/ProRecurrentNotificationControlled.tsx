import { createModalControl } from './createModalControl';
import { ProRecurrentNotification } from '../desktop/pro/ProRecurrentNotification';

interface IAtomParams {
    removeButtonsBlock?: boolean;
}
const { hook } = createModalControl<IAtomParams>();

export const useProRecurrentNotification = hook;

export const ProRecurrentNotificationControlled = () => {
    const { isOpen, onClose } = useProRecurrentNotification();

    return <ProRecurrentNotification isOpen={isOpen} onClose={onClose} />;
};
