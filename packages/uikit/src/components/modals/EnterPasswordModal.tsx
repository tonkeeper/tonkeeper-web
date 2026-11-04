import { FC, FormEvent, useState } from 'react';

import { validatePassword } from '@tonkeeper/core/dist/service/passwordService';

import { useTranslation } from '../../hooks/translation';
import { Button } from '../../primitives/Button';
import { Modal, ModalFooter, ModalFooterPortal } from '../../primitives/Modal';
import { PasswordInput } from '../fields/PasswordInput';

const FORM_ID = 'enter-password-form';

/**
 * Redesigned "Enter password" prompt shared by every place that asks for
 * the wallet password mid-flow (keychain checks, signing, sign out).
 * Owns the field state; the caller only decides whether a submitted
 * password is accepted.
 */
export const EnterPasswordModal: FC<{
    isOpen: boolean;
    onCancel: () => void;
    /** Resolves `false` when the password is rejected: the modal stays open and flags the field. */
    onSubmit: (password: string) => Promise<boolean>;
}> = ({ isOpen, onCancel, onSubmit }) => {
    const { t } = useTranslation();
    const [password, setPassword] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const reset = () => {
        setPassword('');
        setIsError(false);
        setIsLoading(false);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const accepted = await onSubmit(password);
        setIsLoading(false);
        if (!accepted) {
            setIsError(true);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onCancel} afterClose={reset} heading={t('enter_password')}>
            <form id={FORM_ID} onSubmit={handleSubmit}>
                <PasswordInput
                    id="enter-password-input"
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
            </form>
            <ModalFooterPortal>
                <ModalFooter>
                    <Button
                        form={FORM_ID}
                        type="submit"
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
        </Modal>
    );
};
