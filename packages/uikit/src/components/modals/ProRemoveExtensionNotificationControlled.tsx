import { IExtensionActiveSubscription } from '@tonkeeper/core/dist/entries/pro';

import { useAtom } from '../../libs/useAtom';
import { createModalControl } from './createModalControl';
import { ProRemoveExtensionNotification } from '../desktop/pro/ProRemoveExtensionNotification';

interface IConfirmAtomParams {
    subscription: IExtensionActiveSubscription;
    onConfirm?: (success?: boolean) => void;
    onCancel?: () => void;
}
const { hook, paramsControl } = createModalControl<IConfirmAtomParams>();

export const useProRemoveExtensionNotification = hook;

export const ProRemoveExtensionNotificationControlled = () => {
    const { isOpen, onClose } = useProRemoveExtensionNotification();
    const [params] = useAtom(paramsControl);
    const { onConfirm, onCancel, subscription } = params ?? {};

    return (
        <ProRemoveExtensionNotification
            isOpen={isOpen}
            onConfirm={onConfirm}
            onCancel={onCancel}
            onClose={onClose}
            subscription={subscription}
        />
    );
};
