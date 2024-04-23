import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { useAppSdk } from '../hooks/appSdk';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { TonRecipient } from '@tonkeeper/core/dist/entries/send';

export type MultiSendForm = {
    rows: {
        receiver: TonRecipient | undefined;
        amount: { inFiat?: boolean; value?: string } | undefined;
        comment?: string;
    }[];
};

export interface MultiSendList {
    id: number;
    name: string;
    token: TonAsset;
    form: MultiSendForm;
}

export type MultiSendListTemplate = Omit<MultiSendList, 'id'> & { id?: number };

export const useUserMultiSendLists = () => {
    const sdk = useAppSdk();
    return useQuery([AppKey.MULTI_SEND_LISTS], async () => {
        const lists = await sdk.storage.get<MultiSendList[]>(AppKey.MULTI_SEND_LISTS);
        return lists || [];
    });
};

export const useMutateUserMultiSendList = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error, MultiSendListTemplate>(async list => {
        const lists = (await sdk.storage.get<MultiSendList[]>(AppKey.MULTI_SEND_LISTS)) || [];
        const listIndex = lists.findIndex(l => l.id === list.id);

        if (listIndex === -1) {
            const maxId = Math.max(1, ...lists.map(l => l.id));
            lists.push({ ...list, id: maxId + 1 });
        } else {
            lists[listIndex] = list as MultiSendList;
        }

        await sdk.storage.set(AppKey.MULTI_SEND_LISTS, lists);
        await client.invalidateQueries([AppKey.MULTI_SEND_LISTS]);
    });
};

export const useDeleteUserMultiSendList = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error, number>(async id => {
        const lists = (await sdk.storage.get<MultiSendList[]>(AppKey.MULTI_SEND_LISTS)) || [];

        await sdk.storage.set(
            AppKey.MULTI_SEND_LISTS,
            lists.filter(l => l.id !== id)
        );
        await client.invalidateQueries([AppKey.MULTI_SEND_LISTS]);
    });
};
