import { ConfirmState } from '@tonkeeper/core/dist/entries/pro';

import { createModalControl } from './createModalControl';
import { ProConfirmNotification } from '../desktop/pro/ProConfirmNotification';
import { useAtom } from '../../libs/useAtom';

interface IConfirmAtomParams {
    confirmState: ConfirmState | null;
    onConfirm?: (success?: boolean) => void;
    onCancel?: () => void;
}
const { hook, paramsControl } = createModalControl<IConfirmAtomParams>();

export const useProConfirmNotification = hook;

export const ProConfirmNotificationControlled = () => {
    useProConfirmNotification();
    const [params, setParams] = useAtom(paramsControl);
    const { confirmState, onConfirm, onCancel } = params ?? {};

    return (
        <ProConfirmNotification
            confirmState={confirmState ?? null}
            onConfirm={onConfirm}
            onCancel={onCancel}
            onClose={() => {
                setParams({ ...params, confirmState: null });
            }}
        />
    );
};
