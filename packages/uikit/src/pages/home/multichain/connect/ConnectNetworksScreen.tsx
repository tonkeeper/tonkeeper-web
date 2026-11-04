import { FC } from 'react';

import { AccountMultichain } from '@tonkeeper/core/dist/entries/account';
import { toShortValue } from '@tonkeeper/core/dist/utils/common';
import { orderMultichainChains } from '@tonkeeper/core/dist/chains/multichain-chain-order';

import { useTranslation } from '../../../../hooks/translation';
import { cn } from '../../../../libs/css';
import { Button, ModalFooter, ModalFooterPortal } from '../../../../primitives';
import { networkIcon, networkLabel } from '../multichain-utils';

const NETWORK_CHAIN_ID: Record<string, 'ton' | 'evm' | 'tron'> = {
    ton: 'ton',
    eth: 'evm',
    base: 'evm',
    arb: 'evm',
    bsc: 'evm',
    tron: 'tron'
};

/**
 * "Networks to connect" step of the connect flow: one row per network the
 * dApp will be granted, with the account's address on that network. EVM
 * networks share the account's single EVM address.
 */
export const ConnectNetworksScreen: FC<{
    account: AccountMultichain;
    networks: string[];
    onDone: () => void;
}> = ({ account, networks, onDone }) => {
    const { t } = useTranslation();

    const rows = orderMultichainChains(networks).flatMap(network => {
        const chainId = NETWORK_CHAIN_ID[network];
        const wallet = chainId ? account.getWalletByChain(chainId) : undefined;
        if (!wallet || !('rawAddress' in wallet)) return [];
        return [{ network, address: wallet.rawAddress }];
    });

    return (
        <>
            <div className="overflow-hidden rounded-medium bg-backgroundContent">
                {rows.map(({ network, address }, index) => (
                    <div
                        key={network}
                        className={cn(
                            'flex items-center gap-3 px-4 py-3.5',
                            index < rows.length - 1 && 'border-b border-separatorCommon'
                        )}
                    >
                        <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-backgroundContentTint [&>svg]:size-7">
                            {networkIcon(network)}
                        </span>
                        <span className="flex-1 truncate text-label1 text-textPrimary">
                            {networkLabel(network)}
                        </span>
                        <span className="shrink-0 text-body1 text-textSecondary">
                            {toShortValue(address)}
                        </span>
                    </div>
                ))}
            </div>
            <ModalFooterPortal>
                <ModalFooter>
                    <Button variant="secondary" size="large" fullWidth onClick={onDone}>
                        {t('ok')}
                    </Button>
                </ModalFooter>
            </ModalFooterPortal>
        </>
    );
};
