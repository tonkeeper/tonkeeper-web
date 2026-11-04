import { FC, useState } from 'react';
import type { MultichainChainCode } from '@tonkeeper/core/dist/chains/multichain-chain-order';
import { Modal, useSetModalOnBack } from '../../primitives/Modal';
import { useTranslation } from '../../hooks/translation';
import { ReceiveChainList, ReceiveRow, useReceiveRows } from './ReceiveChainList';
import { ReceiveChainAddress } from './ReceiveChainAddress';

export interface MultichainReceiveBodyProps {
    /**
     * Opens straight on this network's QR with no way back to the chain
     * list — used where the network is already known, e.g. a token page.
     * Falls back to the list when the active account has no wallet for it.
     */
    chain?: MultichainChainCode;
}

export interface MultichainReceiveSheetProps extends MultichainReceiveBodyProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Content-only receive body — chain list, then per-chain QR. Renders its
 * own heading inline so it can be embedded in a shared Modal alongside
 * other steps (e.g. `AddFundsContent`) without forcing the parent to
 * track the list-vs-address sub-state.
 */
export const MultichainReceiveBody: FC<MultichainReceiveBodyProps> = ({ chain }) => {
    const { t } = useTranslation();
    const rows = useReceiveRows();
    const pinned = chain ? rows.find(row => row.chain.id === chain) : undefined;
    const [picked, setPicked] = useState<ReceiveRow | undefined>();
    const selection = pinned ?? picked;

    useSetModalOnBack(picked && !pinned ? () => setPicked(undefined) : undefined);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-1 text-center">
                <h2 className="text-h2 text-textPrimary">
                    {selection
                        ? t('receive_chain_title', { chain: selection.chain.displayName })
                        : t('receive_title')}
                </h2>
                {!selection && (
                    <p className="text-body1 text-textSecondary">{t('receive_subtitle')}</p>
                )}
            </div>
            {selection ? (
                <ReceiveChainAddress chain={selection.chain} address={selection.address} />
            ) : (
                <ReceiveChainList onSelect={(c, address) => setPicked({ chain: c, address })} />
            )}
        </div>
    );
};

export const MultichainReceiveSheet: FC<MultichainReceiveSheetProps> = ({
    isOpen,
    onClose,
    chain
}) => (
    <Modal isOpen={isOpen} onClose={onClose}>
        {isOpen && <MultichainReceiveBody chain={chain} />}
    </Modal>
);
