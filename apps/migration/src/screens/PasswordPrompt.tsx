import { FC, FormEventHandler, ReactNode, useState } from 'react';

import { t } from '../i18n';
import { Layout, LockIcon, PrimaryButton, SecondaryButton } from './Layout';

/** Mirrors `MinPasswordLength` in `packages/core/src/service/passwordService.ts`. */
const MIN_PASSWORD_LENGTH = 6;

const FORM_ID = 'password-prompt';

/**
 * A password gate in front of something only this browser's vaults can open.
 * `onSubmit` rejects for a wrong password — decryption is pure client-side
 * crypto over a vault already in hand, so a wrong password fails the AES-GCM
 * tag rather than asking anything of a server.
 */
export const PasswordPrompt: FC<{
    subtitle?: ReactNode;
    description: ReactNode;
    submitLabel: string;
    onSubmit: (password: string) => Promise<void>;
    onCancel: () => void;
}> = ({ subtitle, description, submitLabel, onSubmit, onCancel }) => {
    const [password, setPassword] = useState('');
    const [failed, setFailed] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const submit: FormEventHandler<HTMLFormElement> = async event => {
        event.preventDefault();

        if (submitting || password.length < MIN_PASSWORD_LENGTH) {
            return;
        }

        setSubmitting(true);
        setFailed(false);

        try {
            await onSubmit(password);
        } catch {
            // The field is emptied so the error can stand where the placeholder
            // was — the typed value is wrong anyway, and retyping is the fix.
            setPassword('');
            setFailed(true);
            setSubmitting(false);
        }
    };

    return (
        <Layout
            icon={<LockIcon />}
            title={t('password_title')}
            subtitle={subtitle}
            description={description}
            actions={
                <>
                    <PrimaryButton
                        type="submit"
                        form={FORM_ID}
                        disabled={submitting || password.length < MIN_PASSWORD_LENGTH}
                    >
                        {submitLabel}
                    </PrimaryButton>
                    <SecondaryButton onClick={onCancel}>{t('cancel')}</SecondaryButton>
                </>
            }
        >
            <form id={FORM_ID} onSubmit={submit} className="p-4">
                <div className="overflow-hidden rounded-2xl bg-fieldBackground">
                    <input
                        type="password"
                        autoFocus
                        autoComplete="current-password"
                        value={password}
                        disabled={submitting}
                        onChange={event => {
                            setPassword(event.target.value);
                            setFailed(false);
                        }}
                        aria-label={t('password_placeholder')}
                        aria-invalid={failed}
                        placeholder={t(failed ? 'password_wrong' : 'password_placeholder')}
                        className={`block h-16 w-full rounded-2xl border-[1.5px] px-4 font-sans text-body1 text-textPrimary outline-none transition-colors placeholder:text-textSecondary ${
                            failed
                                ? 'border-fieldErrorBorder bg-fieldErrorBackground'
                                : 'border-transparent bg-transparent focus:border-fieldActiveBorder'
                        }`}
                    />
                </div>
                {failed && (
                    <p role="alert" className="sr-only">
                        {t('password_wrong')}
                    </p>
                )}
            </form>
        </Layout>
    );
};
