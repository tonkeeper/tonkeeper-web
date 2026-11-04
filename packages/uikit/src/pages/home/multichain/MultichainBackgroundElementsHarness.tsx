import { useQueryClient } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import { FC, useEffect, useState } from 'react';

import { TransferInitParams } from '@tonkeeper/core/dist/AppSdk';
import { DEFAULT_DUST_FILTERS } from '@tonkeeper/core/dist/service/dustFilterService';
import type { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { useAppSdk } from '../../../hooks/appSdk';
import { multichainApiWalletCredentials } from '@tonkeeper/core/dist/service/chainkit/walletAuthService';
import { useUserFiat } from '../../../state/fiat';
import { useActiveAccount } from '../../../state/wallet';
import { multichainWalletAssetsQueryKey } from '../../../state/multichain/useMultichainWalletAssets';
import { MultichainBackgroundElements } from './MultichainBackgroundElements';

/** Prices are irrelevant here and `BigNumber` doesn't survive the mount boundary. */
export type BackgroundElementsHarnessAsset = Omit<MultichainWalletAsset, 'price'>;

/**
 * Drives `MultichainBackgroundElements` from a component test: seeds the
 * wallet's asset list into the query cache, emits a `transfer` uiEvent on
 * demand, and echoes whatever toast the component asks the sdk to show.
 */
export const MultichainBackgroundElementsHarness: FC<{
    assets: BackgroundElementsHarnessAsset[];
    payload: TransferInitParams;
}> = ({ assets, payload }) => {
    const sdk = useAppSdk();
    const account = useActiveAccount();
    const fiat = useUserFiat();
    const client = useQueryClient();

    const [seeded, setSeeded] = useState(false);
    const [toast, setToast] = useState<string>();

    useEffect(() => {
        const walletId = multichainApiWalletCredentials(account)?.walletId;
        const tonWalletId = account.type === 'multichain' ? account.activeTonWallet.id : undefined;
        // The trailing flags mirror the live query key: safe mode with no
        // stored choice resolves to off, dust hiding to its default.
        client.setQueryData(
            multichainWalletAssetsQueryKey(
                walletId,
                tonWalletId,
                fiat,
                false,
                DEFAULT_DUST_FILTERS.hideDustBalances
            ),
            {
                assets: assets.map(a => ({ ...a, price: undefined })),
                totalFiat: new BigNumber(0)
            }
        );
        setSeeded(true);
    }, [account, client, fiat, assets]);

    useEffect(() => {
        const handler = (options: { params: string }) => setToast(options.params);
        sdk.uiEvents.on('copy', handler);
        return () => {
            sdk.uiEvents.off('copy', handler);
        };
    }, [sdk.uiEvents]);

    // Playwright CT's component locator only sees a real DOM root, not a Fragment.
    return (
        <div>
            <button
                type="button"
                disabled={!seeded}
                onClick={() =>
                    sdk.uiEvents.emit('transfer', {
                        method: 'transfer',
                        id: Date.now(),
                        params: payload
                    })
                }
            >
                Emit transfer
            </button>
            {toast && <p>{toast}</p>}
            <MultichainBackgroundElements />
        </div>
    );
};
