import { FC, useEffect, useState } from 'react';

import type { WalletKitTypes } from '@reown/walletkit';
import { walletConnectService } from '@tonkeeper/core/dist/service/walletConnect/walletConnectService';

import {
    useRejectWalletConnectProposal,
    useWalletConnectInit,
    useWalletConnectSessions,
    walletConnectPairSource
} from '../../../../state/walletConnect';
import {
    useWalletConnectPendingRequest,
    useWalletConnectRequestAccount
} from '../../../../state/walletConnectRequest';
import { MultichainConnectFlow } from './MultichainConnectFlow';
import { WalletConnectConfirmSheet } from './WalletConnectConfirmSheet';
import { useEnsureChainKitReady } from '../../../../hooks/useEnsureChainKitReady';

/**
 * App-wide WalletConnect listener: boots the relay client while a
 * multichain account exists, surfaces incoming session proposals as the
 * connect flow, and pending session requests — one at a time — as the
 * Confirm Action sheet.
 */
export const MultichainConnectSubscription: FC = () => {
    useEnsureChainKitReady();
    useWalletConnectInit();

    const [proposal, setProposal] = useState<WalletKitTypes.SessionProposal | null>(null);

    useEffect(() => {
        const unsubscribeProposal = walletConnectService.sessionProposal$.subscribe(incoming =>
            // One proposal at a time; a proposal arriving while another is
            // shown is dropped and the dApp retries with a fresh pairing.
            setProposal(current => current ?? incoming)
        );
        const unsubscribeExpire = walletConnectService.proposalExpired$.subscribe(id =>
            setProposal(current => (current?.id === id ? null : current))
        );
        return () => {
            unsubscribeProposal();
            unsubscribeExpire();
        };
    }, []);

    const { mutate: rejectProposal } = useRejectWalletConnectProposal();

    const request = useWalletConnectPendingRequest();
    const requestAccount = useWalletConnectRequestAccount(request);
    const { data: sessions } = useWalletConnectSessions();
    const requestSession = request && sessions?.find(s => s.topic === request.topic);

    useEffect(() => {
        // A request whose wallet is gone from the app can never be signed —
        // answer it and drop the dead session instead of showing a sheet.
        if (request && sessions && !requestAccount) {
            walletConnectService
                .respondError(request.topic, request.id, 'USER_DISCONNECTED')
                .then(() => walletConnectService.disconnectSession(request.topic))
                .catch(e => console.error(e));
        }
    }, [request, sessions, requestAccount]);

    return (
        <>
            <MultichainConnectFlow
                request={
                    proposal
                        ? {
                              protocol: 'walletConnect',
                              proposal,
                              source: walletConnectPairSource.current
                          }
                        : null
                }
                onClose={() => {
                    if (proposal) rejectProposal(proposal.id);
                    setProposal(null);
                }}
                onWalletConnectApproved={() => setProposal(null)}
            />
            <WalletConnectConfirmSheet
                request={proposal ? undefined : requestAccount ? request : undefined}
                account={requestAccount}
                dappName={requestSession?.name}
                dappUrl={requestSession?.url}
            />
        </>
    );
};

export default MultichainConnectSubscription;
