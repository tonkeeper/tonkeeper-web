import { FC } from 'react';

import { AccountMultichain } from '@tonkeeper/core/dist/entries/account';

import { useTranslation } from '../../../../hooks/translation';
import IcDonemarkOutline28 from '../../../../icons/components/IcDonemarkOutline28';
import { cn } from '../../../../libs/css';
import { WalletEmoji } from '../../../../components/shared/emoji/WalletEmoji';
import { Modal } from '../../../../primitives';

/**
 * "Wallets list" picker of the connect flow: choose which multichain
 * account the dApp connects to.
 */
export const ConnectWalletsSheet: FC<{
    isOpen: boolean;
    accounts: AccountMultichain[];
    selectedId?: string;
    onSelect: (account: AccountMultichain) => void;
    onClose: () => void;
}> = ({ isOpen, accounts, selectedId, onSelect, onClose }) => {
    const { t } = useTranslation();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            variant="content"
            topBarTitle={t('connect_wallets_list')}
        >
            <div className="overflow-hidden rounded-medium bg-backgroundContent">
                {accounts.map((account, index) => (
                    <button
                        key={account.id}
                        type="button"
                        onClick={() => onSelect(account)}
                        className={cn(
                            'flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-backgroundContentTint',
                            index < accounts.length - 1 && 'border-b border-separatorCommon'
                        )}
                    >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-backgroundContentTint">
                            <WalletEmoji
                                emoji={account.emoji}
                                emojiSize="24px"
                                containerSize="24px"
                            />
                        </span>
                        <span className="flex-1 truncate text-label1 text-textPrimary">
                            {account.name}
                        </span>
                        {account.id === selectedId && (
                            <IcDonemarkOutline28 className="size-7 shrink-0 text-textAccent" />
                        )}
                    </button>
                ))}
            </div>
        </Modal>
    );
};
