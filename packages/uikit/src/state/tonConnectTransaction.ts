import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TonConnectTransactionPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import { isTonEstimationDetailed, TonEstimationDetailed } from '@tonkeeper/core/dist/entries/send';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { Sender } from '@tonkeeper/core/dist/service/ton-blockchain/sender';
import { useMemo } from 'react';
import { useTonConnectTransactionService } from '../hooks/blockchain/useBlockchainService';
import { SenderChoice, useGetEstimationSender, useGetSender } from '../hooks/blockchain/useSender';
import { useToQueryKeyPart } from '../hooks/useToQueryKeyPart';
import { MultisigOrderLifetimeMinutes } from '../libs/multisig';
import { anyOfKeysParts, QueryKey } from '../libs/queryKey';
import { useAccountsState, useActiveAccount } from './wallet';

export const useTonConnectTransactionSendMutation = (
    params: TonConnectTransactionPayload,
    estimate: TonEstimationDetailed | undefined,
    options: {
        senderChoice: SenderChoice;
        multisigTTL?: MultisigOrderLifetimeMinutes;
        waitInvalidation?: boolean;
        /** The wallet the request is bound to; sending fails when another one is active. */
        walletId?: WalletId;
    }
) => {
    const account = useActiveAccount();
    const client = useQueryClient();
    const getSender = useGetSender();
    const tonConnectService = useTonConnectTransactionService();

    return useMutation<string, Error>(async () => {
        if (!estimate) {
            throw new Error('Transaction estimate is not ready');
        }

        if (account.type === 'watch-only') {
            throw new Error('Cant use this account');
        }

        if (options.walletId !== undefined && account.activeTonWallet.id !== options.walletId) {
            throw new Error('Wallet changed');
        }

        let sender: Sender;
        if (account.type === 'ton-multisig') {
            if (!options.multisigTTL) {
                throw new Error('TTL must be specified for multisig sending');
            }

            sender = await getSender({
                type: 'multisig',
                ttlSeconds: 60 * Number(options.multisigTTL)
            });
        } else {
            sender = await getSender(options.senderChoice);
        }

        const boc = await tonConnectService.send(sender, estimate, params);

        const invalidationPromise = client.invalidateQueries(
            anyOfKeysParts(account.id, account.activeTonWallet.id)
        );
        if (options.waitInvalidation) {
            await invalidationPromise;
        }
        return boc;
    });
};

export const useTonConnectTransactionEstimation = (
    params: TonConnectTransactionPayload,
    senderChoice: SenderChoice,
    options: { multisigTTL?: MultisigOrderLifetimeMinutes; paramsLoading?: boolean }
) => {
    const account = useActiveAccount();
    const accounts = useAccountsState();

    const senderChoiceComputed = useMemo(() => {
        if (account.type === 'ton-multisig') {
            return {
                type: 'multisig' as const,
                ttlSeconds: 60 * Number(options?.multisigTTL ?? '60')
            };
        }

        return senderChoice;
    }, [senderChoice, options?.multisigTTL, account.type]);

    const getSender = useGetEstimationSender(senderChoiceComputed);
    const getSenderKey = useToQueryKeyPart(getSender);
    const tonConenctService = useTonConnectTransactionService();

    return useQuery<TonEstimationDetailed, Error>(
        [QueryKey.estimate, params, account, accounts, getSenderKey],
        async () => {
            if (account.type === 'watch-only') {
                throw new Error('Cant use this account');
            }

            const sender = await getSender!();

            const result = await tonConenctService.estimate(sender, params);

            if (!isTonEstimationDetailed(result)) {
                throw new Error("Can't get estimation details");
            }

            return result;
        },
        { enabled: !!getSender && options?.paramsLoading !== true }
    );
};
