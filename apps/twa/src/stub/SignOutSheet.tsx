import { Account } from '@tonkeeper/core/dist/entries/account';
import { Notification } from '@tonkeeper/uikit/dist/components/Notification';
import { Body2, Label1 } from '@tonkeeper/uikit/dist/components/Text';
import { Button } from '@tonkeeper/uikit/dist/components/fields/Button';
import { Checkbox } from '@tonkeeper/uikit/dist/components/fields/Checkbox';
import { WalletEmoji } from '@tonkeeper/uikit/dist/components/shared/emoji/WalletEmoji';
import { useTranslation } from '@tonkeeper/uikit/dist/hooks/translation';
import { FC, useState } from 'react';
import styled from 'styled-components';

const Content = styled.div`
    display: flex;
    flex-direction: column;
`;

const Subtitle = styled(Body2)`
    display: block;
    text-align: center;
    color: ${p => p.theme.textSecondary};
    text-wrap: balance;
    margin-bottom: 24px;
`;

const ConfirmBox = styled.div`
    padding: 16px;
    border-radius: 16px;
    background: ${p => p.theme.backgroundContent};
    margin-bottom: 16px;
`;

// Top-align the checkbox box with the first line of the (multi-line) label.
const TopAlignedCheckbox = styled(Checkbox)`
    align-items: flex-start;
`;

const CheckboxLabel = styled.span`
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 2px;
`;

const InlineEmoji = styled(WalletEmoji)`
    display: inline-flex;
    vertical-align: middle;
`;

const BackUpLink = styled.button`
    border: none;
    outline: none;
    background: transparent;
    padding: 4px 0 0;
    margin-left: 32px;
    cursor: pointer;
    color: ${p => p.theme.accentBlue};
    font: inherit;
`;

export const SignOutSheet: FC<{
    account: Account | null;
    onClose: () => void;
    onBackUp: () => void;
    onConfirm: () => void;
}> = ({ account, onClose, onBackUp, onConfirm }) => {
    const { t } = useTranslation();
    const [checked, setChecked] = useState(false);

    // Reset the checkbox whenever a different account's sheet opens.
    const [lastId, setLastId] = useState<string | undefined>(undefined);
    if (account && account.id !== lastId) {
        setLastId(account.id);
        setChecked(false);
    }

    // "...for %{name}" — render the wallet emoji inline right where the name goes
    // so the checkbox reads "I have a backup copy of the recovery phrase for 🍃 Savings".
    const [before, after] = t('twa_sign_out_backed_up').split('%{name}');

    return (
        <Notification isOpen={!!account} handleClose={onClose} title={t('twa_sign_out')}>
            {afterClose => (
                <Content>
                    <Subtitle>{t('twa_sign_out_subtitle')}</Subtitle>
                    <ConfirmBox>
                        <TopAlignedCheckbox checked={checked} onChange={setChecked} light>
                            <CheckboxLabel>
                                {before}
                                <InlineEmoji
                                    emoji={account?.emoji}
                                    emojiSize="16px"
                                    containerSize="16px"
                                />
                                {account?.name}
                                {after}
                            </CheckboxLabel>
                        </TopAlignedCheckbox>
                        <BackUpLink onClick={() => afterClose(onBackUp)}>
                            <Label1>{t('twa_back_up')}</Label1>
                        </BackUpLink>
                    </ConfirmBox>
                    <Button
                        primary
                        fullWidth
                        disabled={!checked}
                        onClick={() => afterClose(onConfirm)}
                    >
                        {t('twa_sign_out')}
                    </Button>
                </Content>
            )}
        </Notification>
    );
};
