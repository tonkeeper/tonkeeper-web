import { createModalControl } from './createModalControl';
import { FeatureSlideNames } from '../../enums/pro';
import { ProFeaturesNotification } from '../desktop/pro/ProFeaturesNotification';
import { useAtomValue } from '../../libs/useAtom';

interface IAtomParams {
    initialSlideName?: FeatureSlideNames;
}
const { hook, paramsControl } = createModalControl<IAtomParams>();

export const useProFeaturesNotification = hook;

export const ProFeaturesNotificationControlled = () => {
    const { isOpen, onClose } = useProFeaturesNotification();
    const { initialSlideName } = useAtomValue(paramsControl) ?? {};

    return (
        <ProFeaturesNotification
            isOpen={isOpen}
            onClose={onClose}
            initialSlideName={initialSlideName}
        />
    );
};
