import { useMutation } from '@tanstack/react-query';
import { GetPasswordParams, IAppSdk, KeyboardParams } from '@tonkeeper/core/dist/AppSdk';
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

const Block = styled.form<{ padding: number }>`
    display: flex;
    flex-direction: column;
    box-sizing: border-box;

    justify-content: center;
    gap: 2rem;
    width: 100%;

    @media (max-width: 440px) {
        padding-bottom: ${props => props.padding}px;
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
    padding: number;
}> = ({ sdk, onClose, onSubmit, isError, isLoading, padding }) => {
    const { t } = useTranslation();
    const ref = useRef<HTMLInputElement | null>(null);
    const [password, setPassword] = useState('');
    const [active, setActive] = useState(false);
    const location = useLocation();

    useEffect(() => {
        sdk.uiEvents.on('navigate', onClose);
        return () => {
            sdk.uiEvents.off('navigate', onClose);
        };
    }, [sdk, onClose]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (ref.current) {
                ref.current.focus();
            }
        }, 350);
        return () => {
            clearTimeout(timeout);
        };
    }, [ref.current]);

    useEffect(() => {
        if (!active) {
            setActive(true);
        } else {
            onClose();
        }
    }, [location]);

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
        <Block onSubmit={handleSubmit} padding={padding}>
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

export const UnlockNotification: FC<{ sdk: IAppSdk; usePadding?: boolean }> = ({
    sdk,
    usePadding = false
}) => {
    const { t } = useTranslation();
    const [padding, setPadding] = useState(0);
    const [auth, setAuth] = useState<AuthState | undefined>(undefined);
    const [requestId, setId] = useState<number | undefined>(undefined);

    const setRequest = useMemo(() => {
        return debounce<[number | undefined]>(v => setId(v), 200);
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

    const onCancel = useCallback(() => {
        reset();
        if (requestId) {
            sdk.uiEvents.emit('response', {
                method: 'response',
                id: requestId,
                params: new Error('Cancel auth request')
            });
        }
        close();
    }, [reset, requestId, sdk, close]);

    useEffect(() => {
        const handlerKeyboard = (options: {
            method: 'keyboard';
            id?: number | undefined;
            params: KeyboardParams;
        }) => {
            setPadding(oldValue =>
                Math.max(options.params.total - options.params.viewport, oldValue)
            );
        };

        const handler = (options: {
            method: 'getPassword';
            id?: number | undefined;
            params: GetPasswordParams;
        }) => {
            openIosKeyboard('text', 'password');

            setAuth(options.params?.auth);

            setRequest(options.id);
        };

        sdk.uiEvents.on('getPassword', handler);
        sdk.uiEvents.on('keyboard', handlerKeyboard);

        return () => {
            sdk.uiEvents.off('getPassword', handler);
            sdk.uiEvents.off('keyboard', handlerKeyboard);
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
                padding={usePadding ? padding : 0}
            />
        );
    }, [sdk, auth, requestId, padding, onCancel, onSubmit]);

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
