import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { useAppSdk, useAppTargetEnv } from '../hooks/appSdk';
import { QueryKey } from '../libs/queryKey';
import { useTranslation } from '../hooks/translation';
import {
    GlobalPreferences,
    hashAdditionalSecurityPassword,
    useGlobalPreferences
} from './global-preferences';
import { usePromptDesktopPassword } from '../components/modals/PromptDesktopPassword';
import { usePromptMobileProPin } from '../components/modals/PromptMobileProPin';

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

export const useSecuritySettings = () => {
    const globalPreferences = useGlobalPreferences();
    return globalPreferences.security;
};

export const useMutateSecuritySettings = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();

    return useMutation(async (settings: Partial<GlobalPreferences['security'] | null>) => {
        const current = await sdk.storage.get<GlobalPreferences>(AppKey.GLOBAL_PREFERENCES_CONFIG);
        await sdk.storage.set(AppKey.GLOBAL_PREFERENCES_CONFIG, {
            ...current,
            security: settings === null ? {} : { ...current?.security, ...settings }
        });
        await client.invalidateQueries([QueryKey.globalPreferencesConfig]);
    });
};

export const useMutateTouchId = ({ skipPasswordCheck }: { skipPasswordCheck?: boolean } = {}) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const { mutateAsync } = useMutateSecuritySettings();
    const { mutateAsync: checkPassword } = useCheckAdditionalSecurityPassword();

    return useMutation<void, Error, boolean>(async value => {
        if (!skipPasswordCheck) {
            await checkPassword();
        }

        if (!value) {
            return mutateAsync({ biometrics: false });
        }

        await sdk.touchId?.prompt(lng => t('touch_id_unlock_wallet', { lng }));
        await mutateAsync({ biometrics: true });
    });
};

export const useSecurityCheck = () => {
    const securitySettings = useSecuritySettings();
    const checkPassword = useCheckAdditionalSecurityPassword();
    const checkTouchId = useCheckTouchId();

    const checkTouchIdWithFallback = useMutation(async () => {
        try {
            await checkTouchId.mutateAsync();
        } catch (e) {
            await checkPassword.mutateAsync();
        }
    });

    return securitySettings.biometrics ? checkTouchIdWithFallback : checkPassword;
};

export const useCheckTouchId = () => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    return useMutation(async () => {
        await sdk.touchId?.prompt(lng =>
            (t as (val: string, options?: { lng?: string }) => string)('touch_id_unlock_wallet', {
                lng
            })
        );
    });
};

export const useCheckAdditionalSecurityPassword = () => {
    const { onOpen: promptDesktop } = usePromptDesktopPassword();
    const { onOpen: promptMobile } = usePromptMobileProPin();
    const env = useAppTargetEnv();
    const onOpen = env === 'mobile' ? promptMobile : promptDesktop;

    const securitySettings = useSecuritySettings();

    return useMutation(() => {
        if (!securitySettings.additionalPasswordHash) {
            return Promise.resolve();
        }

        return new Promise<void>((resolve, reject) => {
            onOpen({
                afterClose: async pin => {
                    if (!pin) {
                        reject();
                        return false;
                    }

                    const pinHash = await hashAdditionalSecurityPassword(pin);
                    if (pinHash === securitySettings.additionalPasswordHash) {
                        resolve();
                        return true;
                    } else {
                        reject();
                        return false;
                    }
                }
            });
        });
    });
};
