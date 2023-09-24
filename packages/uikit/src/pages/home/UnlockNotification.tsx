import { useMutation } from '@tanstack/react-query';
import { GetPasswordParams, GetPasswordType, IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { AuthState } from '@tonkeeper/core/dist/entries/password';
import { MinPasswordLength, getAccountState } from '@tonkeeper/core/dist/service/accountService';
import { validateWalletMnemonic } from '@tonkeeper/core/dist/service/mnemonicService';
import { getWalletState } from '@tonkeeper/core/dist/service/wallet/storeService';
import { debounce } from '@tonkeeper/core/dist/utils/common';
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Notification } from '../../components/Notification';
import { Button, ButtonRow } from '../../components/fields/Button';
import { Input } from '../../components/fields/Input';
import { hideIosKeyboard, openIosKeyboard } from '../../hooks/ios';
import { useTranslation } from '../../hooks/translation';

export const getPasswordByNotification = async (
    sdk: IAppSdk,
    auth: AuthState,
    type?: GetPasswordType
): Promise<string> => {
    const id = Date.now();
    return new Promise<string>((resolve, reject) => {
        sdk.uiEvents.emit('getPassword', {
            method: 'getPassword',
            id,
            params: { type, auth }
        });

        const onCallback = (message: {
            method: 'response';
            id?: number | undefined;
            params: string | Error;
        }) => {
            if (message.id === id) {
                const { params } = message;
                sdk.uiEvents.off('response', onCallback);

                if (typeof params === 'string') {
                    resolve(params);
                } else {
                    reject(params);
                }
            }
        };

        sdk.uiEvents.on('response', onCallback);
    });
};

const Block = styled.form`
    display: flex;
    flex-direction: column;
    box-sizing: border-box;

    justify-content: center;
    gap: 2rem;
    width: 100%;

    @media (max-width: 440px) {
        padding-bottom: 270px;
    }
`;

export const useMutateUnlock = (sdk: IAppSdk, requestId?: number) => {
    return useMutation<void, Error, string>(async password => {
        const account = await getAccountState(sdk.storage);
        if (account.publicKeys.length === 0) {
            throw new Error('Missing wallets');
        }
        const [publicKey] = account.publicKeys;
        const wallet = await getWalletState(sdk.storage, publicKey);
        if (!wallet) {
            throw new Error('Missing wallet');
        }

        const isValid = await validateWalletMnemonic(sdk.storage, publicKey, password);
        if (!isValid) {
            sdk.hapticNotification('error');
            throw new Error('Mnemonic not valid');
        }

        sdk.uiEvents.emit('response', {
            method: 'response',
            id: requestId,
            params: password
        });
    });
};

export const PasswordUnlock: FC<{
    sdk: IAppSdk;
    onClose: () => void;
    onSubmit: (password: string) => Promise<boolean>;
    isError: boolean;
    isLoading: boolean;
    reason?: GetPasswordType;
}> = ({ sdk, onClose, onSubmit, isError, isLoading }) => {
    const { t } = useTranslation();
    const ref = useRef<HTMLInputElement | null>(null);
    const [password, setPassword] = useState('');
    const [active, setActive] = useState(false);
    const location = useLocation();

    useEffect(() => {
        if (!active) {
            setActive(true);
        } else {
            onClose();
        }
    }, [location]);

    // useEffect(() => {
    //     if (ref.current) {
    //         ref.current.focus();

    //         ref.current.onblur = () => {
    //             openIosKeyboard('text', 'password', 360); // almost infinity
    //         };
    //     }
    //     return () => {
    //         if (ref.current) {
    //             ref.current.onblur = undefined!;
    //         }
    //         hideIosKeyboard();
    //     };
    // }, [ref]);

    const handleSubmit: React.FormEventHandler<HTMLFormElement> = async e => {
        e.preventDefault();

        if (sdk.isIOs()) {
            openIosKeyboard('text', 'password');
        }

        const result = await onSubmit(password);

        if (result === false) {
            ref.current?.focus();
            ref.current?.select();
        } else {
            hideIosKeyboard();
        }
    };

    return (
        <Block onSubmit={handleSubmit}>
            <Input
                ref={ref}
                value={password}
                onChange={setPassword}
                type="password"
                label={t('Password')}
                isValid={!isError}
                disabled={isLoading}
            />
            <ButtonRow>
                <Button size="large" fullWidth onClick={onClose} type="button" loading={isLoading}>
                    {t('notifications_alert_cancel')}
                </Button>
                <Button
                    size="large"
                    primary
                    fullWidth
                    type="submit"
                    disabled={password.length < MinPasswordLength}
                    loading={isLoading}
                >
                    {t('confirm')}
                </Button>
            </ButtonRow>
        </Block>
    );
};

export const UnlockNotification: FC<{ sdk: IAppSdk }> = ({ sdk }) => {
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
        <Notification
            isOpen={auth != null && requestId != null}
            hideButton
            handleClose={onCancel}
            title={t('enter_password')}
        >
            {Content}
        </Notification>
    );
};
