import {
    sortDerivationsByIndex,
    sortWalletsByVersion,
    WalletId
} from '@tonkeeper/core/dist/entries/wallet';
import { AsideMenuItem } from '../../shared/AsideItem';
import { WalletEmoji } from '../../shared/emoji/WalletEmoji';
import { Label2 } from '../../Text';
import { GearIconEmpty } from '../../Icon';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import {
    AccountKeystone,
    AccountLedger,
    AccountMAM,
    AccountTonMnemonic,
    AccountTonMultisig,
    AccountTonOnly,
    AccountTonWatchOnly,
    Account
} from '@tonkeeper/core/dist/entries/account';
import { FC, forwardRef } from 'react';
import { useIsHovered } from '../../../hooks/useIsHovered';
import styled from 'styled-components';
import { IconButtonTransparentBackground } from '../../fields/IconButton';
import { useAccountsState, useActiveTonNetwork } from '../../../state/wallet';
import {
    useMultisigsOfAccountToDisplay,
    useMutateMultisigSelectedHostWallet
} from '../../../state/multisig';
import { AccountBadge, WalletIndexBadge, WalletVersionBadge } from '../../account/AccountBadge';
import { useWalletVersionSettingsNotification } from '../../modals/WalletVersionSettingsNotification';
import { useLedgerIndexesSettingsNotification } from '../../modals/LedgerIndexesSettingsNotification';
import { useMAMIndexesSettingsNotification } from '../../modals/MAMIndexesSettingsNotification';
import { assertUnreachable } from '@tonkeeper/core/dist/utils/types';

const GearIconButtonStyled = styled(IconButtonTransparentBackground)<{ isShown: boolean }>`
    margin-left: auto;
    margin-right: -10px;
    flex-shrink: 0;
    padding-left: 0;

    opacity: ${p => (p.isShown ? 1 : 0)};
    transition: opacity 0.15s ease-in-out;
`;

const AsideMenuSubItemContainer = styled.div`
    padding-left: 16px;
`;

const AccountBadgeStyled = styled(AccountBadge)`
    margin-left: -4px;
`;

const MultisigsGroupGap = styled.div`
    height: 8px;
`;

const WalletVersionBadgeStyled = styled(WalletVersionBadge)`
    margin-left: -4px;
`;

const WalletIndexBadgeStyled = styled(WalletIndexBadge)`
    margin-left: -4px;
`;

const AsideMultisigsGroup: FC<{
    onClickWallet: (id: string) => void;
    hostWalletId: WalletId;
}> = ({ hostWalletId, onClickWallet }) => {
    const multisigsToDisplay = useMultisigsOfAccountToDisplay(hostWalletId);

    return (
        <>
            {multisigsToDisplay.map(val => (
                <AsideMultisigItem
                    key={val.account.id}
                    account={val.account}
                    onClickWallet={onClickWallet}
                    hostWalletId={hostWalletId}
                    isSelected={val.isSelected}
                />
            ))}
            {multisigsToDisplay.length > 0 && <MultisigsGroupGap />}
        </>
    );
};

const AsideMultisigItem = forwardRef<
    HTMLDivElement,
    {
        account: AccountTonMultisig;
        onClickWallet: (id: string) => void;
        hostWalletId: WalletId;
        isSelected: boolean;
    }
>(({ account, onClickWallet, hostWalletId, isSelected }, ref) => {
    const { mutateAsync } = useMutateMultisigSelectedHostWallet();

    const onClick = async () => {
        await mutateAsync({ selectedWalletId: hostWalletId, multisigId: account.id });
        onClickWallet(account.activeTonWallet.id);
    };

    return (
        <AsideMenuItem isSelected={isSelected} onClick={onClick} ref={ref}>
            <WalletEmoji emojiSize="16px" containerSize="16px" emoji={account.emoji} />
            <Label2>{account.name}</Label2>
            <AccountBadgeStyled accountType={account.type} size="s" />
        </AsideMenuItem>
    );
});

export const AsideMenuAccountMnemonic: FC<{
    account: AccountTonMnemonic;
    isSelected: boolean;
    onClickWallet: (walletId: WalletId) => void;
}> = ({ account, isSelected, onClickWallet }) => {
    const { isHovered, ref } = useIsHovered<HTMLDivElement>();
    const shouldShowIcon = useAccountsState().length > 1;
    const network = useActiveTonNetwork();

    const { onOpen: openWalletVersionSettings } = useWalletVersionSettingsNotification();
    const sortedWallets = account.tonWallets.slice().sort(sortWalletsByVersion);

    return (
        <>
            <AsideMenuItem
                isSelected={isSelected && sortedWallets.length === 1}
                onClick={() => onClickWallet(sortedWallets[0].id)}
                ref={ref}
            >
                {shouldShowIcon && (
                    <WalletEmoji emojiSize="16px" containerSize="16px" emoji={account.emoji} />
                )}
                <Label2>{account.name}</Label2>
                <GearIconButtonStyled
                    onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        openWalletVersionSettings({ accountId: account.id });
                    }}
                    isShown={isHovered}
                >
                    <GearIconEmpty />
                </GearIconButtonStyled>
            </AsideMenuItem>
            {sortedWallets.length === 1 && (
                <AsideMultisigsGroup
                    hostWalletId={sortedWallets[0].id}
                    onClickWallet={onClickWallet}
                />
            )}
            {sortedWallets.length > 1 &&
                sortedWallets.map(wallet => (
                    <AsideMenuSubItemContainer key={wallet.id}>
                        <AsideMenuItem
                            isSelected={isSelected && account.activeTonWallet.id === wallet.id}
                            onClick={() => onClickWallet(wallet.id)}
                        >
                            <Label2>
                                {toShortValue(formatAddress(wallet.rawAddress, network))}
                            </Label2>
                            <WalletVersionBadgeStyled size="s" walletVersion={wallet.version} />
                        </AsideMenuItem>
                        <AsideMultisigsGroup
                            hostWalletId={wallet.id}
                            onClickWallet={onClickWallet}
                        />
                    </AsideMenuSubItemContainer>
                ))}
        </>
    );
};

export const AsideMenuAccountLedger: FC<{
    account: AccountLedger;
    isSelected: boolean;
    onClickWallet: (walletId: WalletId) => void;
}> = ({ account, isSelected, onClickWallet }) => {
    const { isHovered, ref } = useIsHovered<HTMLDivElement>();
    const shouldShowIcon = useAccountsState().length > 1;
    const network = useActiveTonNetwork();

    const { onOpen: openLedgerIndexesSettings } = useLedgerIndexesSettingsNotification();
    const sortedDerivations = account.derivations.slice().sort(sortDerivationsByIndex);
    return (
        <>
            <AsideMenuItem
                isSelected={isSelected && sortedDerivations.length === 1}
                onClick={() => onClickWallet(sortedDerivations[0].activeTonWalletId)}
                ref={ref}
            >
                {shouldShowIcon && (
                    <WalletEmoji emojiSize="16px" containerSize="16px" emoji={account.emoji} />
                )}
                <Label2>{account.name}</Label2>
                <AccountBadgeStyled accountType={account.type} size="s" />

                {/*show settings only for non-legacy added ledger accounts*/}
                {account.allAvailableDerivations.length > 1 && (
                    <GearIconButtonStyled
                        onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            openLedgerIndexesSettings({ accountId: account.id });
                        }}
                        isShown={isHovered}
                    >
                        <GearIconEmpty />
                    </GearIconButtonStyled>
                )}
            </AsideMenuItem>
            {sortedDerivations.length === 1 && (
                <AsideMultisigsGroup
                    hostWalletId={sortedDerivations[0].activeTonWalletId}
                    onClickWallet={onClickWallet}
                />
            )}
            {sortedDerivations.length > 1 &&
                sortedDerivations.map(derivation => {
                    const wallet = derivation.tonWallets.find(
                        w => w.id === derivation.activeTonWalletId
                    )!;

                    return (
                        <AsideMenuSubItemContainer key={derivation.index}>
                            <AsideMenuItem
                                isSelected={
                                    isSelected && account.activeDerivationIndex === derivation.index
                                }
                                onClick={() => onClickWallet(derivation.activeTonWalletId)}
                            >
                                <Label2>
                                    {toShortValue(formatAddress(wallet.rawAddress, network))}
                                </Label2>
                                <WalletIndexBadgeStyled size="s">
                                    {'#' + (derivation.index + 1)}
                                </WalletIndexBadgeStyled>
                            </AsideMenuItem>
                            <AsideMultisigsGroup
                                hostWalletId={wallet.id}
                                onClickWallet={onClickWallet}
                            />
                        </AsideMenuSubItemContainer>
                    );
                })}
        </>
    );
};

export const AsideMenuAccountTonOnly: FC<{
    account: AccountTonOnly;
    isSelected: boolean;
    onClickWallet: (walletId: WalletId) => void;
}> = ({ account, isSelected, onClickWallet }) => {
    const { isHovered, ref } = useIsHovered<HTMLDivElement>();
    const shouldShowIcon = useAccountsState().length > 1;
    const network = useActiveTonNetwork();

    const { onOpen: openWalletVersionSettings } = useWalletVersionSettingsNotification();
    const sortedWallets = account.tonWallets.slice().sort(sortWalletsByVersion);
    return (
        <>
            <AsideMenuItem
                isSelected={isSelected && sortedWallets.length === 1}
                onClick={() => onClickWallet(account.activeTonWallet.id)}
                ref={ref}
            >
                {shouldShowIcon && (
                    <WalletEmoji emojiSize="16px" containerSize="16px" emoji={account.emoji} />
                )}
                <Label2>{account.name}</Label2>
                <AccountBadgeStyled accountType={account.type} size="s" />
                <GearIconButtonStyled
                    onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        openWalletVersionSettings({ accountId: account.id });
                    }}
                    isShown={isHovered}
                >
                    <GearIconEmpty />
                </GearIconButtonStyled>
            </AsideMenuItem>
            {sortedWallets.length === 1 && (
                <AsideMultisigsGroup
                    hostWalletId={sortedWallets[0].id}
                    onClickWallet={onClickWallet}
                />
            )}
            {sortedWallets.length > 1 &&
                sortedWallets.map(wallet => (
                    <AsideMenuSubItemContainer key={wallet.id}>
                        <AsideMenuItem
                            isSelected={isSelected && account.activeTonWallet.id === wallet.id}
                            onClick={() => onClickWallet(wallet.id)}
                        >
                            <Label2>
                                {toShortValue(formatAddress(wallet.rawAddress, network))}
                            </Label2>
                            <WalletVersionBadgeStyled size="s" walletVersion={wallet.version} />
                        </AsideMenuItem>
                        <AsideMultisigsGroup
                            hostWalletId={wallet.id}
                            onClickWallet={onClickWallet}
                        />
                    </AsideMenuSubItemContainer>
                ))}
        </>
    );
};

export const AsideMenuAccountKeystone: FC<{
    account: AccountKeystone;
    isSelected: boolean;
    onClickWallet: (walletId: WalletId) => void;
}> = ({ account, isSelected, onClickWallet }) => {
    const shouldShowIcon = useAccountsState().length > 1;

    return (
        <AsideMenuItem
            isSelected={isSelected}
            onClick={() => onClickWallet(account.activeTonWallet.id)}
        >
            {shouldShowIcon && (
                <WalletEmoji emojiSize="16px" containerSize="16px" emoji={account.emoji} />
            )}
            <Label2>{account.name}</Label2>
            <AccountBadgeStyled accountType={account.type} size="s" />
        </AsideMenuItem>
    );
};

export const AsideMenuAccountWatchOnly: FC<{
    account: AccountTonWatchOnly;
    isSelected: boolean;
    onClickWallet: (walletId: WalletId) => void;
}> = ({ account, isSelected, onClickWallet }) => {
    const shouldShowIcon = useAccountsState().length > 1;

    return (
        <AsideMenuItem
            isSelected={isSelected}
            onClick={() => onClickWallet(account.activeTonWallet.id)}
        >
            {shouldShowIcon && (
                <WalletEmoji emojiSize="16px" containerSize="16px" emoji={account.emoji} />
            )}
            <Label2>{account.name}</Label2>
            <AccountBadgeStyled accountType={account.type} size="s" />
        </AsideMenuItem>
    );
};

export const AsideMenuAccountMAM: FC<{
    account: AccountMAM;
    isSelected: boolean;
    onClickWallet: (walletId: WalletId) => void;
}> = ({ account, isSelected, onClickWallet }) => {
    const { isHovered, ref } = useIsHovered<HTMLDivElement>();
    const shouldShowIcon = useAccountsState().length > 1;

    const { onOpen: openMAMIndexesSettings } = useMAMIndexesSettingsNotification();
    const sortedDerivations = account.derivations.slice().sort(sortDerivationsByIndex);
    return (
        <>
            <AsideMenuItem
                isSelected={false}
                onClick={() => onClickWallet(sortedDerivations[0].activeTonWalletId)}
                ref={ref}
            >
                {shouldShowIcon && (
                    <WalletEmoji emojiSize="16px" containerSize="16px" emoji={account.emoji} />
                )}
                <Label2>{account.name}</Label2>
                <AccountBadgeStyled accountType={account.type} size="s" />

                <GearIconButtonStyled
                    onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        openMAMIndexesSettings({ accountId: account.id });
                    }}
                    isShown={isHovered}
                >
                    <GearIconEmpty />
                </GearIconButtonStyled>
            </AsideMenuItem>
            {sortedDerivations.map(derivation => {
                return (
                    <AsideMenuSubItemContainer key={derivation.index}>
                        <AsideMenuItem
                            isSelected={
                                isSelected && account.activeDerivationIndex === derivation.index
                            }
                            onClick={() => onClickWallet(derivation.activeTonWalletId)}
                        >
                            {shouldShowIcon && (
                                <WalletEmoji
                                    emojiSize="16px"
                                    containerSize="16px"
                                    emoji={derivation.emoji}
                                />
                            )}
                            <Label2>{derivation.name}</Label2>
                            <WalletIndexBadgeStyled size="s">
                                {'#' + (derivation.index + 1)}
                            </WalletIndexBadgeStyled>
                        </AsideMenuItem>
                        <AsideMultisigsGroup
                            hostWalletId={derivation.activeTonWalletId}
                            onClickWallet={onClickWallet}
                        />
                    </AsideMenuSubItemContainer>
                );
            })}
        </>
    );
};

export const AsideMenuAccountMultisig = () => {
    return null;
};

export const AsideMenuAccount: FC<{
    account: Account;
    isSelected: boolean;
    onClickWallet: (walletId: WalletId) => void;
}> = ({ account, ...rest }) => {
    switch (account.type) {
        case 'mnemonic':
            return <AsideMenuAccountMnemonic account={account} {...rest} />;
        case 'ledger':
            return <AsideMenuAccountLedger account={account} {...rest} />;
        case 'ton-only':
            return <AsideMenuAccountTonOnly account={account} {...rest} />;
        case 'keystone':
            return <AsideMenuAccountKeystone account={account} {...rest} />;
        case 'watch-only':
            return <AsideMenuAccountWatchOnly account={account} {...rest} />;
        case 'mam':
            return <AsideMenuAccountMAM account={account} {...rest} />;
        case 'ton-multisig':
            return <AsideMenuAccountMultisig />;
        default:
            assertUnreachable(account);
    }
};
