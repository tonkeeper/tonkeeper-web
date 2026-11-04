import { FC, HTMLAttributes, ReactNode, useMemo, useState } from 'react';
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { Account } from '@tonkeeper/core/dist/entries/account';

import { useSortableDndSensors } from '../../../../hooks/useSortableDndSensors';
import { useTranslation } from '../../../../hooks/translation';
import IcChevronDown16 from '../../../../icons/components/IcChevronDown16';
import IcChevronUp16 from '../../../../icons/components/IcChevronUp16';
import IcFolder84 from '../../../../icons/components/IcFolder84';
import IcPencilOutline28 from '../../../../icons/components/IcPencilOutline28';
import IcReorder28 from '../../../../icons/components/IcReorder28';
import {
    AccountsFolder,
    useAccountsDNDDrop,
    useSetFolderLastIsOpened,
    useSideBarItems
} from '../../../../state/folders';
import { WalletRow } from './WalletRow';

/**
 * Folders and loose accounts in sidebar order. Multisigs are left out —
 * they're hosted by a legacy account and have no standalone home.
 */
export const useManageWalletsItems = () => {
    const items = useSideBarItems();
    return useMemo(
        () => items.filter(i => i.type === 'folder' || i.type !== 'ton-multisig'),
        [items]
    );
};

type DragHandleProps = HTMLAttributes<HTMLElement> | undefined;

const RowActions: FC<{
    editLabel: string;
    onEdit: () => void;
    dragHandleProps: DragHandleProps;
}> = ({ editLabel, onEdit, dragHandleProps }) => (
    <div className="flex shrink-0 items-center">
        <button
            type="button"
            aria-label={editLabel}
            onClick={onEdit}
            className="flex items-center py-3.5 pr-4 text-iconSecondary transition-colors hover:text-textPrimary"
        >
            <IcPencilOutline28 className="size-7" />
        </button>
        <span
            {...dragHandleProps}
            className="flex cursor-grab touch-none items-center py-3.5 pr-4 text-iconSecondary"
        >
            <IcReorder28 className="size-7" />
        </span>
    </div>
);

const EditableWalletRow: FC<{
    account: Account;
    onEdit: () => void;
    dragHandleProps: DragHandleProps;
    divider: boolean;
}> = ({ account, onEdit, dragHandleProps, divider }) => {
    const { t } = useTranslation();
    return (
        <WalletRow
            account={account}
            divider={divider}
            accessory={
                <RowActions
                    editLabel={t('Edit')}
                    onEdit={onEdit}
                    dragHandleProps={dragHandleProps}
                />
            }
        />
    );
};

/**
 * Header row of a folder or of the implicit "Other" group. Only real
 * folders carry edit and drag affordances: "Other" can't be renamed,
 * deleted, or moved — it always closes the list.
 */
const GroupHeaderRow: FC<{
    name: string;
    isOpened: boolean;
    onToggleOpen: () => void;
    actions?: ReactNode;
    divider: boolean;
}> = ({ name, isOpened, onToggleOpen, actions, divider }) => (
    <div className="bg-backgroundContent">
        {divider && <div className="ml-4 h-[0.5px] bg-separatorCommon" />}
        <div className="flex w-full items-center">
            <div className="shrink-0 py-3.5 pl-6 text-textPrimary">
                <IcFolder84 className="size-7" />
            </div>
            <button
                type="button"
                onClick={onToggleOpen}
                className="flex min-w-0 flex-1 items-center p-4 text-left"
            >
                <span className="truncate text-label1 text-textPrimary">{name}</span>
                <span className="shrink-0 px-1 py-0.5 text-iconSecondary">
                    {isOpened ? (
                        <IcChevronUp16 className="size-4" />
                    ) : (
                        <IcChevronDown16 className="size-4" />
                    )}
                </span>
            </button>
            {actions}
        </div>
    </div>
);

const SortableWalletInFolder: FC<{ account: Account; onEdit: () => void }> = ({
    account,
    onEdit
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: account.id
    });
    return (
        <div
            ref={setNodeRef}
            style={{
                transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
                transition,
                opacity: isDragging ? 0 : undefined
            }}
        >
            <EditableWalletRow
                account={account}
                onEdit={onEdit}
                dragHandleProps={{ ...attributes, ...listeners } as DragHandleProps}
                divider
            />
        </div>
    );
};

const AccountsDnd: FC<{
    accounts: Account[];
    onEditAccount: (id: string) => void;
    onDragEnd: (event: DragEndEvent) => void;
}> = ({ accounts, onEditAccount, onDragEnd }) => {
    const sensors = useSortableDndSensors();
    const [activeId, setActiveId] = useState<string | null>(null);
    const activeAccount = activeId ? accounts.find(a => a.id === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
            onDragEnd={e => {
                setActiveId(null);
                onDragEnd(e);
            }}
            onDragCancel={() => setActiveId(null)}
            modifiers={[restrictToVerticalAxis]}
        >
            <SortableContext items={accounts.map(a => a.id)} strategy={verticalListSortingStrategy}>
                {accounts.map(account => (
                    <SortableWalletInFolder
                        key={account.id}
                        account={account}
                        onEdit={() => onEditAccount(account.id)}
                    />
                ))}
            </SortableContext>
            <DragOverlay modifiers={[restrictToVerticalAxis]}>
                {activeAccount ? (
                    <EditableWalletRow
                        account={activeAccount}
                        onEdit={() => {}}
                        dragHandleProps={{}}
                        divider={false}
                    />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

const TopLevelItem: FC<{
    item: Account | AccountsFolder;
    divider: boolean;
    dragHandleProps: DragHandleProps;
    onEditAccount: (id: string) => void;
    onEditFolder: (id: string) => void;
    handleFolderDrop: (event: DragEndEvent, folderId: string) => void;
}> = ({ item, divider, dragHandleProps, onEditAccount, onEditFolder, handleFolderDrop }) => {
    const { t } = useTranslation();
    const { mutate: setFolderIsOpened } = useSetFolderLastIsOpened();

    if (item.type === 'folder') {
        return (
            <>
                <GroupHeaderRow
                    name={item.name}
                    isOpened={item.lastIsOpened}
                    divider={divider}
                    onToggleOpen={() =>
                        setFolderIsOpened({ id: item.id, lastIsOpened: !item.lastIsOpened })
                    }
                    actions={
                        <RowActions
                            editLabel={t('accounts_manage_folder')}
                            onEdit={() => onEditFolder(item.id)}
                            dragHandleProps={dragHandleProps}
                        />
                    }
                />
                {item.lastIsOpened && (
                    <AccountsDnd
                        accounts={item.accounts.filter(a => a.type !== 'ton-multisig')}
                        onEditAccount={onEditAccount}
                        onDragEnd={e => handleFolderDrop(e, item.id)}
                    />
                )}
            </>
        );
    }

    return (
        <EditableWalletRow
            account={item}
            divider={divider}
            onEdit={() => onEditAccount(item.id)}
            dragHandleProps={dragHandleProps}
        />
    );
};

const SortableTopLevelItem: FC<{
    item: Account | AccountsFolder;
    divider: boolean;
    onEditAccount: (id: string) => void;
    onEditFolder: (id: string) => void;
    handleFolderDrop: (event: DragEndEvent, folderId: string) => void;
}> = ({ item, ...rest }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item.id
    });
    return (
        <div
            ref={setNodeRef}
            style={{
                transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
                transition,
                opacity: isDragging ? 0 : undefined
            }}
        >
            <TopLevelItem
                item={item}
                dragHandleProps={{ ...attributes, ...listeners } as DragHandleProps}
                {...rest}
            />
        </div>
    );
};

/**
 * Folders reorder at the top level and wallets inside their folder. As soon
 * as one folder exists, every loose wallet is grouped under an implicit
 * "Other" folder pinned to the bottom, as in the sidebar's tab bar — so a
 * list with folders never shows a bare wallet whose membership is unclear.
 * Reordering inside "Other" is a plain sidebar reorder of those wallets.
 * With no folders the wallets themselves are the top-level rows.
 */
export const ManageWalletsList: FC<{
    items: (Account | AccountsFolder)[];
    onEditAccount: (id: string) => void;
    onEditFolder: (id: string) => void;
}> = ({ items, onEditAccount, onEditFolder }) => {
    const { t } = useTranslation();
    const sensors = useSortableDndSensors();
    const { handleSidebarDrop, handleFolderDrop, itemsOptimistic } = useAccountsDNDDrop(items);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [otherIsOpened, setOtherIsOpened] = useState(true);

    const folders = itemsOptimistic.filter(i => i.type === 'folder');
    const looseAccounts = itemsOptimistic.filter(i => i.type !== 'folder') as Account[];
    const groupLoose = folders.length > 0;
    const topLevel = groupLoose ? folders : itemsOptimistic;
    const activeItem = activeId ? topLevel.find(i => i.id === activeId) : null;

    return (
        <>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
                onDragEnd={e => {
                    setActiveId(null);
                    handleSidebarDrop(e);
                }}
                onDragCancel={() => setActiveId(null)}
                modifiers={[restrictToVerticalAxis]}
            >
                <SortableContext
                    items={topLevel.map(i => i.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {topLevel.map((item, i) => (
                        <SortableTopLevelItem
                            key={item.id}
                            item={item}
                            divider={i > 0}
                            onEditAccount={onEditAccount}
                            onEditFolder={onEditFolder}
                            handleFolderDrop={handleFolderDrop}
                        />
                    ))}
                </SortableContext>
                <DragOverlay modifiers={[restrictToVerticalAxis]}>
                    {activeItem ? (
                        <TopLevelItem
                            item={activeItem}
                            divider={false}
                            dragHandleProps={{}}
                            onEditAccount={() => {}}
                            onEditFolder={() => {}}
                            handleFolderDrop={() => {}}
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>
            {groupLoose && looseAccounts.length > 0 && (
                <>
                    <GroupHeaderRow
                        name={t('accounts_folder_other')}
                        isOpened={otherIsOpened}
                        divider={topLevel.length > 0}
                        onToggleOpen={() => setOtherIsOpened(open => !open)}
                    />
                    {otherIsOpened && (
                        <AccountsDnd
                            accounts={looseAccounts}
                            onEditAccount={onEditAccount}
                            onDragEnd={handleSidebarDrop}
                        />
                    )}
                </>
            )}
        </>
    );
};
