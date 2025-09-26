import { validatePassword } from '@tonkeeper/core/dist/service/passwordService';
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { CenterContainer } from '../Layout';
import { H2 } from '../Text';
import { Button } from '../fields/Button';
import { Input } from '../fields/Input';
import { Notification } from '../Notification';

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
    noTitle?: boolean;
}> = ({ afterCreate, isLoading, className, noTitle }) => {
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
                {!noTitle && <H2>{t('Create_password')}</H2>}
                <Input
                    id="create-password"
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
                    id="create-password-confirm"
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

export const CreatePasswordNotification: FC<{
    isOpen: boolean;
    handleClose: (password?: string) => void;
}> = ({ isOpen, handleClose }) => {
    const { t } = useTranslation();

    const Content = useCallback(() => {
        return <CreatePassword afterCreate={handleClose} noTitle />;
    }, []);

    return (
        <Notification title={t('set_up_password')} isOpen={isOpen} handleClose={handleClose}>
            {Content}
        </Notification>
    );
};
