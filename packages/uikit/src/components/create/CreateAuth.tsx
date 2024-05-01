import { useMutation } from '@tanstack/react-query';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { AuthNone, AuthPassword, AuthState } from '@tonkeeper/core/dist/entries/password';
import { MinPasswordLength } from '@tonkeeper/core/dist/service/accountService';
import React, { FC, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { CenterContainer } from '../Layout';
import { H2 } from '../Text';
import { Button } from '../fields/Button';
import { Input } from '../fields/Input';

const Block = styled.form`
    display: flex;
    text-align: center;
    gap: 1rem;
    flex-direction: column;
`;

const useSetNoneAuthMutation = () => {
    const sdk = useAppSdk();
    return useMutation<void, Error, void>(async () => {
        const state: AuthNone = {
            kind: 'none'
        };
        await sdk.storage.set(AppKey.GLOBAL_AUTH_STATE, state);
    });
};

const SelectAuthType: FC<{
    onSelect: (value: AuthState['kind']) => void;
    isLoading: boolean;
}> = ({ onSelect, isLoading }) => {
    const { t } = useTranslation();

    return (
        <Block>
            <Button size="large" fullWidth onClick={() => onSelect('none')} loading={isLoading}>
                {t('Without_authentication')}
            </Button>
            <Button
                size="large"
                fullWidth
                primary
                onClick={() => onSelect('password')}
                disabled={isLoading}
            >
                {t('Password')}
            </Button>
        </Block>
    );
};

const useCreatePassword = () => {
    const sdk = useAppSdk();

    return useMutation<string | undefined, Error, { password: string; confirm: string }>(
        async ({ password, confirm }) => {
            if (password.length < MinPasswordLength) {
                sdk.hapticNotification('error');
                return 'password';
            }
            if (password !== confirm) {
                sdk.hapticNotification('error');
                return 'confirm';
            }

            const state: AuthPassword = {
                kind: 'password'
            };
            await sdk.storage.set(AppKey.GLOBAL_AUTH_STATE, state);
        }
    );
};

const FillPassword: FC<{
    afterCreate: (password: string) => void;
    isLoading?: boolean;
}> = ({ afterCreate, isLoading }) => {
    const { t } = useTranslation();

    const { mutateAsync, isLoading: isCreating, reset } = useCreatePassword();

    const ref = useRef<HTMLInputElement>(null);

    const [error, setError] = useState<string | undefined>(undefined);

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');

    const onCreate: React.FormEventHandler<HTMLFormElement> = async e => {
        e.stopPropagation();
        e.preventDefault();
        reset();
        const result = await mutateAsync({ password, confirm });
        if (result === undefined) {
            return afterCreate(password);
        } else {
            setError(result);
        }
    };

    useEffect(() => {
        if (ref.current) {
            ref.current.focus();
        }
    }, [ref]);

    return (
        <CenterContainer>
            <Block onSubmit={onCreate}>
                <H2>{t('Create_password')}</H2>
                <Input
                    ref={ref}
                    type="password"
                    label={t('Password')}
                    value={password}
                    onChange={value => {
                        setError(undefined);
                        setPassword(value);
                    }}
                    isValid={error == null}
                    helpText={error === 'confirm' ? t('PasswordDoNotMatch') : t('MinPassword')}
                />

                <Input
                    type="password"
                    label={t('ConfirmPassword')}
                    value={confirm}
                    onChange={value => {
                        setError(undefined);
                        setConfirm(value);
                    }}
                    isValid={error !== 'confirm'}
                />

                <Button
                    size="large"
                    fullWidth
                    primary
                    marginTop
                    loading={isLoading || isCreating}
                    disabled={isCreating || error != null}
                    type="submit"
                >
                    {t('continue')}
                </Button>
            </Block>
        </CenterContainer>
    );
};

export const CreateAuthState: FC<{
    afterCreate: (password?: string) => void;
    isLoading?: boolean;
}> = ({ afterCreate, isLoading }) => {
    const [authType, setAuthType] = useState<AuthState['kind'] | undefined>('password');

    const { mutateAsync: setNoneAuth, isLoading: isNoneLoading } = useSetNoneAuthMutation();

    const onSelect = async (_authType: AuthState['kind']) => {
        if (_authType === 'none') {
            await setNoneAuth();
            afterCreate();
        } else {
            setAuthType(_authType);
        }
    };

    if (authType === undefined) {
        return <SelectAuthType onSelect={onSelect} isLoading={isNoneLoading} />;
    } else if (authType === 'password') {
        return <FillPassword afterCreate={afterCreate} isLoading={isLoading} />;
    } else {
        return <>TODO: WithAuthn case </>;
    }
};
