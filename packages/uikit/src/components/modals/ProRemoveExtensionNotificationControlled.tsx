import { SubscriptionExtension } from '@tonkeeper/core/dist/pro';

import { useAtom } from '../../libs/useAtom';
import { createModalControl } from './createModalControl';
import { ProRemoveExtensionNotification } from '../desktop/pro/ProRemoveExtensionNotification';

interface IConfirmAtomParams {
    extensionData?: SubscriptionExtension;
    onConfirm?: (success?: boolean) => void;
    onCancel?: () => void;
}
const { hook, paramsControl } = createModalControl<IConfirmAtomParams>();

export const useProRemoveExtensionNotification = hook;

export const ProRemoveExtensionNotificationControlled = () => {
    const { isOpen, onClose } = useProRemoveExtensionNotification();
    const [params] = useAtom(paramsControl);
    const { onConfirm, onCancel, extensionData } = params ?? {};

    return (
        <ProRemoveExtensionNotification
            isOpen={isOpen}
            onConfirm={onConfirm}
            onCancel={onCancel}
            onClose={onClose}
            extensionData={extensionData}
        />
    );
};
