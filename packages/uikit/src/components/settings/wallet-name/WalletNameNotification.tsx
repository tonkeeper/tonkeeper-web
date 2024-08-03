import { Account } from '@tonkeeper/core/dist/entries/account';
import React, { FC, useCallback, useState } from 'react';
import { useTranslation } from '../../../hooks/translation';
import { useMutateRenameAccount } from '../../../state/wallet';
import { Notification, NotificationBlock } from '../../Notification';
import { Button } from '../../fields/Button';
import { Input } from '../../fields/Input';
import { WalletEmoji } from '../../shared/emoji/WalletEmoji';
import { EmojisList } from '../../shared/emoji/EmojisList';
import { useAccountLabel } from '../../../hooks/accountUtils';

const RenameWalletContent: FC<{
    account: Account;
    afterClose: (action: () => void) => void;
    animationTime?: number;
}> = ({ animationTime, afterClose, account }) => {
    const { t } = useTranslation();

    const { mutateAsync, isLoading, isError } = useMutateRenameAccount();

    const [name, setName] = useState(account.name);
    const [emoji, setEmoji] = useState(account.emoji);
    const onSubmit: React.FormEventHandler<HTMLFormElement> = async e => {
        e.preventDefault();
        await mutateAsync({ id: account.id, name, emoji });
        afterClose(() => null);
    };

    const label = useAccountLabel(account);

    return (
        <NotificationBlock onSubmit={onSubmit}>
            <Input value={label} disabled label={t('add_edit_favorite_address_label')} />
            <Input
                value={name}
                onChange={setName}
                isValid={!isError}
                label={t('Wallet_name')}
                rightElement={emoji ? <WalletEmoji emoji={emoji} /> : null}
                marginRight="36px"
            />
            <EmojisList keepShortListForMS={animationTime} onClick={setEmoji} />

            <Button
                size="large"
                fullWidth
                primary
                loading={isLoading}
                disabled={isLoading}
                type="submit"
            >
                {t('add_edit_favorite_save')}
            </Button>
        </NotificationBlock>
    );
};

export const RenameWalletNotification: FC<{
    account?: Account;
    handleClose: () => void;
}> = ({ account, handleClose }) => {
    const { t } = useTranslation();

    const Content = useCallback(
        (afterClose: (action: () => void) => void) => {
            if (!account) return undefined;
            return (
                <RenameWalletContent
                    animationTime={1000}
                    account={account}
                    afterClose={afterClose}
                />
            );
        },
        [account]
    );

    return (
        <Notification isOpen={account != null} handleClose={handleClose} title={t('Rename')}>
            {Content}
        </Notification>
    );
};
