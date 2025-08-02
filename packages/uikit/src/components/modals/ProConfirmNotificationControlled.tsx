import { ConfirmState } from '@tonkeeper/core/dist/entries/pro';

import { createModalControl } from './createModalControl';
import { ProConfirmNotification } from '../desktop/pro/ProConfirmNotification';
import { useAtom } from '../../libs/useAtom';

interface IConfirmAtomParams {
    confirmState: ConfirmState | null;
    onConfirm?: (success?: boolean) => void;
}
const { hook, paramsControl } = createModalControl<IConfirmAtomParams>();

export const useProConfirmNotification = hook;

export const ProConfirmNotificationControlled = () => {
    useProConfirmNotification();
    const [params, setParams] = useAtom(paramsControl);
    const { confirmState, onConfirm } = params ?? {};

    return (
        <ProConfirmNotification
            confirmState={confirmState ?? null}
            onConfirm={onConfirm}
            onClose={() => {
                onConfirm?.(false);
                setParams({ ...params, confirmState: null });
            }}
        />
    );
};
