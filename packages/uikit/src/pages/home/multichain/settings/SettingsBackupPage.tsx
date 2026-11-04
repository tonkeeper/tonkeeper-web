import { FC, useCallback, useEffect, useState } from 'react';
import { AccountSecret } from '@tonkeeper/core/dist/entries/account';
import { KeychainGetError } from '@tonkeeper/core/dist/errors/KeychainError';

import { useAppSdk } from '../../../../hooks/appSdk';
import { useNavigate } from '../../../../hooks/router/useNavigate';
import { useTranslation } from '../../../../hooks/translation';
import { useScreenshotWarning } from '../../../../hooks/useScreenshotWarning';
import { MultichainRoute } from '../../../../libs/routes';
import { Button, Loader } from '../../../../primitives';
import { getAccountSecret } from '../../../../state/mnemonic';
import { cn } from '../../../../libs/css';
import { SettingsPageLayout } from './SettingsPageLayout';
import { useSettingsAccount } from './useSettingsAccount';

/**
 * Reads the target account's secret through the sdk unlock flow: keychain
 * accounts resolve via `sdk.keychain` (biometry / OS prompt), password
 * accounts pop the password notification. A failed or dismissed unlock
 * leaves the screen — the phrase must never render without auth. Targets
 * the active account unless deep-linked with `?accountId=`.
 */
const useSettingsAccountSecret = (onBack: () => void) => {
    const account = useSettingsAccount();
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const [secret, setSecret] = useState<AccountSecret | undefined>(undefined);

    useEffect(() => {
        (async () => {
            try {
                setSecret(await getAccountSecret(sdk, account.id));
            } catch (e) {
                console.error(e);
                if (e instanceof KeychainGetError) {
                    sdk.topMessage(t(e.translate));
                }
                onBack();
            }
        })();
    }, [onBack, account.id, sdk, t]);

    return secret;
};

/**
 * Revealed recovery phrase: warning heading, numbered two-column word grid
 * and a copy button. Exported separately so component tests can render it
 * with a known mnemonic — the page itself only reveals the phrase after
 * the sdk unlock flow succeeds.
 */
export const SettingsBackupView: FC<{ mnemonic: string[] }> = ({ mnemonic }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    useScreenshotWarning();

    return (
        <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col justify-center px-4 pb-4">
            <div className="mb-4 flex flex-col gap-1 px-6 text-center">
                <h2 className="text-h2 text-textPrimary">{t('secret_words_title')}</h2>
                <div className="select-none text-body2 text-textSecondary [text-wrap:balance]">
                    {t(mnemonic.length === 12 ? 'secret_words_caption_12' : 'secret_words_caption')}
                </div>
            </div>

            <div
                className={cn(
                    'mb-4 grid grid-flow-col place-content-evenly gap-2 whitespace-normal',
                    mnemonic.length === 12
                        ? '[grid-template-rows:repeat(6,minmax(0,1fr))]'
                        : '[grid-template-rows:repeat(12,minmax(0,1fr))]'
                )}
            >
                {mnemonic.map((word, index) => (
                    <div key={index} className="text-body1 text-textPrimary">
                        <span className="inline-block w-6 select-none text-body2 leading-6 text-textSecondary">
                            {index + 1}.
                        </span>{' '}
                        {word}
                    </div>
                ))}
            </div>

            <Button
                variant="secondary"
                size="large"
                fullWidth
                onClick={() => sdk.copyToClipboard(mnemonic.join(' '), t('copied'))}
            >
                {t('recovery_phrase_copy_button')}
            </Button>
        </div>
    );
};

export const SettingsBackupPage: FC<{ compact?: boolean }> = ({ compact = false }) => {
    const navigate = useNavigate();
    const onBack = useCallback(() => navigate(MultichainRoute.settings), [navigate]);
    const secret = useSettingsAccountSecret(onBack);
    const mnemonic = secret?.type === 'mnemonic' ? secret.mnemonic : undefined;

    // Multichain accounts are BIP39-backed, so a non-mnemonic secret means
    // this screen was reached with an account it cannot display.
    useEffect(() => {
        if (secret && secret.type !== 'mnemonic') {
            onBack();
        }
    }, [secret, onBack]);

    return (
        <SettingsPageLayout compact={compact} onBack={onBack}>
            {mnemonic ? (
                <SettingsBackupView mnemonic={mnemonic} />
            ) : (
                <div className="flex flex-1 items-center justify-center py-4">
                    <Loader size="small" className="text-iconSecondary" />
                </div>
            )}
        </SettingsPageLayout>
    );
};
