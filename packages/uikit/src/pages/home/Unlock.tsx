import { useMutation } from '@tanstack/react-query';
import React, { FC, useEffect, useRef, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { Button, ButtonResponsiveSize } from '../../components/fields/Button';
import { Input } from '../../components/fields/Input';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { useIsPasswordSet, useMutateDeleteAll, useAccountsState } from '../../state/wallet';
import { passwordStorage } from '@tonkeeper/core/dist/service/passwordService';
import { useKeychainSecuritySettings, useMutateLookScreen } from '../../state/password';
import { useInputFocusScroll } from '../../hooks/keyboard/useInputFocusScroll';
import { Body1, Body2Class, H3, Label2Class } from '../../components/Text';
import { ExternalLink } from '../../components/shared/ExternalLink';
import { useSupport } from '../../state/pro';

const PageWrapper = styled.div`
    position: relative;
    background: ${p => p.theme.backgroundPage};
`;

const Block = styled.form<{ minHeight?: string }>`
    max-width: 352px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    min-height: var(--app-height);

    padding: 2rem 1rem;
    box-sizing: border-box;

    justify-content: center;
    gap: 12px;
`;

const Heading = styled.div`
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: center;
    text-align: center;
    gap: 4px;
    padding-bottom: 4px;

    > * {
        margin-bottom: 0;
    }
`;

const SignOutButton = styled(Button)`
    z-index: 2;
    position: absolute;
    top: calc(1rem + env(safe-area-inset-top));
    right: 1rem;
`;

const SubTitle = styled(Body1)`
    color: ${p => p.theme.textSecondary};
    ${p => p.theme.displayType === 'full-width' && Body2Class}
`;

const SupportButton = styled(ExternalLink)`
    ${Label2Class};
    color: ${p => p.theme.textSecondary};
    text-decoration: none;
    bottom: calc(1rem + env(safe-area-inset-bottom));
    left: 50%;
    transform: translateX(-50%);
    position: absolute;
`;

const useMutateUnlock = () => {
    const sdk = useAppSdk();
    const isPasswordSet = useIsPasswordSet();

    return useMutation<void, Error, string>(async password => {
        let isValid = false;
        if (isPasswordSet) {
            isValid = await passwordStorage(sdk.storage).isPasswordValid(password);
        } else if (sdk.keychain?.security.value?.password) {
            isValid = await sdk.keychain.checkPassword(password);
        } else {
            throw new Error('Unreachable code');
        }

        if (!isValid) {
            throw new Error('Password not valid');
        }
        sdk.uiEvents.emit('unlock');
    });
};

const PasswordUnlock: FC<{ logOutConfirmed?: () => void }> = ({ logOutConfirmed }) => {
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
        const hasSeveralAccounts = wallets.length > 1;
        const confirm = await sdk.confirm({
            title: `🚧🚨🚨🚨🚧\n${t(
                hasSeveralAccounts ? 'settings_reset_alert_title_all' : 'settings_reset_alert_title'
            )}`,
            message: t(hasSeveralAccounts ? 'logout_on_unlock_many' : 'logout_on_unlock_one'),
            cancelButtonTitle: t('cancel'),
            okButtonTitle: t('settings_reset'),
            defaultButton: 'cancel',
            type: 'warning'
        });
        if (confirm) {
            logOutConfirmed?.();
            mutateLogOut();
        }
    };

    useEffect(() => {
        if (sdk.keychain?.security.value?.biometry) {
            sdk.keychain.securityCheck('biometry').then(() => sdk.uiEvents.emit('unlock'));
        }
    }, []);

    const contentRef = useRef<HTMLFormElement>(null);
    useInputFocusScroll(contentRef);
    const theme = useTheme();
    const { data: support } = useSupport();

    return (
        <PageWrapper>
            <Block ref={contentRef} onSubmit={onSubmit}>
                <Heading>
                    <H3>{theme.displayType === 'compact' ? 'Tonkeeper' : 'Tonkeeper Pro'}</H3>
                    <SubTitle>{t('lockscreen_subtitle')}</SubTitle>
                </Heading>

                <Input
                    id="unlock-password"
                    ref={ref}
                    value={password}
                    onChange={onChange}
                    type="password"
                    label={t('Password')}
                    isValid={!isError}
                    disabled={isLoading}
                />
                <ButtonResponsiveSize
                    primary
                    fullWidth
                    type="submit"
                    disabled={disabled}
                    loading={isLoading}
                >
                    {t('Unlock')}
                </ButtonResponsiveSize>
                <SignOutButton type="button" secondary size="small" onClick={onLogOut}>
                    {t('settings_reset')}
                </SignOutButton>
                {!!support?.url && (
                    <SupportButton href={support.url}>{t('settings_support')}</SupportButton>
                )}
            </Block>
        </PageWrapper>
    );
};

export const Unlock = () => {
    const isPasswordSet = useIsPasswordSet();
    const { password: keychainPassword } = useKeychainSecuritySettings();
    const canUnlock = useRef(true);

    const { mutate } = useMutateLookScreen();
    const sdk = useAppSdk();

    useEffect(() => {
        if (!isPasswordSet && !keychainPassword && canUnlock.current) {
            mutate(false);
            sdk.uiEvents.emit('unlock');
        }
    }, [isPasswordSet, keychainPassword, mutate]);

    if (isPasswordSet || keychainPassword) {
        return <PasswordUnlock logOutConfirmed={() => (canUnlock.current = false)} />;
    } else {
        return null;
    }
};
