import { AppKey } from '../../Keys';
import { IStorage } from '../../Storage';
import { ChainKitSessionTokenProvider } from './chainKitClient';
import { multichainApiBaseUrl } from '../multichainEndpoints';

/**
 * Mirror of the multichain backend's node manifest (`GET /api/v1/nodes`) —
 * the per-chain RPC node lists chain-kit routes its requests through.
 * chain-kit fetches and rotates the same manifest internally; this copy
 * exists for the one job chain-kit can't do from inside the sandbox:
 * telling the host which origins its CSP `connect-src` must allow.
 *
 * Node URLs in the manifest are arbitrary and change server-side, so any
 * shell that enforces a `connect-src` must fetch this before chain-kit
 * makes its first request and rebuild the policy from
 * {@link getChainKitConnectSrcOrigins}. The manifest refreshes every
 * ~30 minutes; a shell whose CSP is fixed for the page lifetime (e.g. a
 * meta tag) picks new origins up on the next load, while the cached copy
 * keeps boot synchronous.
 *
 * The endpoint is ETag-driven (`If-None-Match` → `304`) and authenticated
 * with the device JWT when a session exists; without one it answers a
 * public manifest, same as chain-kit's own unauthenticated fallback.
 */

export const NODES_MANIFEST_REFRESH_INTERVAL_MS = 30 * 60 * 1000;

interface ManifestNode {
    url: string;
    rate_limit: number;
    token?: string;
    type: 'main' | 'fallback';
}

interface NodesManifest {
    data: Record<string, ManifestNode[]>;
    timestamp: number;
}

interface StoredManifest {
    etag: string;
    manifest: NodesManifest;
}

const originOf = (url: string): string | null => {
    try {
        return new URL(url).origin;
    } catch {
        return null;
    }
};

export const manifestOrigins = (manifest: NodesManifest): string[] => {
    const origins = new Set<string>();
    for (const nodes of Object.values(manifest.data)) {
        for (const node of nodes) {
            const origin = originOf(node.url);
            if (origin) {
                origins.add(origin);
            }
        }
    }
    return [...origins];
};

export class NodesManifestService {
    private refreshTimer: ReturnType<typeof setInterval> | null = null;

    constructor(
        private readonly storage: IStorage,
        private readonly session?: ChainKitSessionTokenProvider
    ) {}

    /**
     * Fetch the manifest once and keep it fresh on the 30-minute cadence.
     * Failures fall back to the stored copy; the very first fetch failing
     * just means origins resolve from the static chain-kit defaults until
     * the next tick.
     */
    start(): void {
        if (this.refreshTimer) {
            return;
        }
        void this.refresh();
        this.refreshTimer = setInterval(
            () => void this.refresh(),
            NODES_MANIFEST_REFRESH_INTERVAL_MS
        );
    }

    stop(): void {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    async refresh(): Promise<NodesManifest | null> {
        const stored = await this.storage.get<StoredManifest>(AppKey.MULTICHAIN_NODES_MANIFEST);
        try {
            const headers: Record<string, string> = {};
            if (stored?.etag) {
                headers['If-None-Match'] = stored.etag;
            }
            const token = await this.session?.getAccessToken();
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const response = await fetch(`${multichainApiBaseUrl()}/nodes`, { headers });
            if (response.status === 304) {
                return stored?.manifest ?? null;
            }
            if (!response.ok) {
                throw new Error(`nodes manifest fetch failed: ${response.status}`);
            }
            const manifest: NodesManifest = await response.json();
            await this.storage.set<StoredManifest>(AppKey.MULTICHAIN_NODES_MANIFEST, {
                // Keep the previous ETag when the backend omits the header,
                // otherwise the next request drops the If-None-Match
                // handshake and refetches in full.
                etag: response.headers.get('ETag') ?? stored?.etag ?? '',
                manifest
            });
            return manifest;
        } catch (e) {
            console.warn('chainkit nodes manifest refresh failed, serving cached copy', e);
            return stored?.manifest ?? null;
        }
    }

    /** Origins of every node in the freshest manifest available, for CSP `connect-src`. */
    async getNodeOrigins(): Promise<string[]> {
        const stored = await this.storage.get<StoredManifest>(AppKey.MULTICHAIN_NODES_MANIFEST);
        if (stored) {
            return manifestOrigins(stored.manifest);
        }
        const manifest = await this.refresh();
        return manifest ? manifestOrigins(manifest) : [];
    }
}
