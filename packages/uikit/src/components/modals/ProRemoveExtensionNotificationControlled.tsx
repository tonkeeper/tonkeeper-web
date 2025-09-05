import { useAtom } from '../../libs/useAtom';
import { createModalControl } from './createModalControl';
import { ProRemoveExtensionNotification } from '../desktop/pro/ProRemoveExtensionNotification';

interface IConfirmAtomParams {
    extensionContract?: string;
    onConfirm?: (success?: boolean) => void;
    onCancel?: () => void;
}
const { hook, paramsControl } = createModalControl<IConfirmAtomParams>();

export const useProRemoveExtensionNotification = hook;

export const ProRemoveExtensionNotificationControlled = () => {
    const { isOpen, onClose } = useProRemoveExtensionNotification();
    const [params] = useAtom(paramsControl);
    const { onConfirm, onCancel, extensionContract } = params ?? {};

    return (
        <ProRemoveExtensionNotification
            isOpen={isOpen}
            onConfirm={onConfirm}
            onCancel={onCancel}
            onClose={onClose}
            extensionContract={extensionContract}
        />
    );
};
