import { GetPasswordParams, IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { AuthState } from '@tonkeeper/core/dist/entries/password';
import { debounce } from '@tonkeeper/core/dist/utils/common';
import { Notification2 } from '@tonkeeper/uikit/dist/components/Notification2';
import { openIosKeyboard } from '@tonkeeper/uikit/dist/hooks/ios';
import { useTranslation } from '@tonkeeper/uikit/dist/hooks/translation';
import {
    PasswordUnlock,
    useMutateUnlock
} from '@tonkeeper/uikit/dist/pages/home/UnlockNotification';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

export const TwaUnlockNotification: FC<{ sdk: IAppSdk }> = ({ sdk }) => {
    const { t } = useTranslation();

    const [type, setType] = useState<'confirm' | 'unlock' | undefined>(undefined);
    const [auth, setAuth] = useState<AuthState | undefined>(undefined);
    const [requestId, setId] = useState<number | undefined>(undefined);

    const setRequest = useMemo(() => {
        return debounce<[number | undefined]>(v => setId(v), 450);
    }, [setId]);

    const { mutateAsync, isLoading, isError, reset } = useMutateUnlock(sdk, requestId);

    const close = useCallback(() => {
        setAuth(undefined);
        setId(undefined);
    }, []);

    const onSubmit = async (password: string) => {
        reset();
        try {
            await mutateAsync(password);
            close();
            return true;
        } catch (e) {
            return false;
        }
    };

    const onCancel = () => {
        reset();
        sdk.uiEvents.emit('response', {
            method: 'response',
            id: requestId,
            params: new Error('Cancel auth request')
        });
        close();
    };

    useEffect(() => {
        const handler = (options: {
            method: 'getPassword';
            id?: number | undefined;
            params: GetPasswordParams;
        }) => {
            openIosKeyboard('text', 'password');

            setType(options.params.type);
            setAuth(options.params?.auth);

            if (sdk.isIOs()) {
                setRequest(options.id);
            } else {
                setId(options.id);
            }
        };
        sdk.uiEvents.on('getPassword', handler);

        return () => {
            sdk.uiEvents.off('getPassword', handler);
        };
    }, [sdk]);

    const Content = useCallback(() => {
        if (!auth || !requestId) return undefined;
        return (
            <PasswordUnlock
                sdk={sdk}
                onClose={onCancel}
                onSubmit={onSubmit}
                isLoading={isLoading}
                isError={isError}
                reason={type}
            />
        );
    }, [sdk, auth, requestId, onSubmit, type]);

    return (
        <Notification2
            isOpen={auth != null && requestId != null}
            hideButton
            handleClose={onCancel}
            title={t('enter_password')}
        >
            {Content}
        </Notification2>
    );
};
