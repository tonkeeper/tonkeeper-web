import { FC, forwardRef, Fragment, ReactNode } from 'react';
import React from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import styled, { css } from 'styled-components';
import { DropDownContent, DropDownItem } from '../../components/DropDown';
import {
    EllipsisIcon,
    FolderIcon,
    KeyIcon,
    ListIcon,
    PencilIcon,
    PlusIcon,
    PlusIconSmall,
    ReorderIcon,
    TrashBinIcon
} from '../../components/Icon';
import { ListBlockDesktopAdaptive, ListItem } from '../../components/List';
import { Label2, TextEllipsis } from '../../components/Text';
import { WalletEmoji } from '../../components/shared/emoji/WalletEmoji';
import { useTranslation } from '../../hooks/translation';
import {
    Account,
    AccountKeystone,
    AccountLedger,
    AccountMAM,
    AccountTonMnemonic,
    AccountTonMultisig,
    AccountTonOnly,
    AccountTonSK,
    AccountTonTestnet,
    AccountTonWatchOnly
} from '@tonkeeper/core/dist/entries/account';
import { useAddWalletNotification } from '../../components/modals/AddWalletNotificationControlled';
import {
    DesktopViewHeader,
    DesktopViewHeaderContent,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import {
    AccountBadge,
    WalletIndexBadge,
    WalletVersionBadge
} from '../../components/account/AccountBadge';
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
import {
    AccountsFolder,
    useAccountsDNDDrop,
    useDeleteFolder,
    useSideBarItems
} from '../../state/folders';
import { useIsScrolled } from '../../hooks/useIsScrolled';
import { ForTargetEnv } from '../../components/shared/TargetEnv';
import { cardModalSwipe } from '../../hooks/ionic';
import { Network } from '@tonkeeper/core/dist/entries/network';

const DesktopViewPageLayoutStyled = styled(DesktopViewPageLayout)`
    height: 100%;
`;

const Row = styled.div<{ $tabLevel?: number }>`
    height: 40px;
    box-sizing: border-box;
    display: flex;
    gap: 0.5rem;
    align-items: center;
    border-top: 1px solid ${p => p.theme.separatorCommon};
    padding-top: 7px;
    padding-bottom: 8px;
    padding-right: 1rem;
    ${p => `padding-left: ${16 + (p.$tabLevel ?? 0) * 24}px !important;`}
    border-bottom: none !important;

    width: 100%;
`;

const Icon = styled.span`
    display: flex;
    color: ${props => props.theme.iconSecondary};
`;

const DragHandleMock = styled.div`
    width: 28px;
    height: 28px;
`;

const DropDownStyled = styled(SelectDropDown)`
    margin-left: auto;
    width: fit-content;
`;

const DraggingBlock = styled.div<{ $isDragging: boolean }>`
    ${p =>
        p.$isDragging &&
        css`
            background-color: ${p.theme.backgroundContent};
            > div {
                border: none !important;
            }
        `}
`;

const ListItemStyled = styled(ListItem)<{ $isDragging: boolean }>`
    flex-direction: column;
    ${p =>
        p.$isDragging &&
        css`
            border-radius: unset !important;
            background-color: ${p.theme.backgroundContent};
            div {
                border: none !important;
            }
        `}

    &:last-child {
        border-bottom: 1px solid ${p => p.theme.separatorCommon};
    }
`;

const BottomButtonContainer = styled.div`
    padding: 1rem;
`;

type DragHandleProps = React.HTMLAttributes<HTMLElement> | undefined;

const SortableOuterItem: FC<{
    item: Account | AccountsFolder;
    handleFolderDrop: (event: DragEndEvent, folderId: string) => void;
}> = ({ item, handleFolderDrop }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item.id
    });
    const style: React.CSSProperties = {
        transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
        transition
    };
    return (
        <ListItemStyled
            hover={false}
            ref={setNodeRef}
            style={style}
            $isDragging={isDragging}
            {...attributes}
        >
            <ItemRow
                dragHandleProps={listeners as DragHandleProps}
                handleFolderDrop={handleFolderDrop}
                item={item}
            />
        </ListItemStyled>
    );
};

const SortableFolderItem: FC<{ acc: Account; tabLevel: number }> = ({ acc, tabLevel }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: acc.id
    });
    const style: React.CSSProperties = {
        transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
        transition
    };
    return (
        <DraggingBlock
            $isDragging={isDragging}
            ref={setNodeRef}
            style={style}
            {...attributes}
        >
            <ItemRow item={acc} dragHandleProps={listeners as DragHandleProps} tabLevel={tabLevel} />
        </DraggingBlock>
    );
};

export const DesktopManageAccountsPage = () => {
    const { ref: scrollRef, closeTop } = useIsScrolled();
    const { onOpen: addWallet } = useAddWalletNotification();
    const { onOpen: manageFolders } = useManageFolderNotification();
    const { t } = useTranslation();

    const items = useSideBarItems();
    const { handleSidebarDrop, handleFolderDrop, itemsOptimistic } = useAccountsDNDDrop(items);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    return (
        <DesktopViewPageLayoutStyled ref={scrollRef}>
            <DesktopViewHeader borderBottom={!closeTop}>
                <DesktopViewHeaderContent
                    title={t('Manage_wallets')}
                    right={
                        <DesktopViewHeaderContent.Right>
                            <DesktopViewHeaderContent.RightItem
                                onClick={() => manageFolders()}
                                asDesktopButton
                                closeDropDownOnClick
                            >
                                <ForTargetEnv env="mobile">
                                    <PlusIconSmall />
                                </ForTargetEnv>
                                {t('accounts_new_folder')}
                            </DesktopViewHeaderContent.RightItem>
                        </DesktopViewHeaderContent.Right>
                    }
                />
            </DesktopViewHeader>
            <DndContext
                sensors={sensors}
                onDragEnd={e => {
                    handleSidebarDrop(e);
                    cardModalSwipe.unlock();
                }}
                onDragStart={() => cardModalSwipe.lock()}
                modifiers={[restrictToVerticalAxis]}
            >
                <SortableContext
                    items={itemsOptimistic.map(i => i.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <ListBlockDesktopAdaptive margin={false}>
                        {itemsOptimistic.map(item => (
                            <SortableOuterItem
                                key={item.id}
                                item={item}
                                handleFolderDrop={handleFolderDrop}
                            />
                        ))}
                    </ListBlockDesktopAdaptive>
                </SortableContext>
            </DndContext>

            <BottomButtonContainer>
                <Button secondary fullWidth onClick={() => addWallet()}>
                    <PlusIcon />
                    {t('add_wallet')}
                </Button>
            </BottomButtonContainer>
        </DesktopViewPageLayoutStyled>
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

const IconWrapper = styled.div`
    margin-left: auto;
    display: flex;
    color: ${p => p.theme.accentBlue};
`;

const AccountMenu: FC<{ options: { name: string; onClick: () => void; icon: ReactNode }[] }> = ({
    options
}) => {
    return (
        <DropDownStyled
            right="0"
            top="0"
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
                            <IconWrapper>{option.icon}</IconWrapper>
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
    tabLevel: number;
}> = ({ hostWalletId, tabLevel }) => {
    const multisigsToDisplay = useMultisigsOfAccountToDisplay(hostWalletId);
    return (
        <>
            {multisigsToDisplay.map(val => (
                <MultisigItemRow key={val.account.id} account={val.account} tabLevel={tabLevel} />
            ))}
        </>
    );
};

const MultisigItemRow = forwardRef<
    HTMLDivElement,
    {
        account: AccountTonMultisig;
        tabLevel: number;
    }
>(({ account, tabLevel }, ref) => {
    const { onRename } = useAccountOptions();
    const { t } = useTranslation();
    return (
        <Row ref={ref} $tabLevel={tabLevel}>
            <DragHandleMock />
            <WalletEmoji emojiSize="16px" containerSize="16px" emoji={account.emoji} />
            <Label2Styled>{account.name}</Label2Styled>
            <AccountBadgeStyled accountType={account.type} size="s" />
            <AccountMenu
                options={[
                    {
                        name: t('Rename'),
                        onClick: () => onRename({ accountId: account.id }),
                        icon: <PencilIcon />
                    }
                ]}
            />
        </Row>
    );
});

const AccountMnemonicRow: FC<{
    account: AccountTonMnemonic | AccountTonTestnet | AccountTonSK;
    dragHandleProps?: DragHandleProps;
    tabLevel: number;
}> = ({ account, dragHandleProps, tabLevel }) => {
    const { t } = useTranslation();
    const { onRename, onDelete, onRecovery } = useAccountOptions();

    const sortedWallets = account.tonWallets.slice().sort(sortWalletsByVersion);

    return (
        <>
            <Row $tabLevel={tabLevel}>
                {dragHandleProps ? (
                    <Icon {...dragHandleProps}>
                        <ReorderIcon />
                    </Icon>
                ) : (
                    <DragHandleMock />
                )}
                <WalletEmoji emojiSize="16px" containerSize="16px" emoji={account.emoji} />
                <Label2Styled>{account.name}</Label2Styled>
                <AccountMenu
                    options={[
                        {
                            name: t('Rename'),
                            onClick: () => onRename({ accountId: account.id }),
                            icon: <PencilIcon />
                        },
                        {
                            name: t('settings_backup_seed'),
                            onClick: () => onRecovery({ accountId: account.id }),
                            icon: <KeyIcon color="accentBlue" />
                        },
                        {
                            name: t('settings_delete_account'),
                            onClick: () => onDelete({ accountId: account.id }),
                            icon: <TrashBinIcon />
                        }
                    ]}
                />
            </Row>
            {sortedWallets.length === 1 && (
                <MultisigsGroupRows hostWalletId={sortedWallets[0].id} tabLevel={tabLevel + 1} />
            )}
            {sortedWallets.length > 1 &&
                sortedWallets.map(wallet => (
                    <Fragment key={wallet.id}>
                        <Row $tabLevel={tabLevel + 1}>
                            <DragHandleMock />
                            <Label2Styled>
                                {toShortValue(
                                    formatAddress(
                                        wallet.rawAddress,
                                        account.type === 'testnet'
                                            ? Network.TESTNET
                                            : Network.MAINNET
                                    )
                                )}
                            </Label2Styled>
                            <WalletVersionBadgeStyled size="s" walletVersion={wallet.version} />
                        </Row>
                        <MultisigsGroupRows hostWalletId={wallet.id} tabLevel={tabLevel + 2} />
                    </Fragment>
                ))}
        </>
    );
};

const AccountLedgerRow: FC<{
    account: AccountLedger;
    dragHandleProps?: DragHandleProps;
    tabLevel: number;
}> = ({ account, dragHandleProps, tabLevel }) => {
    const { t } = useTranslation();
    const { onRename, onDelete } = useAccountOptions();

    const sortedDerivations = account.derivations.slice().sort(sortDerivationsByIndex);
    return (
        <>
            <Row $tabLevel={tabLevel}>
                {dragHandleProps ? (
                    <Icon {...dragHandleProps}>
                        <ReorderIcon />
                    </Icon>
                ) : (
                    <DragHandleMock />
                )}
                <WalletEmoji emojiSize="16px" containerSize="16px" emoji={account.emoji} />
                <Label2Styled>{account.name}</Label2Styled>
                <AccountBadgeStyled accountType={account.type} size="s" />
                <AccountMenu
                    options={[
                        {
                            name: t('Rename'),
                            onClick: () => onRename({ accountId: account.id }),
                            icon: <PencilIcon />
                        },
                        {
                            name: t('settings_delete_account'),
                            onClick: () => onDelete({ accountId: account.id }),
                            icon: <TrashBinIcon />
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
                        <Row key={derivation.index} $tabLevel={tabLevel + 1}>
                            <DragHandleMock />
                            <Label2Styled>
                                {toShortValue(formatAddress(wallet.rawAddress, Network.MAINNET))}
                            </Label2Styled>
                            <WalletIndexBadgeStyled size="s">
                                {'#' + (derivation.index + 1)}
                            </WalletIndexBadgeStyled>
                        </Row>
                    );
                })}
        </>
    );
};

const AccountTonOnlyRow: FC<{
    account: AccountTonOnly;
    dragHandleProps?: DragHandleProps;
    tabLevel: number;
}> = ({ account, dragHandleProps, tabLevel }) => {
    const { t } = useTranslation();
    const { onRename, onDelete } = useAccountOptions();

    const sortedWallets = account.tonWallets.slice().sort(sortWalletsByVersion);
    return (
        <>
            <Row $tabLevel={tabLevel}>
                {dragHandleProps ? (
                    <Icon {...dragHandleProps}>
                        <ReorderIcon />
                    </Icon>
                ) : (
                    <DragHandleMock />
                )}
                <WalletEmoji emojiSize="16px" containerSize="16px" emoji={account.emoji} />
                <Label2Styled>{account.name}</Label2Styled>
                <AccountBadgeStyled accountType={account.type} size="s" />
                <AccountMenu
                    options={[
                        {
                            name: t('Rename'),
                            onClick: () => onRename({ accountId: account.id }),
                            icon: <PencilIcon />
                        },
                        {
                            name: t('settings_delete_account'),
                            onClick: () => onDelete({ accountId: account.id }),
                            icon: <TrashBinIcon />
                        }
                    ]}
                />
            </Row>
            {sortedWallets.length === 1 && (
                <MultisigsGroupRows hostWalletId={sortedWallets[0].id} tabLevel={tabLevel + 1} />
            )}
            {sortedWallets.length > 1 &&
                sortedWallets.map(wallet => (
                    <Fragment key={wallet.id}>
                        <Row $tabLevel={tabLevel}>
                            <DragHandleMock />
                            <Label2Styled>
                                {toShortValue(formatAddress(wallet.rawAddress, Network.MAINNET))}
                            </Label2Styled>
                            <WalletVersionBadgeStyled size="s" walletVersion={wallet.version} />
                        </Row>
                        <MultisigsGroupRows hostWalletId={wallet.id} tabLevel={tabLevel + 2} />
                    </Fragment>
                ))}
        </>
    );
};

const AccountKeystoneRow: FC<{
    account: AccountKeystone;
    dragHandleProps?: DragHandleProps;
    tabLevel: number;
}> = ({ account, dragHandleProps, tabLevel }) => {
    const { t } = useTranslation();
    const { onRename, onDelete } = useAccountOptions();
    return (
        <Row $tabLevel={tabLevel}>
            {dragHandleProps ? (
                <Icon {...dragHandleProps}>
                    <ReorderIcon />
                </Icon>
            ) : (
                <DragHandleMock />
            )}
            <WalletEmoji emojiSize="16px" containerSize="16px" emoji={account.emoji} />
            <Label2Styled>{account.name}</Label2Styled>
            <AccountBadgeStyled accountType={account.type} size="s" />
            <AccountMenu
                options={[
                    {
                        name: t('Rename'),
                        onClick: () => onRename({ accountId: account.id }),
                        icon: <PencilIcon />
                    },
                    {
                        name: t('settings_delete_account'),
                        onClick: () => onDelete({ accountId: account.id }),
                        icon: <TrashBinIcon />
                    }
                ]}
            />
        </Row>
    );
};

const AccountWatchOnlyRow: FC<{
    account: AccountTonWatchOnly;
    dragHandleProps?: DragHandleProps;
    tabLevel: number;
}> = ({ account, dragHandleProps, tabLevel }) => {
    const { t } = useTranslation();
    const { onRename, onDelete } = useAccountOptions();
    return (
        <Row $tabLevel={tabLevel}>
            {dragHandleProps ? (
                <Icon {...dragHandleProps}>
                    <ReorderIcon />
                </Icon>
            ) : (
                <DragHandleMock />
            )}
            <WalletEmoji emojiSize="16px" containerSize="16px" emoji={account.emoji} />
            <Label2Styled>{account.name}</Label2Styled>
            <AccountBadgeStyled accountType={account.type} size="s" />
            <AccountMenu
                options={[
                    {
                        name: t('Rename'),
                        onClick: () => onRename({ accountId: account.id }),
                        icon: <PencilIcon />
                    },
                    {
                        name: t('settings_delete_account'),
                        onClick: () => onDelete({ accountId: account.id }),
                        icon: <TrashBinIcon />
                    }
                ]}
            />
        </Row>
    );
};

const AccountMAMRow: FC<{
    account: AccountMAM;
    dragHandleProps?: DragHandleProps;
    tabLevel: number;
}> = ({ account, dragHandleProps, tabLevel }) => {
    const { t } = useTranslation();
    const { onRename, onDelete, onRecovery } = useAccountOptions();
    const sortedDerivations = account.derivations.slice().sort(sortDerivationsByIndex);
    return (
        <>
            <Row $tabLevel={tabLevel}>
                {dragHandleProps ? (
                    <Icon {...dragHandleProps}>
                        <ReorderIcon />
                    </Icon>
                ) : (
                    <DragHandleMock />
                )}
                <WalletEmoji emojiSize="16px" containerSize="16px" emoji={account.emoji} />
                <Label2Styled>{account.name}</Label2Styled>
                <AccountBadgeStyled accountType={account.type} size="s" />
                <AccountMenu
                    options={[
                        {
                            name: t('Rename'),
                            onClick: () => onRename({ accountId: account.id }),
                            icon: <PencilIcon />
                        },
                        {
                            name: t('settings_backup_seed'),
                            onClick: () => onRecovery({ accountId: account.id }),
                            icon: <KeyIcon color="accentBlue" />
                        },
                        {
                            name: t('settings_delete_account'),
                            onClick: () => onDelete({ accountId: account.id }),
                            icon: <TrashBinIcon />
                        }
                    ]}
                />
            </Row>
            {sortedDerivations.map(derivation => {
                return (
                    <Fragment key={derivation.index}>
                        <Row $tabLevel={tabLevel + 1}>
                            <DragHandleMock />
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
                                            }),
                                        icon: <PencilIcon />
                                    },
                                    {
                                        name: t('settings_backup_seed'),
                                        onClick: () =>
                                            onRecovery({
                                                accountId: account.id,
                                                walletId: derivation.activeTonWalletId
                                            }),
                                        icon: <KeyIcon color="accentBlue" />
                                    }
                                ]}
                            />
                        </Row>
                        <MultisigsGroupRows
                            hostWalletId={derivation.activeTonWalletId}
                            tabLevel={tabLevel + 2}
                        />
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
    dragHandleProps?: DragHandleProps;
    tabLevel: number;
}> = ({ account, ...rest }) => {
    switch (account.type) {
        case 'mnemonic':
        case 'testnet':
        case 'sk':
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

const FolderDropableWrapper = styled.div`
    padding: 0 !important;
    border: none !important;
`;

const ItemRow: FC<{
    item: Account | AccountsFolder;
    dragHandleProps?: DragHandleProps;
    handleFolderDrop?: (event: DragEndEvent, folderId: string) => void;
    tabLevel?: number;
}> = ({ item, dragHandleProps, handleFolderDrop, tabLevel = 0 }) => {
    const { t } = useTranslation();
    const { onOpen: onManageFolder } = useManageFolderNotification();
    const deleteFolder = useDeleteFolder();
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    if (item.type === 'folder') {
        if (!item.accounts.length) {
            return null;
        }

        return (
            <>
                <Row $tabLevel={tabLevel}>
                    <Icon {...dragHandleProps}>
                        <ReorderIcon />
                    </Icon>
                    <Icon>
                        <FolderIcon />
                    </Icon>
                    <Label2Styled>{item.name}</Label2Styled>
                    <AccountMenu
                        options={[
                            {
                                name: t('accounts_manage_folder'),
                                onClick: () => onManageFolder({ folderId: item.id }),
                                icon: <PencilIcon />
                            },
                            {
                                name: t('accounts_delete_folder'),
                                onClick: () => deleteFolder(item),
                                icon: <ListIcon />
                            }
                        ]}
                    />
                </Row>
                {item.accounts.length === 1 ? (
                    <ItemRow item={item.accounts[0]} tabLevel={1} />
                ) : (
                    <DndContext
                        sensors={sensors}
                        onDragEnd={e => handleFolderDrop?.(e, item.id)}
                        modifiers={[restrictToVerticalAxis]}
                    >
                        <SortableContext
                            items={item.accounts.map(a => a.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <FolderDropableWrapper>
                                {item.accounts.map(acc => (
                                    <SortableFolderItem
                                        key={acc.id}
                                        acc={acc}
                                        tabLevel={tabLevel + 1}
                                    />
                                ))}
                            </FolderDropableWrapper>
                        </SortableContext>
                    </DndContext>
                )}
            </>
        );
    }

    return <AccountRow account={item} dragHandleProps={dragHandleProps} tabLevel={tabLevel} />;
};
