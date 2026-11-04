import { FC, ReactNode } from 'react';

import { Account } from '@tonkeeper/core/dist/entries/account';

import { AccountKindTag } from './accountDisplay';
import { useAccountFiatTotalLabel } from './useAccountFiatTotal';
import { WalletAvatar } from './WalletAvatar';

/**
 * One wallet row of the wallets list: avatar, name with its kind tag, and
 * the wallet's fiat total underneath — the same cell in both the switcher
 * and the manage view, as on iOS and Android. Only the accessory differs:
 * a checkmark on the active wallet while switching, edit affordances while
 * editing. A row with accessories of its own isn't a button, so the two
 * are mutually exclusive.
 */
export const WalletRow: FC<{
    account: Account;
    divider: boolean;
    accessory?: ReactNode;
    onClick?: () => void;
}> = ({ account, divider, accessory, onClick }) => {
    const total = useAccountFiatTotalLabel(account);

    const content = (
        <>
            <div className="shrink-0 py-4 pl-4">
                <WalletAvatar accountId={account.id} emoji={account.emoji} />
            </div>
            <div className="min-w-0 flex-1 p-4">
                <div className="flex items-center gap-1.5">
                    <span className="truncate text-label1 text-textPrimary">{account.name}</span>
                    <AccountKindTag type={account.type} />
                </div>
                <div className="truncate text-body2 text-textSecondary">{total}</div>
            </div>
            {accessory}
        </>
    );

    return (
        <div className="bg-backgroundContent">
            {divider && <div className="ml-4 h-[0.5px] bg-separatorCommon" />}
            {onClick ? (
                <button
                    type="button"
                    onClick={onClick}
                    className="flex w-full items-center text-left transition-colors duration-100 hover:bg-backgroundContentTint"
                >
                    {content}
                </button>
            ) : (
                <div className="flex w-full items-center">{content}</div>
            )}
        </div>
    );
};
