import { useGlobalPreferences, useMutateGlobalPreferences } from './global-preferences';
import { useMutation } from '@tanstack/react-query';
import { useAccountsState } from './accounts';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { notNullish } from '@tonkeeper/core/dist/utils/types';
import {
    Account,
    AccountsFolderStored,
    AccountTonMultisig
} from '@tonkeeper/core/dist/entries/account';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

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

export const useAccountsOrdered = () => {
    const items = useSideBarItems();

    return useMemo(() => {
        const allAccounts = items.flatMap(i => (i.type === 'folder' ? i.accounts : [i]));

        let multisigs = allAccounts.filter(a => a.type === 'ton-multisig') as AccountTonMultisig[];
        const notMultisigs = allAccounts.filter(a => a.type !== 'ton-multisig');

        const result: Account[] = [];

        notMultisigs.forEach(account => {
            result.push(account);

            const multisigsToAdd = multisigs.filter(m =>
                m.hostWallets
                    .filter(w => w.isPinned)
                    .map(w => w.address)
                    .concat(m.selectedHostWalletId)
                    .some(addr => account.allTonWallets.some(w => w.rawAddress === addr))
            );

            result.push(...multisigsToAdd);
            multisigs = multisigs.filter(m => !multisigsToAdd.includes(m));
        });

        return result;
    }, [items]);
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
    return useCallback(
        ({ id, name, accounts }: { id?: string; name: string; accounts: string[] }) => {
            const newId =
                id ??
                (
                    folders.reduce((maxId, item) => Math.max(maxId, Number(item.id)), 0) + 1
                ).toString();

            const existingFolder = folders.find(folder => folder.id === newId);

            const newFolders = [...folders];

            if (existingFolder) {
                existingFolder.name = name;
                existingFolder.accounts = accounts;
            } else {
                newFolders.push({
                    id: newId,
                    type: 'folder',
                    accounts,
                    name,
                    lastIsOpened: true
                });
            }

            newFolders.forEach(f => {
                if (f.id === newId) {
                    return;
                }

                f.accounts = f.accounts.filter(acc => !accounts.includes(acc));
            });

            return mutateAsync({ folders: newFolders });
        },
        [folders, mutateAsync]
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
    return useCallback(
        ({ id }: { id: string }) => {
            return mutateAsync({ folders: folders.filter(f => f.id !== id) });
        },
        [folders, mutateAsync]
    );
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

    const handleSidebarDrop = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;

            const oldIndex = items.findIndex(i => i.id === active.id);
            const newIndex = items.findIndex(i => i.id === over.id);
            if (oldIndex === -1 || newIndex === -1) return;

            const reordered = arrayMove([...items], oldIndex, newIndex);
            mutate({ sideBarOrder: reordered.map(i => i.id) });
            setItemsOptimistic(reordered);
        },
        [items, mutate]
    );

    const handleFolderDrop = useCallback(
        (event: DragEndEvent, folderId: string) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;

            const folder = folders.find(i => i.id === folderId) as AccountsFolder;
            if (!folder) return;

            const oldIndex = folder.accounts.findIndex(a => a.id === active.id);
            const newIndex = folder.accounts.findIndex(a => a.id === over.id);
            if (oldIndex === -1 || newIndex === -1) return;

            const newAccounts = arrayMove([...folder.accounts], oldIndex, newIndex);
            const folderIndex = folders.findIndex(i => i.id === folderId);
            const newFolders = folders.slice();
            newFolders[folderIndex] = { ...folder, accounts: newAccounts };
            mutate({ folders: newFolders.map(folderToStoredFolder) });

            const updatedList = [...items];
            updatedList[updatedList.findIndex(i => i.id === folderId)] = {
                ...folder,
                accounts: newAccounts
            };
            setItemsOptimistic(updatedList);
        },
        [items, folders, mutate]
    );

    return {
        handleSidebarDrop,
        handleFolderDrop,
        itemsOptimistic
    };
};
