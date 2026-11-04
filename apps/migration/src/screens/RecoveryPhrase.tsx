import { CSSProperties, FC, useState } from 'react';

import { RecoverableAccount } from '../accounts';
import { NEW_ORIGIN } from '../config';
import { AccountSecret } from '../crypto';
import { accountTitleText, t } from '../i18n';
import { BackHeader, Layout, PrimaryButton, SecondaryButton, TextLink } from './Layout';

type CopyState = 'idle' | 'copied' | 'failed';

/**
 * Words run down the columns, so reading order matches how people write a
 * phrase out: two columns on a phone, three in the desktop card.
 */
const PhraseWords: FC<{ words: string[] }> = ({ words }) => (
    <ol
        className="grid grid-flow-col grid-cols-2 grid-rows-[repeat(var(--rows-narrow),auto)] gap-x-4 px-4 pb-4 sm:grid-cols-3 sm:grid-rows-[repeat(var(--rows-wide),auto)]"
        style={
            {
                '--rows-narrow': Math.ceil(words.length / 2),
                '--rows-wide': Math.ceil(words.length / 3)
            } as CSSProperties
        }
    >
        {words.map((word, index) => (
            <li key={index} className="flex items-center gap-2 py-1.5">
                <span className="w-6 shrink-0 text-right text-body2 text-textSecondary">
                    {index + 1}.
                </span>
                <span className="text-label1 text-textPrimary">{word}</span>
            </li>
        ))}
    </ol>
);

/**
 * One account's secret, in the open. Everything that produced it happened in
 * this browser: the vault was decrypted a step ago and nothing about this
 * screen reaches the network.
 */
export const RecoveryPhrase: FC<{
    account: RecoverableAccount;
    secret: AccountSecret;
    onSignOut: () => void;
    onDone: () => void;
}> = ({ account, secret, onSignOut, onDone }) => {
    const [copyState, setCopyState] = useState<CopyState>('idle');

    const copyValue = secret.type === 'sk' ? secret.sk : secret.mnemonic.join(' ');

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(copyValue);
            setCopyState('copied');
        } catch {
            setCopyState('failed');
        }
    };

    return (
        <Layout
            header={<BackHeader onClick={onDone} />}
            title={t('recovery_phrase_title')}
            subtitle={accountTitleText(account)}
            description={t('recovery_phrase_description')}
            actions={
                <>
                    <PrimaryButton href={`${NEW_ORIGIN}/`}>
                        {t('recovery_restore_in_new_app')}
                    </PrimaryButton>
                    <SecondaryButton onClick={copy}>
                        {t(
                            copyState === 'copied'
                                ? 'recovery_copied'
                                : copyState === 'failed'
                                ? 'recovery_copy_blocked'
                                : 'recovery_copy_phrase'
                        )}
                    </SecondaryButton>
                    <TextLink onClick={onSignOut}>{t('recovery_sign_out_link')}</TextLink>
                </>
            }
        >
            {secret.type === 'sk' ? (
                <p className="mx-4 mb-4 break-all rounded-2xl bg-backgroundContent p-4 font-mono text-body2 text-textPrimary">
                    {secret.sk}
                </p>
            ) : (
                <PhraseWords words={secret.mnemonic} />
            )}
        </Layout>
    );
};
