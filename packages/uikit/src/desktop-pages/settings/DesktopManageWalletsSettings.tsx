import { FC, forwardRef, Fragment, useMemo } from 'react';
import {
    DragDropContext,
    Draggable,
    DraggableProvidedDragHandleProps,
    Droppable
} from 'react-beautiful-dnd';
import styled, { css } from 'styled-components';
import { DropDownContent, DropDownItem } from '../../components/DropDown';
import { EllipsisIcon, FolderIcon, PlusIcon, ReorderIcon } from '../../components/Icon';
import { ListBlockDesktopAdaptive, ListItem } from '../../components/List';
import { Body2Class, Label2, TextEllipsis } from '../../components/Text';
import { WalletEmoji } from '../../components/shared/emoji/WalletEmoji';
import { useTranslation } from '../../hooks/translation';
import { useAccountsState, useAccountsDNDDrop, useActiveTonNetwork } from '../../state/wallet';
import {
    Account,
    AccountKeystone,
    AccountLedger,
    AccountMAM,
    AccountTonMnemonic,
    AccountTonMultisig,
    AccountTonOnly,
    AccountTonWatchOnly
} from '@tonkeeper/core/dist/entries/account';
import { useAddWalletNotification } from '../../components/modals/AddWalletNotificationControlled';
import {
    DesktopViewHeader,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import {
    AccountBadge,
    WalletIndexBadge,
    WalletVersionBadge
} from '../../components/account/AccountBadge';
import {
    AccountsFolder,
    applySideBarSorting,
    useGlobalPreferences
} from '../../state/global-preferences';
import {
    sortDerivationsByIndex,
    sortWalletsByVersion,
    WalletId
} from '@tonkeeper/core/dist/entries/wallet';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { assertUnreachable } from '@tonkeeper/core/dist/utils/types';
import { useMultisigsOfAccountToDisplay } from '../../state/multisig';
import { SelectDropDown } from '../../components/fields/Select';
import { useRenameNotification } from '../../components/modals/RenameNotificationControlled';
import { useDeleteAccountNotification } from '../../components/modals/DeleteAccountNotificationControlled';
import { useRecoveryNotification } from '../../components/modals/RecoveryNotificationControlled';
import { Button } from '../../components/fields/Button';
import { useManageFolderNotification } from '../../components/modals/ManageFolderNotificationControlled';

const Row = styled.div`
    height: 40px;
    box-sizing: border-box;
    display: flex;
    gap: 0.5rem;
    align-items: center;

    width: 100%;
`;

const SubRow = styled(Row)`
    padding-left: 52px !important;
`;

const Icon = styled.span`
    display: flex;
    color: ${props => props.theme.iconSecondary};
`;

const DropDownStyled = styled(SelectDropDown)`
    margin-left: auto;
    width: fit-content;
`;

const ListItemStyled = styled(ListItem)<{ $isDragging: boolean }>`
    flex-direction: column;
    ${p =>
        p.$isDragging &&
        css`
            border-radius: unset !important;
            background-color: ${p.theme.backgroundContent};
            > div {
                border: none !important;
            }
        `}
`;

const BottomButtonContainer = styled.div`
    padding: 1rem;
`;

const NewFolderButton = styled.button`
    border: none;
    background-color: transparent;
    padding: 0.5rem 1rem;
    display: flex;
    align-items: center;
    justify-content: center;

    color: ${p => p.theme.textAccent};
    margin-left: auto;
    ${Body2Class};
`;

export const DesktopManageAccountsPage = () => {
    const { onOpen: addWallet } = useAddWalletNotification();
    const { onOpen: manageFolders } = useManageFolderNotification();
    const { t } = useTranslation();

    const accounts = useAccountsState();
    const handleDrop = useAccountsDNDDrop();

    const { folders, sideBarOrder } = useGlobalPreferences();
    const items = useMemo(
        () =>
            applySideBarSorting(
                (accounts as (Account | AccountsFolder)[]).concat(folders),
                sideBarOrder
            ),
        [folders, sideBarOrder, accounts]
    );

    return (
        <DesktopViewPageLayout>
            <DesktopViewHeader>
                <Label2>{t('Manage_wallets')}</Label2>
                <NewFolderButton onClick={() => manageFolders()}>
                    {t('accounts_new_folder')}
                </NewFolderButton>
            </DesktopViewHeader>
            <DragDropContext onDragEnd={handleDrop}>
                <Droppable droppableId="wallets">
                    {provided => (
                        <ListBlockDesktopAdaptive
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            margin={false}
                        >
                            {items.map((item, index) => (
                                <Draggable key={item.id} draggableId={item.id} index={index}>
                                    {(p, snapshot) => {
                                        const transform = p.draggableProps.style?.transform;
                                        if (transform) {
                                            try {
                                                const tr = transform.split(',')[1];
                                                p.draggableProps.style!.transform =
                                                    'translate(0px,' + tr;
                                            } catch (_) {
                                                //
                                            }
                                        }

                                        return (
                                            <ListItemStyled
                                                hover={false}
                                                ref={p.innerRef}
                                                {...p.draggableProps}
                                                $isDragging={snapshot.isDragging}
                                            >
                                                <ItemRow
                                                    dragHandleProps={p.dragHandleProps}
                                                    item={item}
                                                />
                                            </ListItemStyled>
                                        );
                                    }}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </ListBlockDesktopAdaptive>
                    )}
                </Droppable>
            </DragDropContext>

            <BottomButtonContainer>
                <Button secondary fullWidth onClick={() => addWallet()}>
                    <PlusIcon />
                    {t('add_wallet')}
                </Button>
            </BottomButtonContainer>
        </DesktopViewPageLayout>
    );
};

const Label2Styled = styled(Label2)`
    ${TextEllipsis}
`;

const useAccountOptions = () => {
    const { onOpen: onRename } = useRenameNotification();
    const { onOpen: onDelete } = useDeleteAccountNotification();
    const { onOpen: onRecovery } = useRecoveryNotification();

    return {
        onRename,
        onDelete,
        onRecovery
    };
};

const AccountBadgeStyled = styled(AccountBadge)`
    margin-left: -4px;
`;

const WalletVersionBadgeStyled = styled(WalletVersionBadge)`
    margin-left: -4px;
`;

const WalletIndexBadgeStyled = styled(WalletIndexBadge)`
    margin-left: -4px;
`;

const DropDownItemStyled = styled(DropDownItem)`
    &:not(:last-child) {
        border-bottom: 1px solid ${p => p.theme.separatorCommon};
    }
`;

const AccountMenu: FC<{ options: { name: string; onClick: () => void }[] }> = ({ options }) => {
    return (
        <DropDownStyled
            right="1rem"
            top="0.5rem"
            payload={onClose => (
                <DropDownContent>
                    {options.map(option => (
                        <DropDownItemStyled
                            onClick={() => {
                                onClose();
                                option.onClick();
                            }}
                            isSelected={false}
                            key={option.name}
                        >
                            <Label2>{option.name}</Label2>
                        </DropDownItemStyled>
                    ))}
                </DropDownContent>
            )}
        >
            <Icon>
                <EllipsisIcon />
            </Icon>
        </DropDownStyled>
    );
};

const MultisigsGroupRows: FC<{
    hostWalletId: WalletId;
}> = ({ hostWalletId }) => {
    const multisigsToDisplay = useMultisigsOfAccountToDisplay(hostWalletId);
    return (
        <>
            {multisigsToDisplay.map(val => (
                <MultisigItemRow
                    key={val.account.id}
                    account={val.account}
                    hostWalletId={hostWalletId}
                />
            ))}
        </>
    );
};

const MultisigItemRow = forwardRef<
    HTMLDivElement,
    {
        account: AccountTonMultisig;
        hostWalletId: WalletId;
    }
>(({ account }, ref) => {
    const { onRename } = useAccountOptions();
    const { t } = useTranslation();
    return (
        <SubRow ref={ref}>
            <WalletEmoji emojiSize="16px" containerSize="16px" emoji={account.emoji} />
            <Label2Styled>{account.name}</Label2Styled>
            <AccountBadgeStyled accountType={account.type} size="s" />
            <AccountMenu
                options={[
                    { name: t('Rename'), onClick: () => onRename({ accountId: account.id }) }
                ]}
            />
        </SubRow>
    );
});

const AccountMnemonicRow: FC<{
    account: AccountTonMnemonic;
    dragHandleProps: DraggableProvidedDragHandleProps | null | undefined;
}> = ({ account, dragHandleProps }) => {
    const network = useActiveTonNetwork();
    const { t } = useTranslation();
    const { onRename, onDelete, onRecovery } = useAccountOptions();

    const sortedWallets = account.tonWallets.slice().sort(sortWalletsByVersion);

    return (
        <>
            <Row>
                <Icon {...dragHandleProps}>
                    <ReorderIcon />
                </Icon>
                <WalletEmoji emojiSize="16px" containerSize="16px" emoji={account.emoji} />
                <Label2Styled>{account.name}</Label2Styled>
                <AccountMenu
                    options={[
                        { name: t('Rename'), onClick: () => onRename({ accountId: account.id }) },
                        {
                            name: t('settings_backup_seed'),
                            onClick: () => onRecovery({ accountId: account.id })
                        },
                        {
                            name: t('settings_delete_account'),
                            onClick: () => onDelete({ accountId: account.id })
                        }
                    ]}
                />
            </Row>
            {sortedWallets.length === 1 && (
                <MultisigsGroupRows hostWalletId={sortedWallets[0].id} />
            )}
            {sortedWallets.length > 1 &&
                sortedWallets.map(wallet => (
                    <Fragment key={wallet.id}>
                        <SubRow>
                            <Label2Styled>
                                {toShortValue(formatAddress(wallet.rawAddress, network))}
                            </Label2Styled>
                            <WalletVersionBadgeStyled size="s" walletVersion={wallet.version} />
                        </SubRow>
                        <MultisigsGroupRows hostWalletId={wallet.id} />
                    </Fragment>
                ))}
        </>
    );
};

const AccountLedgerRow: FC<{
    account: AccountLedger;
    dragHandleProps: DraggableProvidedDragHandleProps | null | undefined;
}> = ({ account, dragHandleProps }) => {
    const network = useActiveTonNetwork();
    const { t } = useTranslation();
    const { onRename, onDelete } = useAccountOptions();

    const sortedDerivations = account.derivations.slice().sort(sortDerivationsByIndex);
    return (
        <>
            <Row>
                <Icon {...dragHandleProps}>
                    <ReorderIcon />
                </Icon>
                <WalletEmoji emojiSize="16px" containerSize="16px" emoji={account.emoji} />
                <Label2Styled>{account.name}</Label2Styled>
                <AccountBadgeStyled accountType={account.type} size="s" />
                <AccountMenu
                    options={[
                        { name: t('Rename'), onClick: () => onRename({ accountId: account.id }) },
                        {
                            name: t('settings_delete_account'),
                            onClick: () => onDelete({ accountId: account.id })
                        }
                    ]}
                />
            </Row>
            {sortedDerivations.length > 1 &&
                sortedDerivations.map(derivation => {
                    const wallet = derivation.tonWallets.find(
                        w => w.id === derivation.activeTonWalletId
                    )!;

                    return (
                        <SubRow key={derivation.index}>
                            <Label2Styled>
                                {toShortValue(formatAddress(wallet.rawAddress, network))}
                            </Label2Styled>
                            <WalletIndexBadgeStyled size="s">
                                {'#' + (derivation.index + 1)}
                            </WalletIndexBadgeStyled>
                        </SubRow>
                    );
                })}
        </>
    );
};

const AccountTonOnlyRow: FC<{
    account: AccountTonOnly;
    dragHandleProps: DraggableProvidedDragHandleProps | null | undefined;
}> = ({ account, dragHandleProps }) => {
    const network = useActiveTonNetwork();
    const { t } = useTranslation();
    const { onRename, onDelete } = useAccountOptions();

    const sortedWallets = account.tonWallets.slice().sort(sortWalletsByVersion);
    return (
        <>
            <Row>
                <Icon {...dragHandleProps}>
                    <ReorderIcon />
                </Icon>
                <WalletEmoji emojiSize="16px" containerSize="16px" emoji={account.emoji} />
                <Label2Styled>{account.name}</Label2Styled>
                <AccountBadgeStyled accountType={account.type} size="s" />
                <AccountMenu
                    options={[
                        { name: t('Rename'), onClick: () => onRename({ accountId: account.id }) },
                        {
                            name: t('settings_delete_account'),
                            onClick: () => onDelete({ accountId: account.id })
                        }
                    ]}
                />
            </Row>
            {sortedWallets.length === 1 && (
                <MultisigsGroupRows hostWalletId={sortedWallets[0].id} />
            )}
            {sortedWallets.length > 1 &&
                sortedWallets.map(wallet => (
                    <Fragment key={wallet.id}>
                        <SubRow>
                            <Label2Styled>
                                {toShortValue(formatAddress(wallet.rawAddress, network))}
                            </Label2Styled>
                            <WalletVersionBadgeStyled size="s" walletVersion={wallet.version} />
                        </SubRow>
                        <MultisigsGroupRows hostWalletId={wallet.id} />
                    </Fragment>
                ))}
        </>
    );
};

const AccountKeystoneRow: FC<{
    account: AccountKeystone;
    dragHandleProps: DraggableProvidedDragHandleProps | null | undefined;
}> = ({ account, dragHandleProps }) => {
    const { t } = useTranslation();
    const { onRename, onDelete } = useAccountOptions();
    return (
        <Row>
            <Icon {...dragHandleProps}>
                <ReorderIcon />
            </Icon>
            <WalletEmoji emojiSize="16px" containerSize="16px" emoji={account.emoji} />
            <Label2Styled>{account.name}</Label2Styled>
            <AccountBadgeStyled accountType={account.type} size="s" />
            <AccountMenu
                options={[
                    { name: t('Rename'), onClick: () => onRename({ accountId: account.id }) },
                    {
                        name: t('settings_delete_account'),
                        onClick: () => onDelete({ accountId: account.id })
                    }
                ]}
            />
        </Row>
    );
};

const AccountWatchOnlyRow: FC<{
    account: AccountTonWatchOnly;
    dragHandleProps: DraggableProvidedDragHandleProps | null | undefined;
}> = ({ account, dragHandleProps }) => {
    const { t } = useTranslation();
    const { onRename, onDelete } = useAccountOptions();
    return (
        <Row>
            <Icon {...dragHandleProps}>
                <ReorderIcon />
            </Icon>
            <WalletEmoji emojiSize="16px" containerSize="16px" emoji={account.emoji} />
            <Label2Styled>{account.name}</Label2Styled>
            <AccountBadgeStyled accountType={account.type} size="s" />
            <AccountMenu
                options={[
                    { name: t('Rename'), onClick: () => onRename({ accountId: account.id }) },
                    {
                        name: t('settings_delete_account'),
                        onClick: () => onDelete({ accountId: account.id })
                    }
                ]}
            />
        </Row>
    );
};

const AccountMAMRow: FC<{
    account: AccountMAM;
    dragHandleProps: DraggableProvidedDragHandleProps | null | undefined;
}> = ({ account, dragHandleProps }) => {
    const { t } = useTranslation();
    const { onRename, onDelete, onRecovery } = useAccountOptions();
    const sortedDerivations = account.derivations.slice().sort(sortDerivationsByIndex);
    return (
        <>
            <Row>
                <Icon {...dragHandleProps}>
                    <ReorderIcon />
                </Icon>
                <WalletEmoji emojiSize="16px" containerSize="16px" emoji={account.emoji} />
                <Label2Styled>{account.name}</Label2Styled>
                <AccountBadgeStyled accountType={account.type} size="s" />
                <AccountMenu
                    options={[
                        { name: t('Rename'), onClick: () => onRename({ accountId: account.id }) },
                        {
                            name: t('settings_backup_seed'),
                            onClick: () => onRecovery({ accountId: account.id })
                        },
                        {
                            name: t('settings_delete_account'),
                            onClick: () => onDelete({ accountId: account.id })
                        }
                    ]}
                />
            </Row>
            {sortedDerivations.map(derivation => {
                return (
                    <Fragment key={derivation.index}>
                        <SubRow>
                            <WalletEmoji
                                emojiSize="16px"
                                containerSize="16px"
                                emoji={derivation.emoji}
                            />
                            <Label2Styled>{derivation.name}</Label2Styled>
                            <WalletIndexBadgeStyled size="s">
                                {'#' + (derivation.index + 1)}
                            </WalletIndexBadgeStyled>
                            <AccountMenu
                                options={[
                                    {
                                        name: t('Rename'),
                                        onClick: () =>
                                            onRename({
                                                accountId: account.id,
                                                derivationIndex: derivation.index
                                            })
                                    },
                                    {
                                        name: t('settings_backup_seed'),
                                        onClick: () =>
                                            onRecovery({
                                                accountId: account.id,
                                                walletId: derivation.activeTonWalletId
                                            })
                                    }
                                ]}
                            />
                        </SubRow>
                        <MultisigsGroupRows hostWalletId={derivation.activeTonWalletId} />
                    </Fragment>
                );
            })}
        </>
    );
};

const AccountMultisigRow = () => {
    return null;
};

const AccountRow: FC<{
    account: Account;
    dragHandleProps: DraggableProvidedDragHandleProps | null | undefined;
}> = ({ account, ...rest }) => {
    switch (account.type) {
        case 'mnemonic':
            return <AccountMnemonicRow account={account} {...rest} />;
        case 'ledger':
            return <AccountLedgerRow account={account} {...rest} />;
        case 'ton-only':
            return <AccountTonOnlyRow account={account} {...rest} />;
        case 'keystone':
            return <AccountKeystoneRow account={account} {...rest} />;
        case 'watch-only':
            return <AccountWatchOnlyRow account={account} {...rest} />;
        case 'mam':
            return <AccountMAMRow account={account} {...rest} />;
        case 'ton-multisig':
            return <AccountMultisigRow />;
        default:
            assertUnreachable(account);
    }
};

const ItemRow: FC<{
    item: Account | AccountsFolder;
    dragHandleProps: DraggableProvidedDragHandleProps | null | undefined;
}> = ({ item, dragHandleProps }) => {
    const accounts = useAccountsState();
    if (item.type === 'folder') {
        return (
            <>
                <Row>
                    <Icon {...dragHandleProps}>
                        <ReorderIcon />
                    </Icon>
                    <Icon>
                        <FolderIcon />
                    </Icon>
                    <Label2Styled>{item.name}</Label2Styled>
                </Row>
                {item.accounts.map(acc => (
                    <ItemRow
                        key={acc}
                        item={accounts.find(a => a.id === acc)!}
                        dragHandleProps={dragHandleProps}
                    />
                ))}
            </>
        );
    }

    return <AccountRow account={item} dragHandleProps={dragHandleProps} />;
};
