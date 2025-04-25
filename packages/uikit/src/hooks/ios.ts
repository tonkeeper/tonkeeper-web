import { useAppContext } from './appContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryKey } from '../libs/queryKey';
import { useAppSdk } from './appSdk';
import { AppKey } from '@tonkeeper/core/dist/Keys';

export function openIosKeyboard(keyboard: string, type = 'text', timerSeconds = 30) {
    const input = document.createElement('input');
    input.setAttribute('type', type);
    input.setAttribute('inputMode', keyboard);
    input.setAttribute('style', 'position: fixed; top: -100px; left: -100px;');
    document.body.appendChild(input);
    input.focus();
    // it's safe to remove the fake input after a 30s timeout
    setTimeout(() => {
        document.body.removeChild(input);
    }, timerSeconds * 1000);
}

export function hideIosKeyboard() {
    const activeElement = document.activeElement;
    if (!activeElement) return;
    if ('blur' in activeElement && typeof activeElement.blur === 'function') {
        activeElement.blur();
    }
}

export const useIsOnIosReviewQuery = () => {
    const { mainnetConfig } = useAppContext();
    const sdk = useAppSdk();

    return useQuery(
        [QueryKey.isOnReview],
        async () => {
            const localFlag =
                (await sdk.storage.get<boolean>(AppKey.ENABLE_REVIEWER_MODE)) === true;
            const remoteFlag = Boolean(mainnetConfig.tablet_enable_additional_security);

            return localFlag || remoteFlag;
        },
        {
            keepPreviousData: true
        }
    );
};

export const useMutateEnableReviewerMode = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error, boolean>(async value => {
        await sdk.storage.set(AppKey.ENABLE_REVIEWER_MODE, value);
        await client.invalidateQueries([QueryKey.isOnReview]);
    });
};

export const useIsOnIosReview = () => {
    const { data } = useIsOnIosReviewQuery();
    if (data === undefined) {
        throw new Error('Missing data');
    }

    return data;
};
