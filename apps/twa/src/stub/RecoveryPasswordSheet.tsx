import {
    Account,
    AccountSecret,
    isMnemonicAndPassword
} from '@tonkeeper/core/dist/entries/account';
import { decryptWalletSecret } from '@tonkeeper/core/dist/service/mnemonicService';
import { validatePassword } from '@tonkeeper/core/dist/service/passwordService';
import { Notification } from '@tonkeeper/uikit/dist/components/Notification';
import { Button } from '@tonkeeper/uikit/dist/components/fields/Button';
import { Input } from '@tonkeeper/uikit/dist/components/fields/Input';
import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { useAnalyticsTrack } from '@tonkeeper/uikit/dist/hooks/analytics';
import { useTranslation } from '@tonkeeper/uikit/dist/hooks/translation';
import { FC, FormEventHandler, useState } from 'react';
import styled from 'styled-components';

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

/**
 * Password gate for revealing a wallet's recovery phrase, presented as a bottom
 * sheet over the "Mini App Closed" list. On success the decrypted secret is
 * handed to the parent, which swaps the list for the full recovery-phrase page.
 *
 * The password input lives in this self-contained sheet rather than the shared
 * global UnlockNotification dialog: that dialog closes itself on the first
 * render after mount, which in this router-less stub cancels the request
 * immediately ("Cancel auth request").
 *
 * Decryption happens entirely client-side via decryptWalletSecret — the secret
 * never leaves the device, and a wrong password simply fails the AES-GCM
 * decrypt. We use decryptWalletSecret directly (not getAccountSecret) to keep
 * this read-only: no v1->v2 re-encrypt write back to the deprecated app's
 * CloudStorage.
 *
 * The encrypted secret is read straight off the in-memory account (already
 * loaded into the account list) rather than re-fetched from Telegram
 * CloudStorage. That keeps the whole reveal flow working with no connection:
 * the Continue button gates only on the client-side password length check, and
 * decryption is pure crypto that needs no network.
 */
export const RecoveryPasswordSheet: FC<{
    account: Account | null;
    onClose: () => void;
    onUnlocked: (account: Account, secret: AccountSecret) => void;
}> = ({ account, onClose, onUnlocked }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const track = useAnalyticsTrack();
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const encryptedSecret =
        account && isMnemonicAndPassword(account) && account.auth.kind === 'password'
            ? account.auth.encryptedSecret
            : undefined;

    // Reset the form whenever the sheet opens for a different account or closes
    // (account -> null). Clearing on close matters for privacy: it wipes the
    // typed password so reopening the same account — e.g. after the stub drops
    // back to the list on backgrounding — never shows a stale password.
    const [lastId, setLastId] = useState<string | undefined>(undefined);
    if (account?.id !== lastId) {
        setLastId(account?.id);
        setPassword('');
        setError(false);
        setSubmitting(false);
    }

    const submit =
        (afterClose: (cb: () => void) => void): FormEventHandler<HTMLFormElement> =>
        async e => {
            e.preventDefault();
            if (!account || submitting || !validatePassword(password)) {
                return;
            }
            // The secret is loaded with the account list, so this only trips if
            // that list never loaded (e.g. the app was opened with no
            // connection); surface it instead of silently doing nothing.
            if (!encryptedSecret) {
                sdk.hapticNotification('error');
                sdk.topMessage(t('twa_recovery_no_connection'));
                return;
            }
            setSubmitting(true);
            setError(false);
            try {
                const secret = await decryptWalletSecret(encryptedSecret, password);
                track({ eventName: 'twa_sunset_reveal_success' });
                afterClose(() => onUnlocked(account, secret));
            } catch (err) {
                sdk.hapticNotification('error');
                setError(true);
                setSubmitting(false);
            }
        };

    return (
        <Notification
            isOpen={!!account}
            handleClose={onClose}
            title={t('twa_show_recovery_phrase')}
        >
            {afterClose => (
                <Form onSubmit={submit(afterClose)}>
                    <Input
                        id="recovery-password"
                        type="password"
                        value={password}
                        onChange={value => {
                            setPassword(value);
                            setError(false);
                        }}
                        isValid={!error}
                        label={t('twa_enter_password')}
                        disabled={submitting}
                    />
                    <Button
                        primary
                        fullWidth
                        type="submit"
                        disabled={!validatePassword(password)}
                        loading={submitting}
                    >
                        {t('continue')}
                    </Button>
                </Form>
            )}
        </Notification>
    );
};
