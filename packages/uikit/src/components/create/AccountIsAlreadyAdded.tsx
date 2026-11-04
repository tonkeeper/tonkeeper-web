import { FC } from 'react';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { useMutateActiveAccountAndWallet, useActiveTonNetwork } from '../../state/wallet';
import { useTranslation } from '../../hooks/translation';
import { handleSubmit } from '../../libs/form';
import { Button } from '../../primitives/Button';
import { ModalFooter, ModalFooterPortal } from '../../primitives/Modal';
import { WalletEmoji } from '../shared/emoji/WalletEmoji';
import { AccountAndWalletBadgesGroup } from '../account/AccountBadge';

export const AccountIsAlreadyAdded: FC<{
    account: Account;
    walletId: string;
    onOpenAccount: () => void;
}> = ({ account, walletId, onOpenAccount }) => {
    const { mutateAsync } = useMutateActiveAccountAndWallet();
    const { t } = useTranslation();
    const network = useActiveTonNetwork();

    const wallet = account.getTonWallet(walletId)!;
    const derivation = account.type === 'mam' ? account.getTonWalletsDerivation(wallet.id) : null;
    const name = derivation?.name ?? account.name;
    const emoji = derivation?.emoji ?? account.emoji;

    const onClick = async () => {
        await mutateAsync({ accountId: account.id, walletId });
        onOpenAccount();
    };

    return (
        <form
            onSubmit={handleSubmit(onClick)}
            className="flex flex-1 flex-col items-center justify-center gap-1 text-center"
        >
            <h2 className="text-h2 text-textPrimary">{t('account_is_already_added_label')}</h2>
            <div className="flex max-w-full items-center gap-1 text-body1 text-textSecondary">
                <WalletEmoji emoji={emoji} emojiSize="20px" containerSize="20px" />
                <span className="truncate">{name}</span>
                {account.allTonWallets.length > 1 && (
                    <>
                        <span aria-hidden>·</span>
                        <span className="shrink-0 text-textTertiary">
                            {toShortValue(formatAddress(wallet.rawAddress, network))}
                        </span>
                    </>
                )}
                <AccountAndWalletBadgesGroup account={account} walletId={wallet.id} />
            </div>
            <ModalFooterPortal>
                <ModalFooter>
                    <Button
                        size="large"
                        variant="primaryBlue"
                        fullWidth
                        type="submit"
                        onClick={onClick}
                        autoFocus
                    >
                        {t('account_is_already_added_action')}
                    </Button>
                </ModalFooter>
            </ModalFooterPortal>
        </form>
    );
};
