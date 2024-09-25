import { useGlobalPreferences, useMutateGlobalPreferences } from './global-preferences';
import { useMutation } from '@tanstack/react-query';

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

export const useDeleteFolder = () => {
    const { folders } = useGlobalPreferences();
    const { mutateAsync } = useMutateGlobalPreferences();
    return useMutation<void, Error, { id: string }>(({ id }) => {
        return mutateAsync({ folders: folders.filter(f => f.id !== id) });
    });
};
