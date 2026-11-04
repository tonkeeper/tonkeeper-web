import { useEffect, useState } from 'react';

import { Notification } from '../Notification';
import { useAtom } from '../../libs/useAtom';
import { useTranslation } from '../../hooks/translation';
import { createModalControl } from './createModalControl';
import { PasswordUnlock } from '../../pages/home/UnlockNotification';
import { useAppSdk } from '../../hooks/appSdk';
import { useActiveAccountQuery } from '../../state/wallet';
import { EnterPasswordModal } from './EnterPasswordModal';

const { hook, paramsControl, controller } = createModalControl<{
    afterClose: (pin?: string) => void | Promise<boolean | undefined>;
}>();

export const promptDesktopPasswordController = controller;

export const usePromptDesktopPassword = hook;

/**
 * Keychain password prompt, opened imperatively by the desktop/mobile
 * keychain (`promptDesktopPasswordController`) whenever a security
 * check needs the password. Renders the redesigned modal for
 * multichain accounts and the legacy sheet for every other account
 * type.
 */
export const CheckDesktopPasswordControlled = () => {
    const { data: activeAccount } = useActiveAccountQuery();

    if (activeAccount?.type === 'multichain') {
        return <CheckPasswordMultichain />;
    }
    return <CheckPasswordLegacy />;
};

const CheckPasswordMultichain = () => {
    const { isOpen, onClose } = usePromptDesktopPassword();
    const [params] = useAtom(paramsControl);
    const sdk = useAppSdk();

    const onCancel = () => {
        onClose();
        params?.afterClose?.();
    };

    const onSubmit = async (password: string) => {
        if (!params?.afterClose) {
            onClose();
            return true;
        }

        const resultPromise = params.afterClose(password);
        if (!(resultPromise instanceof Promise)) {
            onClose();
            return true;
        }

        const isValid = await resultPromise;
        if (isValid === false) {
            sdk.hapticNotification('error');
            return false;
        }
        onClose();
        return true;
    };

    return <EnterPasswordModal isOpen={isOpen} onCancel={onCancel} onSubmit={onSubmit} />;
};

const CheckPasswordLegacy = () => {
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
            topMost
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
                            setError(!isValid);
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
