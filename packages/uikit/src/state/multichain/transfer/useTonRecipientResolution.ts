import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Address } from '@ton/core';

import { debounce, seeIfValidTonAddress } from '@tonkeeper/core/dist/utils/common';
import { AccountsApi, AccountStatus, DNSApi } from '@tonkeeper/core/dist/tonApiV2';

import { QueryKey } from '../../../libs/queryKey';
import { useActiveApi } from '../../wallet';

export type TonRecipientResolution =
    | { status: 'idle' | 'resolving' | 'invalid' | 'not_found' | 'scam' }
    | {
          /** Resolved and safe to send to. */
          status: 'valid';
          /**
           * The recipient in friendly form: the typed address, or the wallet
           * a name resolves to.
           */
          toAddress: string;
          /** Present when the user typed a name rather than an address. */
          domain?: string;
          memoRequired: boolean;
      };

/**
 * Loose shape check for name-service inputs (`foo.ton`, `foo.t.me`) —
 * resolution decides actual validity.
 */
const looksLikeWeb3Domain = (value: string): boolean => {
    const dot = value.indexOf('.');
    return dot > 0 && dot < value.length - 1 && !/\s/.test(value);
};

/**
 * Async TON recipient resolution for the multichain send flow: accepts a
 * raw address or a name-service domain, resolves the domain through
 * tonapi DNS, and checks the target account — a backend-flagged scam
 * recipient blocks the send. A name that doesn't resolve to a wallet is
 * `not_found`, distinct from a malformed address. The recipient is always
 * the typed address (or the name's DNS record): the account lookup only
 * contributes metadata, and a lookup describing a different address fails
 * resolution. The result is always the friendly form: a typed friendly
 * address keeps its bounce flag, while a raw address or a domain's resolved
 * wallet is bounceable only when it is an active non-wallet contract.
 * Mirrors the native apps' recipient pipeline.
 */
export const useTonRecipientResolution = (input: string): TonRecipientResolution => {
    const api = useActiveApi();

    const value = input.trim();
    const [debounced, setDebounced] = useState('');
    const update = useMemo(() => debounce<[string]>(v => setDebounced(v), 400), []);
    update(value);

    const isCandidate = seeIfValidTonAddress(value) || looksLikeWeb3Domain(value);

    const query = useQuery<TonRecipientResolution>(
        [QueryKey.multichainTonRecipient, debounced],
        async () => {
            let toAddress = debounced;
            let domain: string | undefined;
            if (!seeIfValidTonAddress(debounced)) {
                const name = debounced.toLowerCase();
                // tonapi answers an unknown name with an error response.
                const result = await new DNSApi(api.tonApiV2)
                    .dnsResolve({ domainName: name })
                    .catch(() => undefined);
                if (!result?.wallet) return { status: 'not_found' };
                toAddress = result.wallet.address;
                domain = name;
            }
            const recipient = Address.parse(toAddress);
            const account = await new AccountsApi(api.tonApiV2).getAccount({
                accountId: toAddress
            });
            if (!Address.parse(account.address).equals(recipient)) return { status: 'invalid' };
            if (account.isScam) return { status: 'scam' };
            const typedFriendly =
                !domain && Address.isFriendly(debounced)
                    ? Address.parseFriendly(debounced)
                    : undefined;
            toAddress = recipient.toString({
                bounceable: typedFriendly
                    ? typedFriendly.isBounceable
                    : account.status === AccountStatus.Active && !account.isWallet,
                testOnly: false
            });
            return {
                status: 'valid',
                toAddress,
                domain,
                memoRequired: account.memoRequired === true
            };
        },
        {
            enabled: isCandidate && debounced === value,
            retry: 0,
            keepPreviousData: false,
            refetchOnWindowFocus: false
        }
    );

    if (value === '') return { status: 'idle' };
    if (!isCandidate) return { status: 'invalid' };
    if (debounced !== value || query.isFetching) return { status: 'resolving' };
    if (query.isError) return { status: 'invalid' };
    return query.data ?? { status: 'resolving' };
};
