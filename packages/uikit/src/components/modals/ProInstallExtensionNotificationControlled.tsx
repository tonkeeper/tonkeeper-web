import { createModalControl } from './createModalControl';
import { ProInstallExtensionNotification } from '../desktop/pro/ProInstallExtensionNotification';
import { useAtom } from '../../libs/useAtom';
import { SubscriptionExtension } from '@tonkeeper/core/dist/pro';

interface IConfirmAtomParams {
    extensionData?: SubscriptionExtension;
    onConfirm?: (success?: boolean) => void;
    onCancel?: () => void;
}
const { hook, paramsControl } = createModalControl<IConfirmAtomParams>();

export const useProInstallExtensionNotification = hook;

export const ProInstallExtensionNotificationControlled = () => {
    const { isOpen, onClose } = useProInstallExtensionNotification();
    const [params] = useAtom(paramsControl);
    const { onConfirm, onCancel, extensionData } = params ?? {};

    return (
        <ProInstallExtensionNotification
            isOpen={isOpen}
            onConfirm={onConfirm}
            onCancel={onCancel}
            onClose={onClose}
            extensionData={extensionData}
        />
    );
};
