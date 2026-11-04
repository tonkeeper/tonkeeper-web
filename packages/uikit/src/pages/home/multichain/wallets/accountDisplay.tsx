import { FC } from 'react';

import { Account, getNetworkByAccount } from '@tonkeeper/core/dist/entries/account';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';

import { cn } from '../../../../libs/css';
import IcSwitch16 from '../../../../icons/components/IcSwitch16';

/**
 * Kind labels reuse the wording of the legacy `AccountBadge`, which is
 * intentionally untranslated (product names). Plain `mnemonic` accounts
 * carry no label.
 */
export const accountKindLabel: Partial<Record<Account['type'], string>> = {
    multichain: 'Multichain',
    mam: 'Multi',
    ledger: 'Ledger',
    keystone: 'Keystone',
    'ton-only': 'Signer',
    'watch-only': 'Watch Only',
    testnet: 'Testnet'
};

/** The account's TON address in the user-facing form for its network. */
export const accountAddress = (account: Account) =>
    formatAddress(account.activeTonWallet.rawAddress, getNetworkByAccount(account));

export const accountShortAddress = (account: Account) => toShortValue(accountAddress(account));

/**
 * Short TON address with the switch chevrons after it — the caption under
 * a wallet's total that leads to the per-network receiving addresses.
 * Renders inline so the caller decides what it is a part of: a button of
 * its own, or a larger clickable card.
 */
export const AccountAddressLabel: FC<{ account: Account; className?: string }> = ({
    account,
    className
}) => (
    <span
        className={cn('inline-flex items-center gap-0.5 text-body2 text-textSecondary', className)}
    >
        {accountShortAddress(account)}
        <IcSwitch16 className="size-4 shrink-0" />
    </span>
);

/**
 * Small uppercase chip after the account name. The multichain variant is the
 * design library's Accent Tag: label and fill are the same accent token, the
 * fill at 16% — every other kind is the neutral Tag.
 */
export const AccountKindTag: FC<{ type: Account['type'] }> = ({ type }) => {
    const label = accountKindLabel[type];
    if (!label) {
        return null;
    }
    return (
        <span
            className={cn(
                'shrink-0 rounded-extraExtraSmall px-1.5 py-0.5 text-body4Caps uppercase',
                type === 'multichain'
                    ? 'bg-[color-mix(in_srgb,var(--tk-text-accent)_16%,transparent)] text-textAccent'
                    : 'bg-backgroundContentTint text-textSecondary'
            )}
        >
            {label}
        </span>
    );
};
