import { FC } from 'react';

import { RecoverableAccount } from '../accounts';
import { AccountSecret, decryptSecret } from '../crypto';
import { accountTitleText, t } from '../i18n';
import { PasswordPrompt } from './PasswordPrompt';

/**
 * The password gate in front of a phrase. The whole step works with no
 * connection: the vault is already in hand and is opened in the browser.
 */
export const RecoveryUnlock: FC<{
    account: RecoverableAccount;
    onUnlocked: (secret: AccountSecret) => void;
    onCancel: () => void;
}> = ({ account, onUnlocked, onCancel }) => (
    <PasswordPrompt
        subtitle={accountTitleText(account)}
        description={t('recovery_unlock_description')}
        submitLabel={t('recovery_show_phrase')}
        onSubmit={async password =>
            onUnlocked(await decryptSecret(account.encryptedSecret, password))
        }
        onCancel={onCancel}
    />
);
