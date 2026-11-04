import type { IWalletKit, WalletKitTypes } from '@reown/walletkit';
import type { SessionTypes } from '@walletconnect/types';

import { IStorage } from '../../Storage';
import { AccountMultichain } from '../../entries/account';
import { subject } from '../../entries/atom';
import { buildSupportedNamespaces } from './wcChains';
import { REOWN_PROJECT_ID, WALLET_CONNECT_METADATA } from './wcConstants';
import {
    DecodeSessionRequestError,
    WalletConnectRequestPayload,
    decodeSessionRequest
} from './wcRequestTypes';
import { WalletConnectStorage } from './wcStorageAdapter';

type WcUtils = typeof import('@walletconnect/utils');

const DECODE_ERROR_SDK_KEY: Record<
    DecodeSessionRequestError,
    'WC_METHOD_UNSUPPORTED' | 'UNSUPPORTED_CHAINS' | 'USER_REJECTED'
> = {
    unsupported_method: 'WC_METHOD_UNSUPPORTED',
    unsupported_chain: 'UNSUPPORTED_CHAINS',
    invalid_params: 'USER_REJECTED'
};

/**
 * Singleton owner of the Reown WalletKit client: relay lifecycle, pairing,
 * session proposals/requests, and the pending-request queue the UI
 * consumes one entry at a time. The SDK is loaded with a dynamic import
 * on first `init` so it stays out of the boot chunk; sessions persist via
 * {@link WalletConnectStorage} and are restored on the next `init`.
 *
 * The service is deliberately account-agnostic past namespace building:
 * matching a request's address to an account (and activating it) is the
 * UI subscription's job.
 */
export class WalletConnectService {
    private walletKit: IWalletKit | null = null;

    private utils: WcUtils | null = null;

    private initPromise: Promise<IWalletKit> | null = null;

    readonly sessionProposal$ = subject<WalletKitTypes.SessionProposal>();

    readonly proposalExpired$ = subject<number>();

    readonly requestsChanged$ = subject<void>();

    readonly sessionsChanged$ = subject<void>();

    private pendingRequests: WalletConnectRequestPayload[] = [];

    isInited(): boolean {
        return this.walletKit !== null;
    }

    init(storage: IStorage): Promise<IWalletKit> {
        if (this.initPromise === null) {
            this.initPromise = this.doInit(storage).catch(e => {
                this.initPromise = null;
                throw e;
            });
        }
        return this.initPromise;
    }

    private async doInit(storage: IStorage): Promise<IWalletKit> {
        const [{ WalletKit }, { Core }, utils] = await Promise.all([
            import('@reown/walletkit'),
            import('@walletconnect/core'),
            import('@walletconnect/utils')
        ]);
        this.utils = utils;

        const core = new Core({
            projectId: REOWN_PROJECT_ID,
            storage: new WalletConnectStorage(storage),
            // Matches the native apps, which report usage events to the shared
            // Reown project. pulse.walletconnect.org is allowlisted in the app
            // CSP (see utils/csp.mts).
            telemetryEnabled: true
        });
        const walletKit = await WalletKit.init({
            core,
            metadata: WALLET_CONNECT_METADATA
        });

        walletKit.on('session_proposal', proposal => this.sessionProposal$.next(proposal));
        walletKit.on('proposal_expire', ({ id }) => this.proposalExpired$.next(id));
        walletKit.on('session_request', event => this.onSessionRequest(event));
        walletKit.on('session_request_expire', ({ id }) => {
            this.pendingRequests = this.pendingRequests.filter(r => r.id !== id);
            this.requestsChanged$.next();
        });
        walletKit.on('session_delete', ({ topic }) => {
            this.pendingRequests = this.pendingRequests.filter(r => r.topic !== topic);
            this.requestsChanged$.next();
            this.sessionsChanged$.next();
        });

        this.walletKit = walletKit;
        return walletKit;
    }

    private requireKit(): IWalletKit {
        if (this.walletKit === null) {
            throw new Error('WalletConnect is not initialized');
        }
        return this.walletKit;
    }

    private requireUtils(): WcUtils {
        if (this.utils === null) {
            throw new Error('WalletConnect is not initialized');
        }
        return this.utils;
    }

    private onSessionRequest(event: WalletKitTypes.SessionRequest): void {
        const decoded = decodeSessionRequest(event);
        if (!decoded.ok) {
            void this.respondError(event.topic, event.id, DECODE_ERROR_SDK_KEY[decoded.error]);
            return;
        }
        this.pendingRequests = [...this.pendingRequests, decoded.payload];
        this.requestsChanged$.next();
    }

    async pair(uri: string): Promise<void> {
        await this.requireKit().pair({ uri });
    }

    getActiveSessions(): Record<string, SessionTypes.Struct> {
        return this.walletKit?.getActiveSessions() ?? {};
    }

    /**
     * Throws the SDK's "non conforming namespaces" error when the dApp
     * requires chains/methods the account cannot offer — callers surface
     * that as a user-facing "unsupported network" state.
     */
    async approveProposal(
        proposal: WalletKitTypes.SessionProposal,
        account: AccountMultichain
    ): Promise<SessionTypes.Struct> {
        const namespaces = this.requireUtils().buildApprovedNamespaces({
            proposal: proposal.params,
            supportedNamespaces: buildSupportedNamespaces(account)
        });
        const session = await this.requireKit().approveSession({ id: proposal.id, namespaces });
        this.sessionsChanged$.next();
        return session;
    }

    async rejectProposal(proposalId: number): Promise<void> {
        await this.requireKit().rejectSession({
            id: proposalId,
            reason: this.requireUtils().getSdkError('USER_REJECTED')
        });
    }

    pendingRequestsSnapshot(): WalletConnectRequestPayload[] {
        return this.pendingRequests;
    }

    peekRequest(): WalletConnectRequestPayload | undefined {
        return this.pendingRequests[0];
    }

    async respondSuccess(topic: string, id: number, result: unknown): Promise<void> {
        await this.respond(topic, id, { id, jsonrpc: '2.0', result });
    }

    async respondError(
        topic: string,
        id: number,
        sdkErrorKey: Parameters<WcUtils['getSdkError']>[0] = 'USER_REJECTED',
        message?: string
    ): Promise<void> {
        const error = this.requireUtils().getSdkError(sdkErrorKey);
        await this.respond(topic, id, {
            id,
            jsonrpc: '2.0',
            error: { code: error.code, message: message ?? error.message }
        });
    }

    private async respond(
        topic: string,
        id: number,
        response: { id: number; jsonrpc: '2.0' } & (
            | { result: unknown }
            | { error: { code: number; message: string } }
        )
    ): Promise<void> {
        try {
            await this.requireKit().respondSessionRequest({ topic, response });
        } finally {
            this.pendingRequests = this.pendingRequests.filter(r => r.id !== id);
            this.requestsChanged$.next();
        }
    }

    async disconnectSession(topic: string): Promise<void> {
        await this.requireKit().disconnectSession({
            topic,
            reason: this.requireUtils().getSdkError('USER_DISCONNECTED')
        });
        this.pendingRequests = this.pendingRequests.filter(r => r.topic !== topic);
        this.requestsChanged$.next();
        this.sessionsChanged$.next();
    }
}

export const walletConnectService = new WalletConnectService();
