import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { useAppSdk } from '../hooks/appSdk';
import { QueryKey } from '../libs/queryKey';
import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { useTranslation } from '../hooks/translation';

export const useLookScreen = () => {
    const sdk = useAppSdk();
    return useQuery([QueryKey.lock], async () => {
        const lock = await sdk.storage.get<boolean>(AppKey.LOCK);
        return lock ?? false;
    });
};

export const useMutateLookScreen = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error, boolean>(async value => {
        await sdk.storage.set(AppKey.LOCK, value);
        await client.invalidateQueries([QueryKey.lock]);
    });
};

export const useCanPromptTouchId = () => {
    const sdk = useAppSdk();
    return useQuery([QueryKey.canPromptTouchId], async () => {
        return sdk.touchId?.canPrompt();
    });
};

export const useTouchIdEnabled = () => {
    const sdk = useAppSdk();
    return useQuery([QueryKey.touchId], async () => {
        return isTouchIdEnabled(sdk);
    });
};

const isTouchIdEnabled = async (sdk: IAppSdk): Promise<boolean> => {
    const canPrompt = await sdk.touchId?.canPrompt();
    if (!canPrompt) {
        return false;
    }

    const touchId = await sdk.storage.get<boolean>(AppKey.TOUCH_ID);

    return touchId ?? true;
};

export const useMutateTouchId = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error, boolean>(async value => {
        await sdk.storage.set(AppKey.TOUCH_ID, value);
        await client.invalidateQueries([QueryKey.touchId]);
    });
};

export const useCheckTouchId = () => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    return useMutation(async () => {
        const touchId = await isTouchIdEnabled(sdk);
        if (touchId) {
            await sdk.touchId?.prompt(lng =>
                (t as (val: string, options?: { lng?: string }) => string)(
                    'touch_id_unlock_wallet',
                    { lng }
                )
            );
        }
    });
};
