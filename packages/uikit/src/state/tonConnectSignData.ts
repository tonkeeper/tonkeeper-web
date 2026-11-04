import { useMutation } from '@tanstack/react-query';
import { Cell } from '@ton/core';
import { Account, getAccountByWalletById } from '@tonkeeper/core/dist/entries/account';
import { SignDataRequestPayload, SignDataResponse } from '@tonkeeper/core/dist/entries/tonConnect';
import {
    isStandardTonWallet,
    TonWalletStandard,
    WalletId
} from '@tonkeeper/core/dist/entries/wallet';
import { TxConfirmationCustomError } from '@tonkeeper/core/dist/errors/TxConfirmationCustomError';
import { areEqAddresses } from '@tonkeeper/core/dist/utils/common';
import { getServerTime } from '@tonkeeper/core/dist/service/ton-blockchain/utils';
import {
    signDataResult,
    signDataUint8Array
} from '@tonkeeper/core/dist/service/tonConnect/signService';
import { useMemo } from 'react';
import { useAppSdk } from '../hooks/appSdk';
import { useTranslation } from '../hooks/translation';
import { signDataOver } from './mnemonic';
import { useAccountsState, useActiveApi } from './wallet';

export type SigningWallet = { account: Account; wallet: TonWalletStandard };

export const useSigningWallet = (walletId: WalletId | undefined): SigningWallet | undefined => {
    const accounts = useAccountsState();
    return useMemo(() => {
        if (walletId === undefined) return undefined;
        const account = getAccountByWalletById(accounts ?? [], walletId);
        const wallet = account?.getTonWallet(walletId);
        return account && wallet && isStandardTonWallet(wallet) ? { account, wallet } : undefined;
    }, [accounts, walletId]);
};

export const useSignDataMutation = (
    origin: string,
    payload: SignDataRequestPayload,
    signer: SigningWallet | undefined
) => {
    const api = useActiveApi();
    const sdk = useAppSdk();
    const { t } = useTranslation();

    return useMutation<SignDataResponse, Error>(async () => {
        if (!signer) {
            throw new Error('Wallet not found');
        }
        const { account, wallet } = signer;
        if (payload.from !== undefined && !areEqAddresses(payload.from, wallet.rawAddress)) {
            throw new Error('Invalid account provided');
        }

        const domain = new URL(origin).host;
        if (!domain.includes('.')) {
            throw new TxConfirmationCustomError('Invalid domain', 'error_invalid_domain');
        }

        const timestamp = await getServerTime(api);

        const payloadToSign = signDataUint8Array({
            payload,
            domain,
            address: wallet.rawAddress,
            timestamp
        });
        const singer = signDataOver({ sdk, accountId: account.id, wallet, t });

        const signature = await singer(payloadToSign);

        return signDataResult({
            payload,
            domain,
            address: wallet.rawAddress,
            timestamp,
            signature
        });
    });
};

const stringNotEmpty = (value: string | undefined): value is string => {
    return value !== '' && value != null;
};

const seeIfValidCell = (value: string | undefined): boolean => {
    if (!stringNotEmpty(value)) return false;
    try {
        Cell.fromBase64(value);
        return true;
    } catch (e) {
        return false;
    }
};

export const isSignDataPayloadValid = (params: SignDataRequestPayload): boolean => {
    switch (params.type) {
        case 'text': {
            return stringNotEmpty(params.text);
        }
        case 'binary': {
            return stringNotEmpty(params.bytes);
        }
        case 'cell': {
            return stringNotEmpty(params.schema) && seeIfValidCell(params.cell);
        }
        default:
            return false;
    }
};
