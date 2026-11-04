import { FC, useEffect, useState } from 'react';

import { readRecoverableAccounts, RecoverableAccount, removeAccountWrites } from '../accounts';
import { NEW_ORIGIN } from '../config';
import { AccountSecret } from '../crypto';
import { accountLabelText, accountNameText, t } from '../i18n';
import { applyWrites, readStorageSnapshot } from '../storage';
import { BackHeader, Layout, PrimaryButton, SecondaryButton } from './Layout';
import { RecoveryPhrase } from './RecoveryPhrase';
import { RecoverySignOut } from './RecoverySignOut';
import { RecoveryUnlock } from './RecoveryUnlock';
import { WalletAvatar } from './WalletAvatar';

type Step =
    | { kind: 'list' }
    | { kind: 'unlock'; account: RecoverableAccount }
    | { kind: 'phrase'; account: RecoverableAccount; secret: AccountSecret }
    | { kind: 'sign-out'; account: RecoverableAccount; secret: AccountSecret };

const ChevronRight: FC = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
            d="M6 3.5 10.5 8 6 12.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const AccountRow: FC<{ account: RecoverableAccount; onSelect: () => void }> = ({
    account,
    onSelect
}) => (
    <button
        type="button"
        onClick={onSelect}
        className="flex w-full cursor-pointer items-center rounded-2xl bg-backgroundContent text-left transition-colors hover:bg-backgroundContentTint"
    >
        <span className="py-4 pl-4">
            <WalletAvatar emoji={account.emoji} />
        </span>
        <span className="flex min-w-0 flex-grow flex-col py-4 pl-3 pr-4">
            <span className="truncate text-label1 text-textPrimary">
                {accountNameText(account.name)}
            </span>
            {account.label && (
                <span className="truncate text-body2 text-textSecondary">
                    {accountLabelText(account.label)}
                </span>
            )}
        </span>
        <span className="pr-4 text-textTertiary">
            <ChevronRight />
        </span>
    </button>
);

/**
 * The manual way out: every account whose secret is in this browser, each able
 * to show its recovery phrase once its owner has unlocked it, so the wallets
 * can be imported on the new origin by hand.
 *
 * It is the one thing only this origin can do, and it stands on its own — it
 * needs neither the new origin nor a network, which is what makes it the
 * fallback if the automatic handoff is ever switched off.
 */
export const ManualRecovery: FC = () => {
    const [accounts, setAccounts] = useState(() => readRecoverableAccounts(readStorageSnapshot()));
    const [step, setStep] = useState<Step>({ kind: 'list' });

    // Drop back to the list whenever the page is hidden — the user switches
    // tabs or windows, or the OS takes an app-switcher snapshot — so a revealed
    // phrase or a typed password is never left on screen for whoever comes
    // back to it. Resetting on `hidden` rather than on return also keeps the
    // phrase out of that snapshot.
    useEffect(() => {
        const onVisibilityChange = () => {
            if (document.hidden) {
                setStep({ kind: 'list' });
            }
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => document.removeEventListener('visibilitychange', onVisibilityChange);
    }, []);

    const signOut = (account: RecoverableAccount) => {
        applyWrites(removeAccountWrites(readStorageSnapshot(), account));
        setAccounts(readRecoverableAccounts(readStorageSnapshot()));
        setStep({ kind: 'list' });
    };

    switch (step.kind) {
        case 'unlock':
            return (
                <RecoveryUnlock
                    account={step.account}
                    onUnlocked={secret =>
                        setStep({ kind: 'phrase', account: step.account, secret })
                    }
                    onCancel={() => setStep({ kind: 'list' })}
                />
            );
        case 'phrase':
            return (
                <RecoveryPhrase
                    account={step.account}
                    secret={step.secret}
                    onSignOut={() => setStep({ ...step, kind: 'sign-out' })}
                    onDone={() => setStep({ kind: 'list' })}
                />
            );
        case 'sign-out':
            return (
                <RecoverySignOut
                    account={step.account}
                    onConfirm={() => signOut(step.account)}
                    onCancel={() => setStep({ ...step, kind: 'phrase' })}
                />
            );
        case 'list':
            return accounts.length === 0 ? (
                <Layout
                    header={<BackHeader href="/" />}
                    title={t('recovery_nothing_left_title')}
                    description={t('recovery_nothing_left_description')}
                    actions={
                        <PrimaryButton href={`${NEW_ORIGIN}/`}>{t('open_new_app')}</PrimaryButton>
                    }
                />
            ) : (
                <Layout
                    header={<BackHeader href="/" />}
                    title={t('recovery_title')}
                    description={t('recovery_description')}
                    actions={
                        <SecondaryButton href={`${NEW_ORIGIN}/`}>
                            {t('open_new_app')}
                        </SecondaryButton>
                    }
                >
                    <div className="flex flex-col gap-2 p-4">
                        {accounts.map(account => (
                            <AccountRow
                                key={account.id}
                                account={account}
                                onSelect={() => setStep({ kind: 'unlock', account })}
                            />
                        ))}
                    </div>
                </Layout>
            );
    }
};
