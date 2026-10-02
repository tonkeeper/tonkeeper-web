import { AccountSecret } from '@tonkeeper/core/dist/entries/account';
import { WorldNumber, WorldsGrid } from '@tonkeeper/uikit/dist/components/create/Words';
import { Body1, Body2, H2 } from '@tonkeeper/uikit/dist/components/Text';
import { Button } from '@tonkeeper/uikit/dist/components/fields/Button';
import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { useTranslation } from '@tonkeeper/uikit/dist/hooks/translation';
import { FC } from 'react';
import styled from 'styled-components';

const Root = styled.div`
    display: flex;
    flex-direction: column;
    min-height: var(--app-height, 100%);
    box-sizing: border-box;
    padding: 16px;
`;

const Heading = styled(H2)`
    text-align: center;
    margin: 8px 0 8px;
`;

const Caption = styled(Body2)`
    display: block;
    text-align: center;
    color: ${p => p.theme.textSecondary};
    margin-bottom: 8px;
    text-wrap: balance;
`;

const SkBox = styled.div`
    margin: 1rem 0;
    padding: 1rem;
    border-radius: 12px;
    background: ${p => p.theme.backgroundContent};
    font-family: ${p => p.theme.fontMono};
    word-break: break-all;
    color: ${p => p.theme.textPrimary};
`;

const Bottom = styled.div`
    margin-top: auto;
    padding-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

/**
 * Displays a single account's already-decrypted recovery phrase (or secret
 * key). Decryption happens upstream in RecoveryPasswordSheet, so this page is a
 * pure render of the secret plus the Copy Phrase / Sign Out actions.
 */
export const RecoveryPhrase: FC<{ secret: AccountSecret; onSignOut: () => void }> = ({
    secret,
    onSignOut
}) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();

    const copyValue = secret.type === 'sk' ? secret.sk : secret.mnemonic.join(' ');

    return (
        <Root>
            <Heading>{t('twa_recovery_title')}</Heading>
            <Caption>{t('twa_recovery_subtitle')}</Caption>

            {/* probably unavailable for twa since it had no sk acc import path */}
            {secret.type === 'sk' ? (
                <SkBox>{secret.sk}</SkBox>
            ) : (
                <WorldsGrid wordsNumber={secret.mnemonic.length as 12 | 24}>
                    {secret.mnemonic.map((word, index) => (
                        <Body1 key={index}>
                            <WorldNumber> {index + 1}.</WorldNumber> {word}{' '}
                        </Body1>
                    ))}
                </WorldsGrid>
            )}

            <Bottom>
                <Button
                    primary
                    fullWidth
                    onClick={() => sdk.copyToClipboard(copyValue, t('copied'))}
                >
                    {t('twa_copy_phrase')}
                </Button>
                <Button secondary fullWidth onClick={onSignOut}>
                    {t('twa_sign_out')}
                </Button>
            </Bottom>
        </Root>
    );
};
