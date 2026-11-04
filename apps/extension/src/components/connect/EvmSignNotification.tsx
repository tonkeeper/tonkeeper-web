import { FC, useMemo, useState } from 'react';
import { nativeCoinAssetId } from '@tonkeeper/core/dist/analytics/asset-id';
import { AccountId, AccountMultichain } from '@tonkeeper/core/dist/entries/account';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { decodeSessionRequest } from '@tonkeeper/core/dist/service/walletConnect/wcRequestTypes';
import { executeWalletConnectRequest } from '@tonkeeper/core/dist/service/walletConnect/wcExecutors';
import { summarizeEvmTransaction } from '@tonkeeper/core/dist/service/walletConnect/wcRequestSummary';
import { Button } from '@tonkeeper/uikit/dist/primitives/Button';
import { Modal, ModalFooter, ModalFooterPortal } from '@tonkeeper/uikit/dist/primitives/Modal';
import { useTranslation } from '@tonkeeper/uikit/dist/hooks/translation';
import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { useAccountsState } from '@tonkeeper/uikit/dist/state/wallet';
import { DappRequestDetails } from '@tonkeeper/uikit/dist/pages/home/multichain/connect/DappRequestDetails';
import {
    toAnalyticsAmount,
    useTrackTransactionSent
} from '@tonkeeper/uikit/dist/hooks/analytics/events-hooks';

/** Every EVM chain the injected provider serves prices gas in an 18-decimal coin. */
const EVM_DECIMALS = 18;

/** The raw injected-EVM signing request the popup decodes and confirms. */
export interface EvmSignParams {
    id: number;
    origin: string;
    method: string;
    params: unknown[];
    /** Hex EIP-155 chain id. */
    chainId: string;
    address: string;
    accountId: AccountId;
}

const useSigningAccount = (accountId: AccountId | undefined): AccountMultichain | undefined => {
    const accounts = useAccountsState();
    return useMemo(
        () =>
            accounts?.find(
                (a): a is AccountMultichain => a.type === 'multichain' && a.id === accountId
            ),
        [accounts, accountId]
    );
};

/**
 * Popup confirmation for an injected-EVM signing / transaction request. On
 * confirm it decodes the request and signs (or broadcasts) it via chain-kit
 * with the account that approved the connection — never the active one —
 * returning the JSON-RPC result; resolving the mnemonic triggers unlock.
 */
export const EvmSignNotification: FC<{
    params: EvmSignParams | null;
    onResult: (result: unknown) => void;
    onReject: () => void;
}> = ({ params, onResult, onReject }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const account = useSigningAccount(params?.accountId);
    const [signing, setSigning] = useState(false);
    const trackTransactionSent = useTrackTransactionSent();

    const decoded = useMemo(
        () =>
            params
                ? decodeSessionRequest({
                      id: params.id,
                      topic: params.origin,
                      params: {
                          request: { method: params.method, params: params.params },
                          chainId: `eip155:${parseInt(params.chainId, 16)}`
                      }
                  })
                : undefined,
        [params]
    );
    const request = decoded?.ok ? decoded.payload : undefined;

    const onConfirm = async () => {
        if (!params || !request) return;
        if (!account) {
            onReject();
            return;
        }
        setSigning(true);
        try {
            const result = await executeWalletConnectRequest(sdk, account, request);

            if (request.kind === 'eth_sendTransaction') {
                const summary = summarizeEvmTransaction(request.transaction);
                const isPlainTransfer = summary.kind === 'transfer';
                trackTransactionSent({
                    category: isPlainTransfer ? 'transfer' : 'call',
                    category_detail: isPlainTransfer ? 'coin' : 'unknown',
                    asset: nativeCoinAssetId(request.network, Network.MAINNET),
                    amount: summary.value ? toAnalyticsAmount(summary.value, EVM_DECIMALS) : 0,
                    fee_asset: 'coin',
                    initiated_by: 'evm_injected',
                    dapp_url: params.origin
                });
            }

            onResult(result);
        } catch (e) {
            console.error(e);
            onReject();
        } finally {
            setSigning(false);
        }
    };

    return (
        <Modal
            isOpen={params !== null}
            onClose={signing ? () => {} : onReject}
            variant="content"
            heading={request ? undefined : t('evm_sign_title')}
            subheading={request ? undefined : params?.origin}
        >
            {request ? (
                <DappRequestDetails request={request} account={account} dappUrl={params?.origin} />
            ) : (
                <p className="px-6 pb-2 text-body2 text-textSecondary">{params?.method}</p>
            )}
            <ModalFooterPortal>
                <ModalFooter>
                    <Button
                        variant="primaryBlue"
                        loading={signing}
                        disabled={!request || !account}
                        onClick={onConfirm}
                    >
                        {t('evm_sign_action')}
                    </Button>
                    <Button variant="secondary" disabled={signing} onClick={onReject}>
                        {t('cancel')}
                    </Button>
                </ModalFooter>
            </ModalFooterPortal>
        </Modal>
    );
};
