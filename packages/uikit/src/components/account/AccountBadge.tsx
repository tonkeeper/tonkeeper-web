import { Account } from '@tonkeeper/core/dist/entries/account';
import { WalletId, WalletVersion, walletVersionText } from '@tonkeeper/core/dist/entries/wallet';
import { FC, PropsWithChildren } from 'react';
import styled from 'styled-components';
import { Badge } from '../shared';

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
            <Badge size={size} color="accentOrange" className={className}>
                {children || 'Keystone'}
            </Badge>
        );
    }

    if (accountType === 'watch-only') {
        return (
            <Badge size={size} color="accentRed" className={className}>
                {children || 'Watch Only'}
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

const Container = styled.div`
    flex-shrink: 0;
    display: flex;

    & > *:nth-child(2) {
        margin-left: 3px;
    }
`;

export const AccountAndWalletBadgesGroup: FC<{
    account: Account;
    walletId: WalletId;
    size?: 's' | 'm';
    className?: string;
}> = ({ account, walletId, className, size }) => {
    if (account.type === 'ledger') {
        const derivation = account.derivations.find(d => d.tonWallets.some(w => w.id === walletId));
        return (
            <Container className={className}>
                <AccountBadge size={size} accountType={account.type}>
                    Ledger
                </AccountBadge>
                {account.derivations.length > 1 && !!derivation && (
                    <WalletIndexBadge size={size}>#{derivation.index + 1}</WalletIndexBadge>
                )}
            </Container>
        );
    }

    if (account.type === 'ton-only') {
        const wallet = account.tonWallets.find(w => w.id === walletId);
        return (
            <Container className={className}>
                <AccountBadge size={size} accountType={account.type}>
                    Signer
                </AccountBadge>
                {account.tonWallets.length > 1 && !!wallet && (
                    <WalletVersionBadge size={size} walletVersion={wallet.version} />
                )}
            </Container>
        );
    }

    if (account.type === 'keystone') {
        return <AccountBadge className={className} size={size} accountType={account.type} />;
    }

    if (account.type === 'watch-only') {
        return <AccountBadge className={className} size={size} accountType={account.type} />;
    }

    if (account.type === 'mnemonic' && account.tonWallets.length > 1) {
        const wallet = account.tonWallets.find(w => w.id === walletId);
        if (wallet) {
            return (
                <WalletVersionBadge
                    className={className}
                    size={size}
                    walletVersion={wallet.version}
                />
            );
        }
    }

    return null;
};
