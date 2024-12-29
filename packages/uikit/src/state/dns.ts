import { useAppContext } from '../hooks/appContext';
import { useMemo, useState } from 'react';
import { debounce } from '@tonkeeper/core/dist/utils/common';
import { useQuery } from '@tanstack/react-query';
import { QueryKey } from '../libs/queryKey';
import { DNSApi } from '@tonkeeper/core/dist/tonApiV2';
import { seeIfInvalidDns } from '../components/transfer/RecipientView';
import { useActiveApi } from './wallet';

export const useResolveDns = (value: string) => {
    const api = useActiveApi();

    const [name, setName] = useState('');

    const update = useMemo(() => {
        return debounce<[string]>(v => setName(v), 400);
    }, [setName]);

    update(value);

    return useQuery(
        [QueryKey.dns, value, name],
        async () => {
            if (value !== name) {
                return null;
            }
            let dns = name.trim();
            if (seeIfInvalidDns(dns)) {
                return null;
            }
            dns = dns.toString().toLowerCase();
            const result = await new DNSApi(api.tonApiV2).dnsResolve({ domainName: dns });
            if (!result.wallet) {
                return null;
            }
            return result.wallet;
        },
        {
            retry: 0,
            keepPreviousData: false
        }
    );
};
