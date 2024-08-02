import React, { FC, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { CenterContainer } from '../Layout';
import { H2 } from '../Text';
import { Button } from '../fields/Button';
import { Input } from '../fields/Input';
import { validatePassword } from '@tonkeeper/core/dist/service/passwordService';

const Block = styled.form`
    display: flex;
    text-align: center;
    gap: 1rem;
    flex-direction: column;
`;

export const CreatePassword: FC<{
    afterCreate: (password: string) => void;
    isLoading?: boolean;
    className?: string;
}> = ({ afterCreate, isLoading, className }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();

    const ref = useRef<HTMLInputElement>(null);

    const [error, setError] = useState<string | undefined>(undefined);

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');

    const onCreate: React.FormEventHandler<HTMLFormElement> = async e => {
        e.stopPropagation();
        e.preventDefault();
        if (!validatePassword(password)) {
            sdk.hapticNotification('error');
            return setError('password');
        }
        if (password !== confirm) {
            sdk.hapticNotification('error');
            return setError('confirm');
        }

        return afterCreate(password);
    };

    useEffect(() => {
        if (ref.current) {
            ref.current.focus();
        }
    }, [ref]);

    return (
        <CenterContainer className={className}>
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
                    loading={isLoading}
                    disabled={!!error}
                    type="submit"
                >
                    {t('continue')}
                </Button>
            </Block>
        </CenterContainer>
    );
};
