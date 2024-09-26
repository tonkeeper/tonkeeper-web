import { useGlobalPreferences, useMutateGlobalPreferences } from './global-preferences';
import { useMutation } from '@tanstack/react-query';
import { useAccountsState } from './accounts';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { notNullish } from '@tonkeeper/core/dist/utils/types';
import { Account, AccountsFolderStored } from '@tonkeeper/core/dist/entries/account';
import { DropResult, ResponderProvided } from 'react-beautiful-dnd';

export type AccountsFolder = Omit<AccountsFolderStored, 'accounts'> & {
    accounts: Account[];
};

export const useFolders = (): AccountsFolder[] => {
    const { folders } = useGlobalPreferences();
    const accounts = useAccountsState();

    return useMemo(() => {
        return folders
            .map(folder => {
                const accs: Account[] = folder.accounts
                    .map(id => accounts.find(account => account.id === id))
                    .filter(notNullish);

                return {
                    ...folder,
                    accounts: accs
                };
            })
            .filter(f => f.accounts.length > 0);
    }, [folders, accounts]);
};

export const useSideBarItems = (): (Account | AccountsFolder)[] => {
    const accounts = useAccountsState();
    const { sideBarOrder } = useGlobalPreferences();
    const folders = useFolders();

    return useMemo(() => {
        const accountsNotInFolder = accounts.filter(
            a => !folders.some(f => f.accounts.some(i => i.id === a.id))
        );
        return applySideBarSorting(
            (accountsNotInFolder as (Account | AccountsFolder)[]).concat(folders),
            sideBarOrder
        );
    }, [folders, sideBarOrder, accounts]);
};

export const useNewFolderName = () => {
    const { folders } = useGlobalPreferences();

    const checkName = (index = 0): string => {
        const name = 'Folder ' + (index + 1);
        if (!folders.find(folder => folder.name === name)) {
            return name;
        }

        return checkName(index + 1);
    };

    return checkName();
};

export const useUpdateFolder = () => {
    const { folders } = useGlobalPreferences();
    const { mutateAsync } = useMutateGlobalPreferences();
    return useMutation<void, Error, { id?: string; name: string; accounts: string[] }>(
        ({ id, name, accounts }) => {
            const newId =
                id ??
                (
                    folders.reduce((maxId, item) => Math.max(maxId, Number(item.id)), 0) + 1
                ).toString();

            const existingFolder = folders.find(folder => folder.id === newId);

            if (existingFolder) {
                existingFolder.name = name;
                existingFolder.accounts = accounts;
            } else {
                folders.push({
                    id: newId,
                    type: 'folder',
                    accounts,
                    name,
                    lastIsOpened: true
                });
            }

            folders.forEach(f => {
                if (f.id === newId) {
                    return;
                }

                f.accounts = f.accounts.filter(acc => !accounts.includes(acc));
            });

            return mutateAsync({ folders: folders.slice() });
        }
    );
};

export const useSetFolderLastIsOpened = () => {
    const { folders } = useGlobalPreferences();
    const { mutateAsync } = useMutateGlobalPreferences();
    return useMutation<void, Error, { id: string; lastIsOpened: boolean }>(
        ({ id, lastIsOpened }) => {
            const folderIndex = folders.findIndex(f => f.id === id);

            if (folderIndex === -1) {
                throw new Error('Folder not found');
            }

            const newFolders = folders.slice();
            newFolders[folderIndex].lastIsOpened = lastIsOpened;

            return mutateAsync({ folders: newFolders });
        }
    );
};

export const useDeleteFolder = () => {
    const { folders } = useGlobalPreferences();
    const { mutateAsync } = useMutateGlobalPreferences();
    return useMutation<void, Error, { id: string }>(({ id }) => {
        return mutateAsync({ folders: folders.filter(f => f.id !== id) });
    });
};

function applySideBarSorting<T extends { id: string }>(items: T[], order: string[]): T[] {
    return order
        .map(id => items.find(item => item.id === id))
        .filter(notNullish)
        .concat(items.filter(item => !order.includes(item.id)));
}

const folderToStoredFolder = (folder: AccountsFolder): AccountsFolderStored => {
    return {
        ...folder,
        accounts: folder.accounts.map(acc => acc.id)
    };
};

export const useAccountsDNDDrop = (items: (Account | AccountsFolder)[]) => {
    const { mutate } = useMutateGlobalPreferences();
    const folders = useFolders();

    const [itemsOptimistic, setItemsOptimistic] = useState(items);

    useLayoutEffect(() => {
        setItemsOptimistic(items);
    }, [items]);

    const _handleDrop = useCallback<
        (result: DropResult, provided: ResponderProvided) => (Account | AccountsFolder)[]
    >(
        droppedItem => {
            const updatedList = [...items];
            if (!droppedItem.destination) {
                return updatedList;
            }

            const insideFolderId = droppedItem.source.droppableId.startsWith('folder_')
                ? droppedItem.source.droppableId.split('folder_')[1]
                : null;
            if (insideFolderId) {
                if (droppedItem.destination.droppableId !== droppedItem.source.droppableId) {
                    throw new Error('Cannot move item from one folder to another');
                }
                const folder = folders.find(i => i.id === insideFolderId) as AccountsFolder;
                if (!folder) {
                    throw new Error(`Folder ${insideFolderId} not found`);
                }
                const newAccounts = folder.accounts.slice();

                const [reorderedItem] = newAccounts.splice(droppedItem.source.index, 1);
                newAccounts.splice(droppedItem.destination.index, 0, reorderedItem);

                const folderIndex = folders.findIndex(i => i.id === insideFolderId);
                const newFolders = folders.slice();
                newFolders[folderIndex] = { ...folder, accounts: newAccounts };
                mutate({ folders: newFolders.map(folderToStoredFolder) });

                updatedList[updatedList.findIndex(i => i.id === insideFolderId)] = {
                    ...folder,
                    accounts: newAccounts
                };
                return updatedList;
            }

            const [reorderedItem] = updatedList.splice(droppedItem.source.index, 1);
            updatedList.splice(droppedItem.destination.index, 0, reorderedItem);
            mutate({ sideBarOrder: updatedList.map(i => i.id) });
            return updatedList;
        },
        [items, mutate, folders, setItemsOptimistic]
    );

    const handleDrop = useCallback(
        (droppedItem: DropResult, provided: ResponderProvided) => {
            const result = _handleDrop(droppedItem, provided);
            if (result) {
                setItemsOptimistic(result);
            }
        },
        [_handleDrop]
    );

    return {
        handleDrop,
        itemsOptimistic
    };
};
