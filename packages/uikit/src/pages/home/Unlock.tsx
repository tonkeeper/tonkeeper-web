import { useMutation } from '@tanstack/react-query';
import React, { FC, useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { TonkeeperIcon } from '../../components/Icon';
import { Button, ButtonRow } from '../../components/fields/Button';
import { Input } from '../../components/fields/Input';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { useIsPasswordSet, useMutateDeleteAll, useAccountsState } from '../../state/wallet';
import { passwordStorage } from '@tonkeeper/core/dist/service/passwordService';

const Block = styled.form<{ minHeight?: string }>`
    display: flex;
    flex-direction: column;
    ${props =>
        css`
            min-height: ${props.minHeight ?? 'var(--app-height)'};
        `}

    padding: 2rem 1rem;
    box-sizing: border-box;

    justify-content: center;
    gap: 1rem;

    position: relative;
`;

const Logo = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;

    font-size: 400%;

    margin-bottom: 2rem;

    color: ${props => props.theme.accentBlue};
`;

const useMutateUnlock = () => {
    const sdk = useAppSdk();

    return useMutation<void, Error, string>(async password => {
        const isValid = await passwordStorage(sdk.storage).isPasswordValid(password);
        if (!isValid) {
            throw new Error('Password not valid');
        }
        sdk.uiEvents.emit('unlock');
    });
};

export const PasswordUnlock: FC<{ minHeight?: string }> = ({ minHeight }) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const wallets = useAccountsState();

    const ref = useRef<HTMLInputElement | null>(null);
    const { mutate: mutateLogOut, isLoading: isLogOutLoading } = useMutateDeleteAll();
    const { mutate, isLoading, isError, reset } = useMutateUnlock();
    const [password, setPassword] = useState('');

    const disabled = isLogOutLoading || isLoading;

    useEffect(() => {
        if (ref.current) {
            ref.current.focus();
        }
    }, [ref.current]);

    const onChange = (value: string) => {
        reset();
        setPassword(value);
    };

    const onSubmit: React.FormEventHandler<HTMLFormElement> = e => {
        e.preventDefault();
        mutate(password);
    };

    const onLogOut = async () => {
        const confirm = await sdk.confirm(
            t(wallets.length > 1 ? 'logout_on_unlock_many' : 'logout_on_unlock_one')
        );
        if (confirm) {
            await mutateLogOut();
            window.location.href = window.location.href;
        }
    };

    return (
        <Block minHeight={minHeight} onSubmit={onSubmit}>
            <Logo>
                <TonkeeperIcon />
            </Logo>
            <Input
                ref={ref}
                value={password}
                onChange={onChange}
                type="password"
                label={t('Password')}
                isValid={!isError}
                disabled={isLoading}
            />
            <ButtonRow>
                <Button
                    marginTop
                    size="large"
                    secondary
                    fullWidth
                    type="button"
                    disabled={disabled}
                    loading={isLogOutLoading}
                    onClick={onLogOut}
                >
                    {t('settings_reset')}
                </Button>
                <Button
                    marginTop
                    size="large"
                    primary
                    fullWidth
                    type="submit"
                    disabled={disabled}
                    loading={isLoading}
                >
                    {t('Unlock')}
                </Button>
            </ButtonRow>
        </Block>
    );
};

export const Unlock = () => {
    const isPasswordSet = useIsPasswordSet();

    if (isPasswordSet) {
        return <PasswordUnlock />;
    } else {
        return <div>Other auth</div>;
    }
};
