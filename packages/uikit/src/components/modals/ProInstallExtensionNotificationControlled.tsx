import { createModalControl } from './createModalControl';
import { ProInstallExtensionNotification } from '../desktop/pro/ProInstallExtensionNotification';
import { useAtom } from '../../libs/useAtom';
import { SubscriptionExtension } from '@tonkeeper/core/dist/pro';

interface IConfirmAtomParams {
    extensionData?: SubscriptionExtension;
    onConfirm?: (success?: boolean) => void;
}
const { hook, paramsControl } = createModalControl<IConfirmAtomParams>();

export const useProInstallExtensionNotification = hook;

export const ProInstallExtensionNotificationControlled = () => {
    const { isOpen, onClose } = useProInstallExtensionNotification();
    const [params] = useAtom(paramsControl);
    const { onConfirm, extensionData } = params ?? {};

    const handleClose = (confirm?: boolean) => {
        if (!isOpen) return;

        onConfirm?.(confirm);
        onClose();
    };

    return (
        <ProInstallExtensionNotification
            isOpen={isOpen}
            onClose={handleClose}
            extensionData={extensionData}
        />
    );
};
