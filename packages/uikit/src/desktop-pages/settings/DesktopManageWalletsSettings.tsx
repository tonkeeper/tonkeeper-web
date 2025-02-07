import { FC, forwardRef, Fragment, ReactNode } from 'react';
import {
    DragDropContext,
    Draggable,
    DraggableProvidedDragHandleProps,
    Droppable
} from 'react-beautiful-dnd';
import styled, { css } from 'styled-components';
import { DropDownContent, DropDownItem } from '../../components/DropDown';
import {
    EllipsisIcon,
    FolderIcon,
    KeyIcon,
    ListIcon,
    PencilIcon,
    PlusIcon,
    ReorderIcon,
    TrashBinIcon
} from '../../components/Icon';
import { ListBlockDesktopAdaptive, ListItem } from '../../components/List';
import { Body2Class, Label2, TextEllipsis } from '../../components/Text';
import { WalletEmoji } from '../../components/shared/emoji/WalletEmoji';
import { useTranslation } from '../../hooks/translation';
import { useActiveTonNetwork } from '../../state/wallet';
import {
    Account,
    AccountKeystone,
    AccountLedger,
    AccountMAM,
    AccountTonMnemonic,
    AccountTonMultisig,
    AccountTonOnly,
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

const NewFolderButton = styled.button`
    border: none;
    background-color: transparent;
    padding: 0.5rem 1rem;
    margin-right: -1rem;
    display: flex;
    align-items: center;
    justify-content: center;

    color: ${p => p.theme.textAccent};
    margin-left: auto;
    ${Body2Class};
`;

export const DesktopManageAccountsPage = () => {
    const { ref: scrollRef, closeTop } = useIsScrolled();
    const { onOpen: addWallet } = useAddWalletNotification();
    const { onOpen: manageFolders } = useManageFolderNotification();
    const { t } = useTranslation();

    const items = useSideBarItems();
    const { handleDrop, itemsOptimistic } = useAccountsDNDDrop(items);

    return (
        <DesktopViewPageLayoutStyled ref={scrollRef}>
            <DesktopViewHeader borderBottom={!closeTop}>
                <DesktopViewHeaderContent
                    title={t('Manage_wallets')}
                    right={
                        <NewFolderButton onClick={() => manageFolders()}>
                            {t('accounts_new_folder')}
                        </NewFolderButton>
                    }
                />
            </DesktopViewHeader>
            <DragDropContext onDragEnd={handleDrop}>
                <Droppable droppableId="settings_wallets" type="all_items">
                    {provided => (
                        <ListBlockDesktopAdaptive
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            margin={false}
                        >
                            {itemsOptimistic.map((item, index) => (
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
    account: AccountTonMnemonic | AccountTonTestnet;
    dragHandleProps?: DraggableProvidedDragHandleProps | null | undefined;
    tabLevel: number;
}> = ({ account, dragHandleProps, tabLevel }) => {
    const network = useActiveTonNetwork();
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
                                {toShortValue(formatAddress(wallet.rawAddress, network))}
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
    dragHandleProps?: DraggableProvidedDragHandleProps | null | undefined;
    tabLevel: number;
}> = ({ account, dragHandleProps, tabLevel }) => {
    const network = useActiveTonNetwork();
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
                                {toShortValue(formatAddress(wallet.rawAddress, network))}
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
    dragHandleProps?: DraggableProvidedDragHandleProps | null | undefined;
    tabLevel: number;
}> = ({ account, dragHandleProps, tabLevel }) => {
    const network = useActiveTonNetwork();
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
                                {toShortValue(formatAddress(wallet.rawAddress, network))}
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
    dragHandleProps?: DraggableProvidedDragHandleProps | null | undefined;
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
    dragHandleProps?: DraggableProvidedDragHandleProps | null | undefined;
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
    dragHandleProps?: DraggableProvidedDragHandleProps | null | undefined;
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
    dragHandleProps?: DraggableProvidedDragHandleProps | null | undefined;
    tabLevel: number;
}> = ({ account, ...rest }) => {
    switch (account.type) {
        case 'mnemonic':
        case 'testnet':
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
    dragHandleProps?: DraggableProvidedDragHandleProps | null | undefined;
    tabLevel?: number;
}> = ({ item, dragHandleProps, tabLevel = 0 }) => {
    const { t } = useTranslation();
    const { onOpen: onManageFolder } = useManageFolderNotification();
    const deleteFolder = useDeleteFolder();

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
                    <Droppable droppableId={'folder_' + item.id} type="folder">
                        {provided => (
                            <FolderDropableWrapper
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                            >
                                {item.accounts.map((acc, index) => (
                                    <Draggable key={acc.id} draggableId={acc.id} index={index}>
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
                                                <DraggingBlock
                                                    $isDragging={snapshot.isDragging}
                                                    ref={p.innerRef}
                                                    {...p.draggableProps}
                                                >
                                                    <ItemRow
                                                        key={acc.id}
                                                        item={acc}
                                                        dragHandleProps={p.dragHandleProps}
                                                        tabLevel={tabLevel + 1}
                                                    />
                                                </DraggingBlock>
                                            );
                                        }}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </FolderDropableWrapper>
                        )}
                    </Droppable>
                )}
            </>
        );
    }

    return <AccountRow account={item} dragHandleProps={dragHandleProps} tabLevel={tabLevel} />;
};
