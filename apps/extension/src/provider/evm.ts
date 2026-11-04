import { EventEmitter } from '@tonkeeper/core/dist/entries/eventEmitter';

/**
 * The subset of the page↔content↔background transport the EVM provider
 * needs: a request channel that resolves with the background's response.
 * `TonProvider` satisfies it, so the EVM surface reuses the same bridge
 * (origin stamping, id routing) rather than opening a second one.
 */
export interface EvmTransport {
    send<Result>(method: string, ...params: unknown[]): Promise<Result>;
}

interface RequestArguments {
    method: string;
    params?: unknown[] | Record<string, unknown>;
}

type JsonRpcRequest = {
    id?: number | string;
    method: string;
    params?: unknown[] | Record<string, unknown>;
};

type LegacyCallback = (error: Error | null, response?: unknown) => void;

const READ_ADDRESSES = new Set(['eth_requestAccounts', 'eth_accounts']);

/**
 * In-page EIP-1193 provider. It only forwards JSON-RPC to the extension
 * background (which handles reads, connection approval, and signing) and
 * mirrors the connection state the background reports back so synchronous
 * dApp reads (`provider.chainId`, `provider.selectedAddress`) have a value.
 * Discovery happens via EIP-6963; `window.ethereum` is a convenience alias.
 */
export class TonkeeperEvmProvider extends EventEmitter {
    isTonkeeper = true;

    chainId: string | null = null;

    selectedAddress: string | null = null;

    constructor(private transport: EvmTransport) {
        super();
        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
            window.addEventListener('message', this.#onWindowMessage);
        }
    }

    // Background-pushed EIP-1193 events (chainChanged / accountsChanged). Mirrors
    // the origin/source checks in the TON provider so a nested frame can't forge
    // an event.
    #onWindowMessage = (event: MessageEvent): void => {
        if (event.source !== window || event.origin !== window.location.origin) return;
        const data = event.data as { type?: string; event?: { name?: string; data?: unknown } };
        if (!data || data.type !== 'TonkeeperEvmEvent' || !data.event?.name) return;

        const { name, data: payload } = data.event;
        if (name === 'chainChanged' && typeof payload === 'string') {
            this.chainId = payload;
        }
        if (name === 'accountsChanged') {
            this.selectedAddress = Array.isArray(payload) ? (payload[0] as string) ?? null : null;
        }
        this.emit(name, payload);
    };

    request = async ({ method, params }: RequestArguments): Promise<unknown> => {
        const list = Array.isArray(params) ? params : params === undefined ? [] : [params];
        const result = await this.transport.send<unknown>(method, list);
        this.#absorb(method, result);
        return result;
    };

    // EIP-1193 uses `on`/`removeListener`; the base emitter only exposes
    // `off`, so dApp libraries that call `removeListener` need this alias.
    removeListener = (event: string, cb: (...args: unknown[]) => void): void => {
        this.off(event, cb);
    };

    // Legacy affordances kept for pre-EIP-1193 dApp libraries.
    enable = (): Promise<unknown> => this.request({ method: 'eth_requestAccounts' });

    send = (
        methodOrRequest: string | JsonRpcRequest,
        paramsOrCallback?: unknown[] | LegacyCallback
    ): Promise<unknown> | void => {
        if (typeof methodOrRequest === 'string') {
            const params = Array.isArray(paramsOrCallback) ? paramsOrCallback : [];
            return this.request({ method: methodOrRequest, params });
        }
        if (typeof paramsOrCallback === 'function') {
            return this.sendAsync(methodOrRequest, paramsOrCallback);
        }
        return this.request({
            method: methodOrRequest.method,
            params: methodOrRequest.params
        });
    };

    sendAsync = (request: JsonRpcRequest, callback: LegacyCallback): void => {
        this.request({ method: request.method, params: request.params })
            .then(result => callback(null, { id: request.id, jsonrpc: '2.0', result }))
            .catch((error: Error) => callback(error));
    };

    /**
     * Reflect connection state carried by a request's result so the
     * synchronous getters stay consistent without an extra round-trip.
     */
    #absorb(method: string, result: unknown): void {
        if (READ_ADDRESSES.has(method) && Array.isArray(result)) {
            this.selectedAddress = (result[0] as string) ?? null;
        }
        if (method === 'eth_chainId' && typeof result === 'string') {
            this.chainId = result;
        }
    }
}

const TONKEEPER_RDNS = 'com.tonkeeper.wallet';

// A stable per-page identity for the EIP-6963 announcement. It only has to
// be unique among providers on the page and stable across re-announcements,
// not cryptographically random — derived from the rDNS so it's deterministic.
const providerUuid = (): string => {
    let hash = 0;
    for (let i = 0; i < TONKEEPER_RDNS.length; i++) {
        hash = (hash * 31 + TONKEEPER_RDNS.charCodeAt(i)) >>> 0;
    }
    const hex = hash.toString(16).padStart(8, '0');
    return `${hex}-0000-4000-8000-${hex}00000000`.slice(0, 36);
};

/**
 * Announce the provider per EIP-6963 so EVM dApps list Keeper in their
 * in-page wallet picker without clobbering other injected wallets. Answers
 * both the initial announce and later `eip6963:requestProvider` events.
 */
export const announceEvmProvider = (provider: TonkeeperEvmProvider, icon: string): void => {
    const detail = Object.freeze({
        info: Object.freeze({
            uuid: providerUuid(),
            name: 'Keeper',
            icon,
            rdns: TONKEEPER_RDNS
        }),
        provider
    });

    const announce = () => {
        window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail }));
    };

    window.addEventListener('eip6963:requestProvider', announce);
    announce();
};
