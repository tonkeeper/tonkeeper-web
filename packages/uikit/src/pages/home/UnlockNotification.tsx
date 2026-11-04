import { useMutation } from '@tanstack/react-query';
import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { passwordStorage, validatePassword } from '@tonkeeper/core/dist/service/passwordService';
import { UserCancelledError } from '@tonkeeper/core/dist/errors/UserCancelledError';
import { debounce } from '@tonkeeper/core/dist/utils/common';
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Notification } from '../../components/Notification';
import { CreatePassword } from '../../components/create/CreatePassword';
import { Button, ButtonRow } from '../../components/fields/Button';
import { Input } from '../../components/fields/Input';
import { hideIosKeyboard, openIosKeyboard } from '../../hooks/ios';
import { useTranslation } from '../../hooks/translation';
import { useActiveAccountQuery, useIsPasswordSet } from '../../state/wallet';
import { EnterPasswordModal } from '../../components/modals/EnterPasswordModal';
import { useKeyboardHeight } from '../../hooks/keyboard/useKeyboardHeight';

const Block = styled.form<{ padding: number }>`
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    justify-content: center;
    gap: 2rem;
    width: 100%;

    @media (width <= 440px) {
        padding-bottom: ${props => props.padding}px;
    }
`;

const CreatePasswordStyled = styled(CreatePassword)<{ padding: number }>`
    @media (width <= 440px) {
        padding-bottom: ${props => props.padding}px;
    }
`;

export const useMutateUnlock = (sdk: IAppSdk, requestId?: number) => {
    const isPasswordSet = useIsPasswordSet();
    return useMutation<void, Error, string>(async password => {
        if (isPasswordSet) {
            const isValid = await passwordStorage(sdk.storage).isPasswordValid(password);
            if (!isValid) {
                sdk.hapticNotification('error');
                throw new Error('Password not valid');
            }
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
    const location = useLocation();
    const mountLocation = useRef(location);

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
    }, []);

    // Dismiss the prompt when the user navigates away while it is open.
    // Compare against the mount-time location: the effect also re-runs on
    // `onClose` identity changes, and closing on those would dismiss the
    // prompt immediately after mount.
    useEffect(() => {
        if (location !== mountLocation.current) {
            onClose();
        }
    }, [location, onClose]);

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
                id="unlock-password"
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
                    disabled={!validatePassword(password)}
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
    const padding = useKeyboardHeight();
    const [requestId, setId] = useState<number | undefined>(undefined);

    const setRequest = useMemo(() => {
        return debounce<[number | undefined]>(v => setId(v), 200);
    }, [setId]);

    const { mutateAsync, isLoading, isError, reset } = useMutateUnlock(sdk, requestId);

    const close = useCallback(() => {
        setId(undefined);
    }, []);

    const isPasswordSet = useIsPasswordSet();

    const onSubmit = useCallback(
        async (password: string) => {
            reset();
            try {
                await mutateAsync(password);
                close();
                return true;
            } catch (e) {
                return false;
            }
        },
        [reset, mutateAsync, close]
    );

    const onCancel = useCallback(() => {
        reset();
        if (requestId) {
            sdk.uiEvents.emit('response', {
                method: 'response',
                id: requestId,
                params: new UserCancelledError('Cancel auth request')
            });
        }
        close();
    }, [reset, requestId, sdk, close]);

    useEffect(() => {
        const handler = (options: { method: 'getPassword'; id?: number | undefined }) => {
            openIosKeyboard('text', 'password');

            setRequest(options.id);
        };

        sdk.uiEvents.on('getPassword', handler);

        return () => {
            sdk.uiEvents.off('getPassword', handler);
        };
    }, [sdk, setRequest]);

    const { data: activeAccount } = useActiveAccountQuery();
    const isMultichainPrompt = activeAccount?.type === 'multichain' && isPasswordSet;

    // The redesigned modal has no navigation awareness of its own, so a route
    // change while it is open cancels the pending request the same way the
    // legacy sheet does. Location is captured when the request arrives.
    const location = useLocation();
    const requestLocation = useRef<typeof location>();
    useEffect(() => {
        if (!isMultichainPrompt || requestId == null) {
            requestLocation.current = undefined;
            return;
        }
        if (!requestLocation.current) {
            requestLocation.current = location;
            return;
        }
        if (location !== requestLocation.current) {
            onCancel();
        }
    }, [isMultichainPrompt, requestId, location, onCancel]);

    const Content = useCallback(() => {
        if (!requestId) return undefined;

        if (!isPasswordSet) {
            return (
                <CreatePasswordStyled
                    afterCreate={onSubmit}
                    isLoading={isLoading}
                    padding={usePadding ? padding : 0}
                />
            );
        }
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
    }, [
        sdk,
        requestId,
        padding,
        onCancel,
        onSubmit,
        isPasswordSet,
        isLoading,
        isError,
        usePadding
    ]);

    if (isMultichainPrompt) {
        return (
            <EnterPasswordModal
                isOpen={requestId != null}
                onCancel={onCancel}
                onSubmit={onSubmit}
            />
        );
    }

    return (
        <Notification
            isOpen={requestId != null}
            hideButton
            handleClose={onCancel}
            title={isPasswordSet ? t('enter_password') : undefined}
            topMost
        >
            {Content}
        </Notification>
    );
};
