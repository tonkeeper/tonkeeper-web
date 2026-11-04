import { FC } from 'react';
import { AccountMultichain } from '@tonkeeper/core/dist/entries/account';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { cn } from '../../libs/css';
import { useAppSdk } from '../../hooks/appSdk';
import { useActiveAccount, useActiveTonNetwork } from '../../state/wallet';
import { useTranslation } from '../../hooks/translation';
import IcQrCode28 from '../../icons/components/IcQrCode28';
import IcCopy16 from '../../icons/components/IcCopy16';
import { RECEIVE_CHAINS, ReceiveChain } from './receiveChains';

interface ReceiveChainListProps {
    onSelect: (chain: ReceiveChain, address: string) => void;
}

export interface ReceiveRow {
    chain: ReceiveChain;
    address: string;
}

/**
 * Returns `RECEIVE_CHAINS` augmented with the multichain account's
 * address for each row. EVM L1/L2 rows share the same `rawAddress`.
 * Rows whose `chainId` isn't enabled on the active account are
 * dropped — the user can't receive what they don't have a key for.
 */
export const useReceiveRows = (): ReceiveRow[] => {
    const account = useActiveAccount();
    const network = useActiveTonNetwork();

    if (!(account instanceof AccountMultichain)) return [];

    return RECEIVE_CHAINS.flatMap(chain => {
        const wallet = account.getWalletByChain(chain.chainId);
        if (!wallet) return [];
        const address =
            chain.chainId === 'ton' ? formatAddress(wallet.rawAddress, network) : wallet.rawAddress;
        return [{ chain, address }];
    });
};

export const ReceiveChainList: FC<ReceiveChainListProps> = ({ onSelect }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const rows = useReceiveRows();

    if (rows.length === 0) {
        return (
            <p className="py-8 text-center text-body2 text-textSecondary">
                {t('receive_no_wallets')}
            </p>
        );
    }

    return (
        <div className="overflow-hidden rounded-medium bg-backgroundContent">
            {rows.map(({ chain, address }, index) => (
                <div
                    key={chain.id}
                    // The tint belongs to the whole row: the buttons inside it
                    // cover neither the row's padding nor each other, so a fill
                    // on either of them reads as a band across the middle.
                    className={cn(
                        'flex items-center gap-4 px-4 py-3.5 transition-colors duration-100 hover:bg-backgroundContentTint',
                        index < rows.length - 1 && 'border-b border-separatorCommon'
                    )}
                >
                    <button
                        type="button"
                        onClick={() => onSelect(chain, address)}
                        className="-my-3.5 flex flex-1 cursor-pointer items-center gap-4 py-3.5 text-left focus:outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-textPrimary"
                    >
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full">
                            <div className="h-11 w-11 [&>svg]:h-11 [&>svg]:w-11">{chain.icon}</div>
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-label1 text-textPrimary">
                                {chain.displayName}
                            </span>
                            <span className="truncate text-body2 text-textSecondary">
                                {toShortValue(address)}
                            </span>
                        </div>
                        <span
                            aria-hidden
                            className="flex h-7 w-7 shrink-0 items-center justify-center text-textPrimary"
                        >
                            <IcQrCode28 className="h-7 w-7" />
                        </span>
                    </button>
                    <button
                        type="button"
                        aria-label={t('Copy_address')}
                        onClick={() =>
                            sdk.copyToClipboard(
                                address,
                                t('receive_address_copied', {
                                    chain: chain.displayName,
                                    address: toShortValue(address)
                                })
                            )
                        }
                        className="-my-3.5 flex h-14 w-7 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent text-textPrimary transition-colors hover:text-textSecondary"
                    >
                        <IcCopy16 width={20} height={20} className="h-5 w-5" />
                    </button>
                </div>
            ))}
        </div>
    );
};
