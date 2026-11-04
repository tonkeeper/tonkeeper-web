import { FC, FormEventHandler, useState } from 'react';

import { walletColorById } from '@tonkeeper/core/dist/entries/walletColor';

import { EmojisList } from '../../../../components/shared/emoji/EmojisList';
import { useNavigate } from '../../../../hooks/router/useNavigate';
import { useTranslation } from '../../../../hooks/translation';
import { useToastMutationError } from '../../../../hooks/useNotification';
import { MultichainRoute } from '../../../../libs/routes';
import { Button, Input } from '../../../../primitives';
import { useMutateRenameAccount } from '../../../../state/wallet';
import { useMutateWalletColor, useWalletColor } from '../../../../state/walletColor';
import { WalletAvatar } from '../wallets/WalletAvatar';
import { SettingsPageLayout } from './SettingsPageLayout';
import { WalletColorPicker } from '../../../../components/shared/WalletColorPicker';
import { useSettingsAccount } from './useSettingsAccount';

/**
 * Customize screen of the multichain settings: rename an account and pick
 * its avatar emoji and colour. Targets the active account unless
 * deep-linked with `?accountId=`. Edits are local until the Save button
 * commits them through the same rename mutation the legacy modal used.
 */
export const SettingsCustomizePage: FC<{ compact?: boolean }> = ({ compact = false }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const account = useSettingsAccount();
    const { mutateAsync: renameAccount, isLoading } = useMutateRenameAccount();
    const currentColor = useWalletColor(account.id);
    const { setWalletColor } = useMutateWalletColor();
    const toastError = useToastMutationError();

    const [name, setName] = useState(account.name);
    const [emoji, setEmoji] = useState(account.emoji);
    const [colorId, setColorId] = useState(currentColor.id);

    const goBack = () => navigate(MultichainRoute.settings);

    const onSubmit: FormEventHandler<HTMLFormElement> = async e => {
        e.preventDefault();
        try {
            await renameAccount({ id: account.id, name: name.trim(), emoji });
            await setWalletColor(account.id, colorId);
        } catch (error) {
            // Neither write can fail on the user's input (the name is already
            // non-empty), so the failure goes to the toast and the form stays
            // editable for another attempt.
            toastError(error);
            return;
        }
        goBack();
    };

    return (
        <SettingsPageLayout compact={compact} title={t('customize')} onBack={goBack}>
            <form onSubmit={onSubmit} className="flex flex-1 flex-col px-4 pb-4">
                <div className="flex flex-col items-center gap-4 py-4">
                    <div data-testid="customize-avatar-preview">
                        <WalletAvatar
                            accountId={account.id}
                            emoji={emoji}
                            size={96}
                            colorHex={walletColorById(colorId)?.hex}
                        />
                    </div>
                    {name && (
                        <div className="max-w-full truncate text-h3 text-textPrimary">{name}</div>
                    )}
                </div>

                <Input id="wallet-name" value={name} onChange={setName} label={t('Wallet_name')} />

                <div className="mt-4">
                    <WalletColorPicker value={colorId} onChange={setColorId} />
                </div>

                <div className="mt-4">
                    <EmojisList onClick={setEmoji} />
                </div>

                <div className="sticky bottom-0 mt-auto bg-backgroundPage pb-px pt-4">
                    <Button
                        type="submit"
                        variant="primaryBlue"
                        size="large"
                        fullWidth
                        loading={isLoading}
                        disabled={!name.trim()}
                    >
                        {t('add_edit_favorite_save')}
                    </Button>
                </div>
            </form>
        </SettingsPageLayout>
    );
};
