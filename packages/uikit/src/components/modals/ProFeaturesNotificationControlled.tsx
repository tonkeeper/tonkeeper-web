import { createModalControl } from './createModalControl';
import { ProFeaturesNotification } from '../desktop/pro/ProFeaturesNotification';
import { useAtomValue } from '../../libs/useAtom';

interface IAtomParams {
    removeButtonsBlock?: boolean;
}
const { hook, paramsControl } = createModalControl<IAtomParams>();

export const useProFeaturesNotification = hook;

export const ProFeaturesNotificationControlled = () => {
    const { isOpen, onClose } = useProFeaturesNotification();
    const onOpenProps = useAtomValue(paramsControl);

    return <ProFeaturesNotification isOpen={isOpen} onClose={onClose} onOpenProps={onOpenProps} />;
};
