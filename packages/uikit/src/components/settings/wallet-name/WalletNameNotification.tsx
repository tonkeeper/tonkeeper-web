import { Account } from '@tonkeeper/core/dist/entries/account';
import React, { FC, useCallback, useId, useState } from 'react';
import { useTranslation } from '../../../hooks/translation';
import { useMutateRenameAccount, useMutateRenameAccountDerivation } from '../../../state/wallet';
import {
    Notification,
    NotificationBlock,
    NotificationFooter,
    NotificationFooterPortal
} from '../../Notification';
import { Button } from '../../fields/Button';
import { Input } from '../../fields/Input';
import { WalletEmoji } from '../../shared/emoji/WalletEmoji';
import { EmojisList } from '../../shared/emoji/EmojisList';

export const RenameWalletContent: FC<{
    account: Account;
    derivationIndex?: number;
    animationTime?: number;
    onClose: () => void;
}> = ({ animationTime, account, derivationIndex, onClose }) => {
    const { t } = useTranslation();
    const id = useId();

    const {
        mutateAsync: renameAccount,
        isLoading: isRenamingAccount,
        isError: isErrorRenameAccount
    } = useMutateRenameAccount();
    const {
        mutateAsync: renameDerivation,
        isLoading: isRenamingDerivation,
        isError: isErrorRenameDerivation
    } = useMutateRenameAccountDerivation();

    const isLoading = isRenamingAccount || isRenamingDerivation;
    const isError = isErrorRenameAccount || isErrorRenameDerivation;

    const derivation =
        account.type === 'mam' && derivationIndex !== undefined
            ? account.allAvailableDerivations.find(d => d.index === derivationIndex)
            : undefined;

    const [name, setName] = useState(derivation ? derivation.name : account.name);
    const [emoji, setEmoji] = useState(derivation ? derivation.emoji : account.emoji);
    const onSubmit: React.FormEventHandler<HTMLFormElement> = async e => {
        e.preventDefault();
        if (derivation) {
            await renameDerivation({
                id: account.id,
                derivationIndex: derivation.index,
                name,
                emoji
            });
        } else {
            await renameAccount({ id: account.id, name, emoji });
        }
        onClose();
    };

    return (
        <NotificationBlock onSubmit={onSubmit} id={id}>
            <Input
                id="wallet-name"
                value={name}
                onChange={setName}
                isValid={!isError}
                label={t('Wallet_name')}
                rightElement={emoji ? <WalletEmoji emoji={emoji} /> : null}
                marginRight="36px"
                autoFocus="notification"
            />
            <EmojisList keepShortListForMS={animationTime} onClick={setEmoji} />

            <NotificationFooterPortal>
                <NotificationFooter>
                    <Button
                        form={id}
                        size="large"
                        fullWidth
                        primary
                        loading={isLoading}
                        disabled={isLoading}
                        type="submit"
                    >
                        {t('add_edit_favorite_save')}
                    </Button>
                </NotificationFooter>
            </NotificationFooterPortal>
        </NotificationBlock>
    );
};

export const RenameWalletNotification: FC<{
    account?: Account;
    handleClose: () => void;
}> = ({ account, handleClose }) => {
    const { t } = useTranslation();

    const Content = useCallback(() => {
        if (!account) return undefined;
        return <RenameWalletContent animationTime={1000} account={account} onClose={handleClose} />;
    }, [handleClose, account]);

    return (
        <Notification isOpen={account != null} handleClose={handleClose} title={t('Rename')}>
            {Content}
        </Notification>
    );
};
