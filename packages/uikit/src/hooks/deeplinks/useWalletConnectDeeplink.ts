import { useCallback, useMemo } from 'react';

import { useToast } from '../useNotification';
import { useHasMultichainAccount, useWalletConnectPair } from '../../state/walletConnect';

/**
 * Handler for `wc:` pairing URIs arriving through the link/scan pipeline.
 * `undefined` while no multichain account exists (WalletConnect serves
 * the EVM/TRON wallets) — the pipeline then treats wc: links exactly as
 * production does today, falling through to the unsupported-link error.
 */
export const useOpenWalletConnectUri = (): ((uri: string) => void) | undefined => {
    const toast = useToast();
    const hasMultichainAccount = useHasMultichainAccount();
    const { mutateAsync: pair } = useWalletConnectPair();

    const open = useCallback(
        (uri: string) => {
            pair({ uri, source: 'link' }).catch(e => {
                console.error(e);
                toast(String(e).replace(/^Error ?: ?/, ''));
            });
        },
        [pair, toast]
    );

    return useMemo(() => (hasMultichainAccount ? open : undefined), [hasMultichainAccount, open]);
};
