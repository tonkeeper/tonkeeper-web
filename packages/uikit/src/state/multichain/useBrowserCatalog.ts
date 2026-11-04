import { useQuery } from '@tanstack/react-query';

import {
    BrowserCatalog,
    toBrowserCatalog
} from '@tonkeeper/core/dist/service/browserCatalogService';
import { multichainApiWalletCredentials } from '@tonkeeper/core/dist/service/chainkit/walletAuthService';

import { QueryKey } from '../../libs/queryKey';
import { useAppContext } from '../../hooks/appContext';
import { useActiveAccount } from '../wallet';

/**
 * dApps catalog for the multichain Browser tab. Served by the tonendpoint
 * `/apps/popular` endpoint (localized by lang / country / platform via the
 * shared boot params) and mapped to the chain-aware {@link BrowserCatalog}
 * domain model.
 *
 * The backend keys the multichain catalog on the wallet id: a request that
 * carries one gets the cross-chain sections, a request without one gets the
 * TON-only set. Only multichain accounts have a valid id to send, so a legacy
 * account viewing this tab still receives the TON catalog.
 */
export const useBrowserCatalog = () => {
    const { tonendpoint } = useAppContext();
    const account = useActiveAccount();
    const walletId = multichainApiWalletCredentials(account)?.walletId;

    return useQuery<BrowserCatalog, Error>([QueryKey.browserCatalog, walletId], async () =>
        toBrowserCatalog(await tonendpoint.appsPopular(walletId))
    );
};
