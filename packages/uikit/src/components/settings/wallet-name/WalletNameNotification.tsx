import { WalletState } from '@tonkeeper/core/dist/entries/wallet';
import { formatAddress } from '@tonkeeper/core/dist/utils/common';
import React, { FC, useCallback, useState } from 'react';
import { useTranslation } from '../../../hooks/translation';
import { useMutateRenameWallet } from '../../../state/wallet';
import { Notification, NotificationBlock } from '../../Notification';
import { Button } from '../../fields/Button';
import { Input } from '../../fields/Input';
import { WalletEmoji } from '../../shared/emoji/WalletEmoji';
import { EmojisList } from '../../shared/emoji/EmojisList';

const RenameWalletContent: FC<{
    wallet: WalletState;
    afterClose: (action: () => void) => void;
    animationTime?: number;
}> = ({ animationTime, afterClose, wallet }) => {
    const { t } = useTranslation();

    const { mutateAsync, isLoading, isError } = useMutateRenameWallet(wallet);

    const [name, setName] = useState(wallet.name ?? '');
    const [emoji, setEmoji] = useState(wallet.emoji ?? '');
    const onSubmit: React.FormEventHandler<HTMLFormElement> = async e => {
        e.preventDefault();
        await mutateAsync({ name, emoji });
        afterClose(() => null);
    };

    const address = formatAddress(wallet.active.rawAddress, wallet.network);

    return (
        <NotificationBlock onSubmit={onSubmit}>
            <Input value={address} disabled label={t('add_edit_favorite_address_label')} />
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
    wallet?: WalletState;
    handleClose: () => void;
}> = ({ wallet, handleClose }) => {
    const { t } = useTranslation();

    const Content = useCallback(
        (afterClose: (action: () => void) => void) => {
            if (!wallet) return undefined;
            return (
                <RenameWalletContent animationTime={1000} wallet={wallet} afterClose={afterClose} />
            );
        },
        [wallet]
    );

    return (
        <Notification
            isOpen={wallet != null}
            handleClose={handleClose}
            hideButton
            title={t('Rename')}
        >
            {Content}
        </Notification>
    );
};
