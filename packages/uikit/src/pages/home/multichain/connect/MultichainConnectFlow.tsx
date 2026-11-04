import { useQuery } from '@tanstack/react-query';
import { FC, useEffect, useMemo, useState } from 'react';

import type { WalletKitTypes } from '@reown/walletkit';
import { Account, AccountMultichain } from '@tonkeeper/core/dist/entries/account';
import { TonConnectError } from '@tonkeeper/core/dist/entries/exception';
import { DAppManifest, TonConnectEventPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import { WalletId, WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import {
    getDeviceInfo,
    getManifest,
    getTonConnectPlatform
} from '@tonkeeper/core/dist/service/tonConnect/connectService';
import { TonConnectHttpConnectionParams } from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import {
    WalletConnectNetwork,
    proposalNetworks
} from '@tonkeeper/core/dist/service/walletConnect/wcChains';
import { WalletConnectSessionMeta } from '@tonkeeper/core/dist/service/walletConnect/wcSessionMeta';

import { useTonConnectConnectOperation } from '../../../../hooks/analytics/ton-connect';
import { useAppSdk } from '../../../../hooks/appSdk';
import { useTranslation } from '../../../../hooks/translation';
import { Modal } from '../../../../primitives';
import { useGetTonConnectConnectResponse } from '../../../../state/tonConnect';
import { useApproveWalletConnectProposal } from '../../../../state/walletConnect';
import { useAccountsState, useActiveAccount } from '../../../../state/wallet';
import { ConnectApprovalScreen, ConnectRiskLevel } from './ConnectApprovalScreen';
import { ConnectNetworksScreen } from './ConnectNetworksScreen';
import { ConnectRiskWarningSheet } from './ConnectRiskWarningSheet';
import { ConnectWalletsSheet } from './ConnectWalletsSheet';

export type ConnectFlowRequest =
    | { protocol: 'tonConnect'; params: TonConnectHttpConnectionParams }
    | {
          protocol: 'walletConnect';
          proposal: WalletKitTypes.SessionProposal;
          source: WalletConnectSessionMeta['source'];
      };

export type TonConnectCompleteResult =
    | {
          replyItems: TonConnectEventPayload;
          manifest: DAppManifest;
          account: Account;
          walletId: WalletId;
      }
    | null
    | TonConnectError;

const RISK_CAPTION_KEY: Record<Exclude<ConnectRiskLevel, 'none'>, string> = {
    unknown: 'connect_risk_unknown_text',
    mismatch: 'connect_risk_mismatch_caption',
    scam: 'connect_risk_scam_caption'
};

/**
 * The dApp-connection approval sheet of the multichain redesign, shared
 * by both protocols: a TonConnect connect request (TON dApps) and a
 * WalletConnect session proposal (EVM / TRON dApps) render the same
 * screen — only the header metadata, the networks list, and the approve
 * call differ per protocol.
 */
export const MultichainConnectFlow: FC<{
    request: ConnectFlowRequest | null;
    /** Dismissal — the caller rejects the underlying request. */
    onClose: () => void;
    /** WalletConnect proposal approved and the session settled. */
    onWalletConnectApproved?: () => void;
    /** TonConnect reply built — the caller relays it to the bridge. */
    onTonConnectComplete?: (result: TonConnectCompleteResult) => void;
}> = ({ request, onClose, onWalletConnectApproved, onTonConnectComplete }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();

    const activeAccount = useActiveAccount();
    const accounts = useAccountsState();
    const multichainAccounts = useMemo(
        () => accounts.filter((a): a is AccountMultichain => a.type === 'multichain'),
        [accounts]
    );
    const [account, setAccount] = useState<AccountMultichain | undefined>();
    useEffect(() => {
        if (request) {
            setAccount(
                activeAccount.type === 'multichain'
                    ? (activeAccount as AccountMultichain)
                    : multichainAccounts[0]
            );
        }
        // The selection resets per incoming request, not per account-list update.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [request]);

    const [screen, setScreen] = useState<'connect' | 'networks'>('connect');
    const [walletsOpen, setWalletsOpen] = useState(false);
    const [riskWarningOpen, setRiskWarningOpen] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | undefined>();
    useEffect(() => {
        setScreen('connect');
        setWalletsOpen(false);
        setRiskWarningOpen(false);
        setDone(false);
        setError(undefined);
    }, [request]);

    const tonConnectParams = request?.protocol === 'tonConnect' ? request.params : null;
    const { data: tonConnectManifest } = useQuery(
        ['connect-flow-manifest', tonConnectParams?.request.manifestUrl],
        () => getManifest(tonConnectParams!.request),
        { enabled: tonConnectParams !== null }
    );

    const meta = useMemo(() => {
        if (!request) return undefined;
        if (request.protocol === 'walletConnect') {
            const { metadata } = request.proposal.params.proposer;
            const verified = request.proposal.verifyContext?.verified;
            const risk: ConnectRiskLevel = verified?.isScam
                ? 'scam'
                : verified?.validation === 'INVALID'
                ? 'mismatch'
                : verified?.validation === 'UNKNOWN'
                ? 'unknown'
                : 'none';
            return {
                name: metadata.name,
                domain: domainOf(metadata.url),
                icon: metadata.icons[0],
                risk
            };
        }
        if (!tonConnectManifest) return undefined;
        return {
            name: tonConnectManifest.name,
            domain: domainOf(tonConnectManifest.url),
            icon: tonConnectManifest.iconUrl,
            risk: 'none' as const
        };
    }, [request, tonConnectManifest]);

    const networks: (WalletConnectNetwork | 'ton')[] = useMemo(() => {
        if (!request || !account) return [];
        if (request.protocol === 'tonConnect') return ['ton'];
        return proposalNetworks(request.proposal.params, account);
    }, [request, account]);

    const unsupportedProposal = request?.protocol === 'walletConnect' && networks.length === 0;

    const { mutateAsync: getTonConnectResponse, isLoading: tonConnectLoading } =
        useGetTonConnectConnectResponse();
    const { mutateAsync: approveWalletConnect, isLoading: walletConnectLoading } =
        useApproveWalletConnectProposal();
    const isLoading = tonConnectLoading || walletConnectLoading;

    const tonConnectOperation = useTonConnectConnectOperation(
        tonConnectParams
            ? { connectionType: tonConnectParams.type, dappUrl: tonConnectManifest?.url }
            : null
    );

    const approve = async () => {
        if (!request || !account) return;
        setError(undefined);
        try {
            if (request.protocol === 'walletConnect') {
                await approveWalletConnect({
                    proposal: request.proposal,
                    account,
                    source: request.source
                });
                setDone(true);
                setTimeout(() => onWalletConnectApproved?.(), 300);
            } else {
                tonConnectOperation.start();
                const walletId = account.activeTonWallet.id;
                const replyItems = await getTonConnectResponse({
                    request: request.params.request,
                    manifest: tonConnectManifest!,
                    webViewOrigin: null,
                    account,
                    walletId
                });
                const maxMessages =
                    account.activeTonWallet.version === WalletVersion.V5R1 ? 255 : 4;
                tonConnectOperation.succeed();
                setDone(true);
                setTimeout(
                    () =>
                        onTonConnectComplete?.({
                            replyItems: {
                                items: replyItems,
                                device: getDeviceInfo(
                                    getTonConnectPlatform(sdk.targetEnv),
                                    sdk.version,
                                    maxMessages,
                                    request.params.appName
                                )
                            },
                            manifest: tonConnectManifest!,
                            account,
                            walletId
                        }),
                    300
                );
            }
        } catch (e) {
            tonConnectOperation.fail(e);
            console.error(e);
            setError(String(e).replace(/^Error ?: ?/, ''));
        }
    };

    const onConnectPressed = () => {
        if (!meta) return;
        if (meta.risk !== 'none') {
            setRiskWarningOpen(true);
        } else {
            void approve();
        }
    };

    const isOpen = request !== null && meta !== undefined;
    const caption =
        meta && meta.risk !== 'none' ? t(RISK_CAPTION_KEY[meta.risk]) : t('ton_login_notice');

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={() => {
                    tonConnectOperation.cancel();
                    onClose();
                }}
                variant={screen === 'networks' ? 'content' : 'alert'}
                topBarTitle={screen === 'networks' ? t('connect_networks_to_connect') : undefined}
                onBack={screen === 'networks' ? () => setScreen('connect') : undefined}
            >
                {meta && account && screen === 'connect' && (
                    <ConnectApprovalScreen
                        meta={meta}
                        account={account}
                        accountCount={multichainAccounts.length}
                        networks={networks}
                        error={error}
                        unsupportedProposal={unsupportedProposal}
                        caption={caption}
                        isLoading={isLoading}
                        done={done}
                        onSelectWallet={() => multichainAccounts.length > 1 && setWalletsOpen(true)}
                        onSelectNetworks={() => setScreen('networks')}
                        onConnect={onConnectPressed}
                    />
                )}

                {account && screen === 'networks' && (
                    <ConnectNetworksScreen
                        account={account}
                        networks={networks}
                        onDone={() => setScreen('connect')}
                    />
                )}
            </Modal>

            <ConnectWalletsSheet
                isOpen={walletsOpen}
                accounts={multichainAccounts}
                selectedId={account?.id}
                onSelect={selected => {
                    setAccount(selected);
                    setWalletsOpen(false);
                }}
                onClose={() => setWalletsOpen(false)}
            />

            {meta && meta.risk !== 'none' && (
                <ConnectRiskWarningSheet
                    isOpen={riskWarningOpen}
                    risk={meta.risk}
                    onConnectAnyway={() => {
                        setRiskWarningOpen(false);
                        void approve();
                    }}
                    onCancel={() => setRiskWarningOpen(false)}
                />
            )}
        </>
    );
};

const domainOf = (url: string): string => {
    try {
        return new URL(url).hostname;
    } catch (e) {
        return url;
    }
};
