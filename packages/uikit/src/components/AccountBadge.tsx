import { FC, PropsWithChildren } from 'react';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { Badge } from './shared';
import { WalletVersion, walletVersionText } from '@tonkeeper/core/dist/entries/wallet';

export const AccountBadge: FC<
    PropsWithChildren<{
        accountType: Account['type'];
        size?: 's' | 'm';
        className?: string;
    }>
> = ({ accountType, size = 'm', className, children }) => {
    if (accountType === 'ledger') {
        return (
            <Badge size={size} color="accentGreen" className={className}>
                {children || 'Ledger'}
            </Badge>
        );
    }

    if (accountType === 'ton-only') {
        return (
            <Badge size={size} color="accentPurple" className={className}>
                {children || 'Signer'}
            </Badge>
        );
    }

    if (accountType === 'keystone') {
        return (
            <Badge size={size} color="accentGreen" className={className}>
                {children || 'Keystone'}
            </Badge>
        );
    }

    return null;
};

export const WalletVersionBadge: FC<{
    walletVersion: WalletVersion;
    size?: 's' | 'm';
    className?: string;
}> = ({ walletVersion, size = 'm', className }) => {
    return (
        <Badge
            size={size}
            background="backgroundContentAttention"
            color="textSecondary"
            className={className}
        >
            {walletVersionText(walletVersion)}
        </Badge>
    );
};

export const WalletIndexBadge: FC<
    PropsWithChildren<{
        size?: 's' | 'm';
        className?: string;
    }>
> = ({ size = 'm', className, children }) => {
    return (
        <Badge
            size={size}
            background="backgroundContentAttention"
            color="textSecondary"
            className={className}
        >
            {children}
        </Badge>
    );
};
