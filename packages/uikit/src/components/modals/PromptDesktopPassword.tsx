import { Notification } from '../Notification';
import { useAtom } from '../../libs/atom';
import { useTranslation } from '../../hooks/translation';
import { createModalControl } from './createModalControl';
import React, { useEffect, useState } from 'react';
import { PasswordUnlock } from '../../pages/home/UnlockNotification';
import { useAppSdk } from '../../hooks/appSdk';

const { hook, paramsControl } = createModalControl<{
    afterClose: (pin?: string) => void | Promise<boolean | undefined>;
}>();

export const usePromptDesktopPassword = hook;

export const CheckDesktopPasswordControlled = () => {
    const { isOpen, onClose } = usePromptDesktopPassword();
    const { t } = useTranslation();
    const [params] = useAtom(paramsControl);
    const sdk = useAppSdk();
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setError(false);
        }
    }, [isOpen]);

    return (
        <Notification
            isOpen={isOpen}
            hideButton
            handleClose={() => {
                onClose();
                params?.afterClose?.();
            }}
            title={t('enter_password')}
        >
            {() => (
                <PasswordUnlock
                    sdk={sdk}
                    onClose={onClose}
                    onSubmit={async password => {
                        if (!params?.afterClose) {
                            onClose();
                            return true;
                        }

                        const resultPromise = params.afterClose(password);
                        if (resultPromise instanceof Promise) {
                            const isValid = await resultPromise;
                            if (isValid !== false) {
                                onClose();
                            }
                            setError(!!isValid);
                            return !!isValid;
                        } else {
                            onClose();
                            return true;
                        }
                    }}
                    isLoading={false}
                    isError={error}
                    padding={0}
                />
            )}
        </Notification>
    );
};
