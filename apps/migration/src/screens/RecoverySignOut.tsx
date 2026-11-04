import { FC, useState } from 'react';

import { RecoverableAccount } from '../accounts';
import { accountNameText, t } from '../i18n';
import { Layout, PrimaryButton, SecondaryButton, Trans } from './Layout';
import { WalletAvatar } from './WalletAvatar';

/**
 * Signing out takes the last copy of the secret off this origin, so the
 * checkbox is the whole screen: the phrase is still on the previous one, and
 * there is nowhere to ask for it again afterwards.
 */
export const RecoverySignOut: FC<{
    account: RecoverableAccount;
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ account, onConfirm, onCancel }) => {
    const [backedUp, setBackedUp] = useState(false);

    return (
        <Layout
            title={t('recovery_sign_out_title')}
            description={t('recovery_sign_out_description')}
            actions={
                <>
                    <PrimaryButton disabled={!backedUp} onClick={onConfirm}>
                        {t('recovery_sign_out_button')}
                    </PrimaryButton>
                    <SecondaryButton onClick={onCancel}>{t('back')}</SecondaryButton>
                </>
            }
        >
            <div className="p-4">
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-backgroundContent p-4 text-body1 text-textPrimary transition-colors hover:bg-backgroundContentTint">
                    <input
                        type="checkbox"
                        checked={backedUp}
                        onChange={event => setBackedUp(event.target.checked)}
                        className="mt-0.5 size-5 shrink-0 cursor-pointer accent-accentBlue"
                    />
                    <span className="inline-flex flex-wrap items-center gap-1">
                        <Trans
                            k="recovery_sign_out_confirm"
                            parts={{
                                wallet: (
                                    <span className="inline-flex items-center gap-1">
                                        <WalletAvatar emoji={account.emoji} inline />
                                        {accountNameText(account.name)}
                                    </span>
                                )
                            }}
                        />
                    </span>
                </label>
            </div>
        </Layout>
    );
};
