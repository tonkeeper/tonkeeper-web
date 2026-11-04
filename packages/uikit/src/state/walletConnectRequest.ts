import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { AccountMultichain } from '@tonkeeper/core/dist/entries/account';
import { walletConnectService } from '@tonkeeper/core/dist/service/walletConnect/walletConnectService';
import {
    estimateWalletConnectSendFee,
    executeWalletConnectRequest
} from '@tonkeeper/core/dist/service/walletConnect/wcExecutors';
import {
    WalletConnectEvmTransaction,
    WalletConnectRequestPayload
} from '@tonkeeper/core/dist/service/walletConnect/wcRequestTypes';

import { useAppSdk } from '../hooks/appSdk';
import { QueryKey } from '../libs/queryKey';
import { useWalletConnectSessions } from './walletConnect';
import { useAccountsState } from './wallet';

/**
 * Session-request handling, split from `state/walletConnect.ts` because
 * the executors statically pull chain-kit and ethers — only the
 * lazy-loaded confirm surface may import this module, keeping those out
 * of the boot chunk.
 */

/**
 * Head of the pending session-request queue. Requests are confirmed one
 * at a time; responding (approve, reject, expiry) advances the queue.
 */
export const useWalletConnectPendingRequest = () => {
    const [request, setRequest] = useState(() => walletConnectService.peekRequest());
    useEffect(
        () =>
            walletConnectService.requestsChanged$.subscribe(() =>
                setRequest(walletConnectService.peekRequest())
            ),
        []
    );
    return request;
};

/**
 * The multichain account a request addresses: the one recorded when the
 * session was approved, or — for sessions whose metadata was lost — the
 * account holding the wallet with the request's address.
 */
export const useWalletConnectRequestAccount = (
    request: WalletConnectRequestPayload | undefined
): AccountMultichain | undefined => {
    const accounts = useAccountsState();
    const { data: sessions } = useWalletConnectSessions();

    return useMemo(() => {
        if (!request) return undefined;
        const multichain = accounts.filter((a): a is AccountMultichain => a.type === 'multichain');
        const meta = sessions?.find(s => s.topic === request.topic)?.meta;
        const byMeta = meta && multichain.find(a => a.id === meta.accountId);
        if (byMeta) return byMeta;
        const chain = request.network === 'tron' ? 'tron' : 'evm';
        return multichain.find(account => {
            const wallet = account.getWalletByChain(chain);
            if (!wallet || !('rawAddress' in wallet)) return false;
            return chain === 'tron'
                ? wallet.rawAddress === request.address
                : wallet.rawAddress.toLowerCase() === request.address.toLowerCase();
        });
    }, [request, accounts, sessions]);
};

export const useExecuteWalletConnectRequest = () => {
    const sdk = useAppSdk();
    return useMutation<
        void,
        Error,
        { request: WalletConnectRequestPayload; account: AccountMultichain }
    >(async ({ request, account }) => {
        const result = await executeWalletConnectRequest(sdk, account, request);
        await walletConnectService.respondSuccess(request.topic, request.id, result);
    });
};

export const useRejectWalletConnectRequest = () => {
    return useMutation<void, Error, WalletConnectRequestPayload>(request =>
        walletConnectService.respondError(request.topic, request.id, 'USER_REJECTED')
    );
};

export const useWalletConnectSendFee = (request: WalletConnectRequestPayload | undefined) => {
    const isSend = request?.kind === 'eth_sendTransaction';
    return useQuery(
        [QueryKey.walletConnectSessions, 'fee', request?.topic, request?.id],
        () =>
            estimateWalletConnectSendFee(
                request!.network,
                (request as { transaction: WalletConnectEvmTransaction }).transaction
            ),
        { enabled: isSend }
    );
};
