import { FC } from 'react';
import { AccountMultichain } from '@tonkeeper/core/dist/entries/account';
import { isEvmWallet } from '@tonkeeper/core/dist/entries/wallet';
import { Button } from '@tonkeeper/uikit/dist/primitives/Button';
import { Modal, ModalFooter, ModalFooterPortal } from '@tonkeeper/uikit/dist/primitives/Modal';
import { useTranslation } from '@tonkeeper/uikit/dist/hooks/translation';
import { useActiveAccount } from '@tonkeeper/uikit/dist/state/wallet';

/** A settled injected-EVM connection returned to the background on approval. */
export interface EvmInjectedConnection {
    accountId: string;
    address: string;
    chainId: string;
}

/**
 * Popup approval for an injected-EVM `eth_requestAccounts`. Shows the dApp
 * origin and the active multichain account's EVM address; approving returns
 * the connection to persist.
 */
export const EvmConnectNotification: FC<{
    origin?: string;
    /** Hex chain id the dApp will see, or `null` when no request is active. */
    chainId: string | null;
    onApprove: (connection: EvmInjectedConnection) => void;
    onReject: () => void;
}> = ({ origin, chainId, onApprove, onReject }) => {
    const { t } = useTranslation();
    const account = useActiveAccount();
    const isOpen = chainId !== null;

    const evmWallet =
        account.type === 'multichain'
            ? (account as AccountMultichain).getWalletByChain('evm')
            : undefined;
    const address = evmWallet && isEvmWallet(evmWallet) ? evmWallet.rawAddress : undefined;
    const canConnect = isOpen && !!address && !!chainId;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onReject}
            heading={t('evm_connect_title')}
            subheading={origin}
        >
            <div className="flex flex-col gap-3 px-6 pb-2">
                {address ? (
                    <>
                        <span className="break-all text-label2 text-textPrimary">{address}</span>
                        <span className="text-body2 text-textSecondary">
                            {t('evm_connect_permissions')}
                        </span>
                    </>
                ) : (
                    <span className="text-body2 text-accentOrange">
                        {t('evm_connect_no_evm_wallet')}
                    </span>
                )}
            </div>
            <ModalFooterPortal>
                <ModalFooter>
                    <Button
                        variant="primaryBlue"
                        disabled={!canConnect}
                        onClick={() => {
                            if (canConnect) {
                                onApprove({
                                    accountId: account.id,
                                    address: address!,
                                    chainId: chainId!
                                });
                            }
                        }}
                    >
                        {t('evm_connect_action')}
                    </Button>
                    <Button variant="secondary" onClick={onReject}>
                        {t('cancel')}
                    </Button>
                </ModalFooter>
            </ModalFooterPortal>
        </Modal>
    );
};
