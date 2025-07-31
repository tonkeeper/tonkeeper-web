import { createModalControl } from './createModalControl';
import { ProConfirmNotification } from '../desktop/pro/ProConfirmNotification';
import { useAtom } from '../../libs/useAtom';
import { ConfirmState } from '../../state/pro';

interface IAtomParams {
    confirmState: ConfirmState | null;
    onConfirm?: (success?: boolean) => void;
}
const { hook, paramsControl } = createModalControl<IAtomParams>();

export const useProConfirmNotification = hook;

export const ProConfirmNotificationControlled = () => {
    useProConfirmNotification();
    const [params, setParams] = useAtom(paramsControl);
    const { confirmState, onConfirm } = params ?? {};

    return (
        <ProConfirmNotification
            confirmState={confirmState ?? null}
            onConfirm={onConfirm}
            onClose={() => setParams({ ...params, confirmState: null })}
        />
    );
};
