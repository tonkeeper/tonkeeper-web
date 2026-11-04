import queryString from 'query-string';

import {
    parseEthereumTransferLink,
    parseTronTransferWithAddress,
    seeIfBringToFrontLink
} from '../service/deeplinkingService';
import { isWalletConnectRedirectUrl, parseWalletConnectUri } from '../service/walletConnect/wcUri';
import type { AnalyticsEventDeeplinkOpen } from './events';

type DeeplinkLinkType = AnalyticsEventDeeplinkOpen['link_type'];

const TON_CONNECT_SCHEMES = ['tc:', 'tonkeeper-tc:', 'tonkeeper-pro-tc:'];

/**
 * First-segment names as the native parsers read them, so a link that web has
 * no screen for still reports what it asked for rather than `unknown`.
 */
const LINK_TYPE_BY_HEAD: Record<string, DeeplinkLinkType> = {
    transfer: 'transfer',
    staking: 'staking',
    pool: 'pool',
    swap: 'swap',
    deposit: 'deposit',
    'buy-ton': 'deposit',
    withdraw: 'withdraw',
    action: 'action',
    publish: 'publish',
    signer: 'external_sign',
    dapp: 'dapp',
    battery: 'battery',
    browser: 'browser',
    migration: 'migration',
    migrate: 'migration',
    trading: 'trading',
    assets: 'trade_asset',
    story: 'story',
    receive: 'receive',
    backup: 'backup',
    'add-wallet': 'add_wallet',
    main: 'main',
    wallet: 'main',
    raffle: 'raffle'
};

const isTonConnectRequest = (url: string) => {
    const { query } = queryString.parseUrl(url);
    return query.v === '2' && typeof query.id === 'string' && typeof query.r === 'string';
};

const linkPathHead = (url: URL, raw: string): string | undefined => {
    const isWeb = url.protocol === 'http:' || url.protocol === 'https:';
    let segments = queryString
        .parseUrl(raw)
        .url.split('/')
        .slice(isWeb ? 3 : 2)
        .filter(Boolean);
    if (isWeb && segments[0] === 'pro') {
        segments = segments.slice(1);
    }
    return segments[0]?.toLowerCase();
};

const toLinkType = (raw: string, url: URL): DeeplinkLinkType => {
    if (parseWalletConnectUri(raw)) {
        return 'wallet_connect';
    }
    if (parseEthereumTransferLink(raw) || parseTronTransferWithAddress({ url: raw })) {
        return 'transfer';
    }
    if (TON_CONNECT_SCHEMES.includes(url.protocol)) {
        return isTonConnectRequest(raw) ? 'tonconnect' : 'unknown';
    }

    const head = linkPathHead(url, raw);
    if (head === undefined) {
        return 'main';
    }
    if (head === 'ton-connect') {
        return isTonConnectRequest(raw) ? 'tonconnect' : 'unknown';
    }
    return LINK_TYPE_BY_HEAD[head] ?? 'unknown';
};

/**
 * `null` for links that only bring the app to the foreground (a TonConnect
 * `ret` ping, a WalletConnect redirect-back): they open nothing, so they are
 * neither an app open nor a campaign entry.
 */
export const toDeeplinkOpenEvent = (
    link: string,
    isColdStart: boolean
): AnalyticsEventDeeplinkOpen | null => {
    const raw = link.trim();
    if (!raw) {
        return null;
    }
    if (seeIfBringToFrontLink({ url: raw }) || isWalletConnectRedirectUrl(raw)) {
        return null;
    }

    let url: URL | undefined;
    try {
        url = new URL(raw);
    } catch (e) {
        url = undefined;
    }

    const scheme = url?.protocol;
    return {
        eventName: 'deeplink_open',
        from: scheme === 'https:' || scheme === 'http:' ? 'universal_link' : 'app_link',
        link_type: url ? toLinkType(raw, url) : 'unknown',
        is_cold_start: isColdStart
    };
};
