import { FC, FormEvent, useState } from 'react';

import { passwordStorage, validatePassword } from '@tonkeeper/core/dist/service/passwordService';

import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { useIsPasswordSet } from '../../state/wallet';
import { Button } from '../../primitives/Button';
import { ModalFooter, ModalFooterPortal } from '../../primitives/Modal';
import { PasswordInput } from '../fields/PasswordInput';

const CREATE_FORM_ID = 'create-password-form';
const UNLOCK_FORM_ID = 'unlock-password-form';

/**
 * Inline wizard step that collects the app password — before the create
 * flow shows any secret material, or right before the import flow
 * persists the account. Two render branches share the layout:
 *
 *   - first wallet on this device (`useIsPasswordSet() === false`) →
 *     create a new password (set + confirm, validated locally)
 *   - existing wallet on this device (`useIsPasswordSet() === true`) →
 *     enter the existing password (validated against `passwordStorage`)
 *
 * Collecting the password here (rather than via
 * `getPasswordByNotification` inside the create-account mutation) lets
 * the caller pass the captured password straight into the mutation,
 * skipping the global UnlockNotification that would otherwise stack a
 * second modal over the wizard.
 *
 * `isLoading` keeps the submit button in its loading state while the
 * caller runs the mutation the password unlocks.
 *
 * Platforms with `sdk.keychain` (desktop, mobile) don't need a password
 * at all — secrets land in the OS keychain. The caller is expected to
 * skip mounting this step on those platforms.
 */
type PasswordStepProps = { onSubmit: (password: string) => void; isLoading?: boolean };

export const PasswordStep: FC<PasswordStepProps> = props => {
    const isPasswordSet = useIsPasswordSet();
    return isPasswordSet ? <UnlockForm {...props} /> : <CreateForm {...props} />;
};

const CreateForm: FC<PasswordStepProps> = ({ onSubmit, isLoading }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    // `'password'` = entered password fails `validatePassword`, `'confirm'` =
    // confirmation doesn't match. Cleared on any keystroke.
    const [error, setError] = useState<'password' | 'confirm'>();

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isLoading) return;
        if (!validatePassword(password)) {
            sdk.hapticNotification('error');
            setError('password');
            return;
        }
        if (password !== confirm) {
            sdk.hapticNotification('error');
            setError('confirm');
            return;
        }
        onSubmit(password);
    };

    return (
        <form
            id={CREATE_FORM_ID}
            onSubmit={handleSubmit}
            className="mx-auto flex w-full max-w-[524px] flex-col items-center gap-4 text-center"
        >
            <div className="flex flex-col gap-1 px-8 pb-2">
                <h2 className="text-h2 text-textPrimary">{t('Create_password')}</h2>
                <p className="text-balance text-body1 text-textSecondary">{t('MinPassword')}</p>
            </div>
            <PasswordInput
                id="create-password"
                label={t('Password')}
                value={password}
                autoFocus
                isValid={error !== 'password'}
                helpText={error === 'password' ? t('MinPassword') : undefined}
                onChange={value => {
                    setError(undefined);
                    setPassword(value);
                }}
            />
            <PasswordInput
                id="create-password-confirm"
                label={t('ConfirmPassword')}
                value={confirm}
                isValid={error !== 'confirm'}
                helpText={error === 'confirm' ? t('PasswordDoNotMatch') : undefined}
                onChange={value => {
                    setError(undefined);
                    setConfirm(value);
                }}
            />
            <ModalFooterPortal>
                <ModalFooter>
                    <Button
                        type="submit"
                        form={CREATE_FORM_ID}
                        variant="primaryBlue"
                        size="large"
                        fullWidth
                        loading={isLoading}
                        disabled={!password || !confirm}
                    >
                        {t('continue')}
                    </Button>
                </ModalFooter>
            </ModalFooterPortal>
        </form>
    );
};

const UnlockForm: FC<PasswordStepProps> = ({ onSubmit, isLoading: isSubmitting }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const [password, setPassword] = useState('');
    const [isError, setIsError] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const isLoading = isValidating || isSubmitting;

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isLoading || !validatePassword(password)) return;
        setIsValidating(true);
        const valid = await passwordStorage(sdk.storage).isPasswordValid(password);
        setIsValidating(false);
        if (!valid) {
            sdk.hapticNotification('error');
            setIsError(true);
            return;
        }
        onSubmit(password);
    };

    return (
        <form
            id={UNLOCK_FORM_ID}
            onSubmit={handleSubmit}
            className="mx-auto flex w-full max-w-[524px] flex-col items-center gap-4 text-center"
        >
            <div className="flex flex-col gap-1 px-8 pb-2">
                <h2 className="text-h2 text-textPrimary">{t('enter_password')}</h2>
            </div>
            <PasswordInput
                id="unlock-password"
                label={t('Password')}
                value={password}
                autoFocus
                disabled={isLoading}
                isValid={!isError}
                onChange={value => {
                    setIsError(false);
                    setPassword(value);
                }}
            />
            <ModalFooterPortal>
                <ModalFooter>
                    <Button
                        type="submit"
                        form={UNLOCK_FORM_ID}
                        variant="primaryBlue"
                        size="large"
                        fullWidth
                        loading={isLoading}
                        disabled={!validatePassword(password)}
                    >
                        {t('confirm')}
                    </Button>
                </ModalFooter>
            </ModalFooterPortal>
        </form>
    );
};
