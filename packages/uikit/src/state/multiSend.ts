import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { packAssetId } from '@tonkeeper/core/dist/entries/crypto/asset/basic-asset';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import {
    TonAsset,
    isTon,
    tonAssetAddressFromString,
    tonAssetAddressToString
} from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { TonRecipient } from '@tonkeeper/core/dist/entries/send';
import { csvStringToArray } from '@tonkeeper/core/dist/service/parserService';
import { DNSApi, JettonsApi } from '@tonkeeper/core/dist/tonApiV2';
import { seeIfValidTonAddress } from '@tonkeeper/core/dist/utils/common';
import { getDecimalSeparator } from '@tonkeeper/core/dist/utils/formatting';
import { notNullish } from '@tonkeeper/core/dist/utils/types';
import { useCallback } from 'react';
import { ErrorOption } from 'react-hook-form';
import { seeIfInvalidDns } from '../components/transfer/RecipientView';
import { useAppContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';

export type MultiSendRow = {
    receiver: TonRecipient | null;
    amount: { inFiat: boolean; value: string } | null;
    comment?: string;
};

export type MultiSendForm = {
    rows: MultiSendRow[];
};

export interface MultiSendList {
    id: number;
    name: string;
    token: TonAsset;
    form: MultiSendForm;
}

export type MultiSendListTemplate = Omit<MultiSendList, 'id'> & { id?: number };

export const useMultiSendReceiverValidator = () => {
    const { api } = useAppContext();
    return useCallback<
        (
            val: string
        ) => Promise<ErrorOption | undefined | null | { success: true; result: TonRecipient }>
    >(
        async (value: string) => {
            value = value.trim();

            if (!value) {
                return {
                    message: 'Empty receiver'
                };
            }

            if (seeIfValidTonAddress(value)) {
                let bounce = false;
                if (Address.isFriendly(value)) {
                    bounce = Address.parseFriendly(value).isBounceable;
                }

                return {
                    success: true,
                    result: {
                        address: value,
                        bounce,
                        blockchain: BLOCKCHAIN_NAME.TON
                    }
                };
            }

            if (seeIfInvalidDns(value)) {
                return {
                    message: 'Wrong address format'
                };
            }
            value = value.toLowerCase();

            try {
                const result = await new DNSApi(api.tonApiV2).dnsResolve({ domainName: value });
                if (result.wallet) {
                    return {
                        success: true,
                        result: {
                            address: result.wallet.address,
                            dns: result.wallet,
                            blockchain: BLOCKCHAIN_NAME.TON
                        }
                    };
                } else {
                    return {
                        message: 'Wrong DNS wallet'
                    };
                }
            } catch (e) {
                console.error(e);
                return {
                    message: 'Wrong DNS wallet'
                };
            }
        },
        [api]
    );
};

export const useUserMultiSendLists = () => {
    const sdk = useAppSdk();
    return useQuery([AppKey.MULTI_SEND_LISTS], async () => {
        const lists = await sdk.storage.get<MultiSendList[]>(AppKey.MULTI_SEND_LISTS);

        const deserialized = lists?.map(l => ({
            ...l,
            token: {
                ...l.token,
                address: tonAssetAddressFromString(l.token.address as string)
            }
        }));

        return deserialized || [];
    });
};

export const useMutateUserMultiSendList = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error, MultiSendListTemplate>(async list => {
        const lists = (await sdk.storage.get<MultiSendList[]>(AppKey.MULTI_SEND_LISTS)) || [];
        const listIndex = lists.findIndex(l => l.id === list.id);

        if (listIndex === -1) {
            const id = list.id ?? Math.max(1, ...lists.map(l => l.id)) + 1;
            lists.push({ ...list, id });
        } else {
            lists[listIndex] = list as MultiSendList;
        }

        const serialized = lists.map(l => ({
            ...l,
            token: {
                ...l.token,
                address: tonAssetAddressToString(l.token.address)
            }
        }));

        await sdk.storage.set(AppKey.MULTI_SEND_LISTS, serialized);
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

export class ListImportError extends Error {
    constructor(
        message: string,
        public readonly type:
            | 'invalid_csv'
            | 'list_empty'
            | 'invalid_row_length'
            | 'invalid_amount'
            | 'invalid_asset'
            | 'too_many_crypto_assets'
            | 'too_many_fiat_assets'
            | 'invalid_receiver'
            | 'unknown',
        public readonly position: {
            line?: number;
            column?: number;
        } = {}
    ) {
        super(message);
    }
}

export const useParseCsvListMutation = () => {
    const { api } = useAppContext();
    const { data: lists } = useUserMultiSendLists();
    const receiverValidator = useMultiSendReceiverValidator();

    return useMutation<{ list: MultiSendList; selectedFiat: FiatCurrencies | null }, Error, File>(
        async (csv: File) => {
            const id = Math.max(1, ...(lists || []).map(l => l.id)) + 1;

            let arr: string[][] = [];
            try {
                const textContent = await csv.text();
                arr = csvStringToArray(textContent);
            } catch (e) {
                console.error(e);
                throw new ListImportError('Cannot parse CSV', 'invalid_csv');
            }

            if (arr.length === 0) {
                throw new ListImportError('List is empty', 'list_empty');
            }

            const parsedList = arr.map(parseTableRow);

            const fiat = getUsedFiat(parsedList);
            const crypto = getUsedCryptoAsset(parsedList);

            let token = TON_ASSET;
            if (crypto && !isTon(crypto)) {
                const response = await new JettonsApi(api.tonApiV2).getJettonInfo({
                    accountId: crypto.toRawString()
                });

                token = {
                    address: crypto,
                    image: response.metadata.image,
                    blockchain: BLOCKCHAIN_NAME.TON,
                    name: response.metadata.name,
                    symbol: response.metadata.symbol,
                    decimals: Number(response.metadata.decimals),
                    id: packAssetId(BLOCKCHAIN_NAME.TON, crypto)
                };
            }

            const receivers = await Promise.allSettled(
                parsedList.map(item =>
                    receiverValidator(item[0]).then(res => {
                        if (res && typeof res === 'object' && 'success' in res && res.success) {
                            return res.result;
                        }

                        throw new ListImportError(
                            res && typeof res === 'object' && 'message' in res && res.message
                                ? res.message
                                : 'Invalid receiver',
                            'invalid_receiver'
                        );
                    })
                )
            );

            const wrongReceiverIndex = receivers.findIndex(r => r.status === 'rejected');
            if (wrongReceiverIndex !== -1) {
                throw new ListImportError('Invalid receiver', 'invalid_receiver', {
                    line: wrongReceiverIndex,
                    column: 0
                });
            }

            let name = csv.name || `List ${id}`;
            const originalName = name;
            let nameI = 1;
            // eslint-disable-next-line @typescript-eslint/no-loop-func
            while (lists?.some(l => l.name === name)) {
                name = `${originalName} (${nameI})`;
                nameI = nameI + 1;
            }

            return {
                list: {
                    id,
                    name,
                    token,
                    form: {
                        rows: parsedList.map((item, index) => ({
                            receiver: (receivers[index] as PromiseFulfilledResult<TonRecipient>)
                                .value,
                            amount: { inFiat: item[2].type === 'fiat', value: item[1] },
                            comment: item[3]
                        }))
                    }
                },
                selectedFiat: fiat
            };
        }
    );
};

const parseTableRow = (row: string[], rowIndex: number) => {
    if (row.length !== 3 && row.length !== 4) {
        throw new ListImportError('Invalid row length', 'invalid_row_length', {
            line: rowIndex,
            column: 0
        });
    }

    const [receiver, amount, asset, comment] = row;
    let parsedAmount;
    try {
        parsedAmount = parseAmount(amount);
    } catch (e) {
        throw new ListImportError('Invalid amount', 'invalid_amount', {
            line: rowIndex,
            column: 1
        });
    }

    let parsedAsset: ReturnType<typeof parseAsset>;
    try {
        parsedAsset = parseAsset(asset);
    } catch (e) {
        throw new ListImportError('Invalid asset', 'invalid_asset', {
            line: rowIndex,
            column: 2
        });
    }

    return [receiver, parsedAmount, parsedAsset, comment] as const;
};

const parseAmount = (val: string) => {
    if (!/^[0-9 ]+([\.,][0-9]+)?$/.test(val)) {
        throw new Error('Not a valid number');
    }

    val = val.replace(',', '.').replaceAll(' ', '');
    const number = parseFloat(val);
    if (!isFinite(number)) {
        throw new Error('Not a valid number');
    }

    return val.replace('.', getDecimalSeparator());
};

const parseAsset = (val: string) => {
    if (val === 'TON') {
        return {
            type: 'token',
            address: TON_ASSET.address
        };
    }
    if (Object.values(FiatCurrencies).includes(val as FiatCurrencies)) {
        return {
            type: 'fiat',
            value: val
        };
    }

    try {
        const address = Address.parse(val);
        return {
            type: 'token',
            address
        };
    } catch (e) {
        throw new Error('Not a valid asset');
    }
};

const getUsedFiat = (parsedList: ReturnType<typeof parseTableRow>[]) => {
    const fiatValues = new Set(
        parsedList
            .map(item => (item[2].type === 'fiat' ? item[2].value : null))
            .filter(notNullish) as string[]
    );

    if (fiatValues.size > 1) {
        throw new ListImportError(
            'All fiat assets must be in the same currency',
            'too_many_fiat_assets'
        );
    }

    if (fiatValues.size === 0) {
        return null;
    }

    return [...fiatValues.values()][0] as FiatCurrencies;
};

const getUsedCryptoAsset = (parsedList: ReturnType<typeof parseTableRow>[]) => {
    const cryptoValues = new Set(
        parsedList
            .map(item =>
                item[2].type === 'token' ? tonAssetAddressToString(item[2].address!) : null
            )
            .filter(notNullish)
    );

    if (cryptoValues.size > 1) {
        throw new ListImportError('All crypto assets must be the same', 'too_many_crypto_assets');
    }

    if (cryptoValues.size === 0) {
        return null;
    }

    return tonAssetAddressFromString([...cryptoValues.values()][0]!);
};

const validatePastedRow = async (
    row: string[],
    receiverValidator: (val: string) => Promise<
        | ErrorOption
        | undefined
        | null
        | {
              success: true;
              result: TonRecipient;
          }
    >
): Promise<MultiSendRow> => {
    if (row.length < 2 || row.length > 3) {
        throw new ListImportError('Invalid input', 'invalid_row_length');
    }

    const amount = parseAmount(row[1]);

    let receiver: TonRecipient;

    const res = await receiverValidator(row[0]);
    if (res && typeof res === 'object' && 'success' in res && res.success) {
        receiver = res.result;
    } else {
        throw new ListImportError(
            res && typeof res === 'object' && 'message' in res && res.message
                ? res.message
                : 'Invalid receiver',
            'invalid_receiver'
        );
    }

    return {
        receiver,
        amount: { inFiat: false, value: amount },
        comment: row[2]
    };
};

export const getPastedTable = async (
    clipText: string,
    receiverValidator: (val: string) => Promise<
        | ErrorOption
        | undefined
        | null
        | {
              success: true;
              result: TonRecipient;
          }
    >
): Promise<MultiSendRow[] | null> => {
    if (clipText.trim() == '') return null;

    const clipRows = clipText.split('\n');

    const rows = clipRows.map(row => row.split('\t'));

    const receivers = await Promise.allSettled(
        rows.map(item => validatePastedRow(item, receiverValidator))
    );

    if (receivers.some(r => r.status === 'rejected')) {
        return null;
    }

    return (receivers as PromiseFulfilledResult<MultiSendRow>[]).map(item => item.value);
};
