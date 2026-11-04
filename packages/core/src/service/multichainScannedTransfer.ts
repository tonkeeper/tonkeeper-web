import queryString from 'query-string';

import { TransferInitParams } from '../AppSdk';
import { BLOCKCHAIN_NAME } from '../entries/crypto';
import {
    parseAssetIdTransfer,
    parseEthereumTransferLink,
    parseTronTransferWithAddress
} from './deeplinkingService';
import { resolveMultichainTransferIntent } from './multichainTransferIntent';
import { MultichainWalletAsset } from './multichainWalletService';

export type ScannedTransfer =
    | { kind: 'transfer'; payload: TransferInitParams }
    /** A TON transfer link past its `exp`. */
    | { kind: 'expired' }
    /** A TON transfer link carrying a raw payload or state init the send form can't reproduce. */
    | { kind: 'unsupported' }
    /** Not a transfer link — the value goes into the address field as scanned. */
    | { kind: 'text'; value: string };

const TON_TRANSFER_SCHEMES = ['ton:', 'tonkeeper:', 'http:', 'https:'];

/** `transfer/<address>` of `ton://`, `tonkeeper://` and universal links; `null` otherwise. */
function tonTransferAddress(url: string): string | null {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch (e) {
        return null;
    }
    if (!TON_TRANSFER_SCHEMES.includes(parsed.protocol)) return null;

    const isWeb = parsed.protocol === 'http:' || parsed.protocol === 'https:';
    let segments = (isWeb ? parsed.pathname : `${parsed.host}${parsed.pathname}`)
        .split('/')
        .filter(s => s !== '');
    if (isWeb && segments[0] === 'pro') segments = segments.slice(1);

    if (segments.length !== 2 || segments[0] !== 'transfer') return null;
    try {
        return decodeURIComponent(segments[1]);
    } catch (e) {
        return segments[1];
    }
}

const queryParam = (query: queryString.ParsedQuery, name: string): string | undefined => {
    const value = query[name];
    return typeof value === 'string' ? value : undefined;
};

/**
 * Reads a value scanned on the multichain send form as the transfer link
 * it may be — TON (`ton://transfer/…`, `tonkeeper://…`, universal links,
 * `asset_id` links), ERC-681 `ethereum:` and `tron:` — producing the
 * transfer payload that `resolveMultichainTransferIntent` resolves
 * against the asset being sent. Anything else is handed back as text.
 *
 * Expiry follows the deeplink pipeline's 10-second grace window.
 */
export function parseScannedTransfer(
    scanned: string,
    nowSeconds: number = Date.now() / 1000
): ScannedTransfer {
    const value = scanned.trim();

    const ethereum = parseEthereumTransferLink(value);
    if (ethereum) {
        return { kind: 'transfer', payload: { ...ethereum, from: 'qr-code', origin: 'qr_code' } };
    }

    const tonAddress = tonTransferAddress(value);
    if (tonAddress !== null) {
        const { query } = queryString.parseUrl(value);
        if (queryParam(query, 'bin') !== undefined || queryParam(query, 'init') !== undefined) {
            return { kind: 'unsupported' };
        }
        const exp = Number.parseInt(queryParam(query, 'exp') ?? '');
        if (Number.isFinite(exp) && exp - 10 < nowSeconds) {
            return { kind: 'expired' };
        }

        const assetTransfer = parseAssetIdTransfer(value);
        if (assetTransfer) {
            return {
                kind: 'transfer',
                payload: {
                    ...assetTransfer,
                    address: tonAddress,
                    from: 'qr-code',
                    origin: 'qr_code'
                }
            };
        }
        return {
            kind: 'transfer',
            payload: {
                chain: BLOCKCHAIN_NAME.TON,
                address: tonAddress,
                amount: queryParam(query, 'amount'),
                text: queryParam(query, 'text'),
                jetton: queryParam(query, 'jetton'),
                from: 'qr-code',
                origin: 'qr_code'
            }
        };
    }

    if (value.toLowerCase().startsWith('tron:')) {
        const tron = parseTronTransferWithAddress({ url: value });
        if (tron) {
            return {
                kind: 'transfer',
                payload: {
                    chain: BLOCKCHAIN_NAME.TRON,
                    address: tron.address,
                    from: 'qr-code',
                    origin: 'qr_code'
                }
            };
        }
    }

    return { kind: 'text', value };
}

export type ScannedSendForm =
    | { kind: 'form'; toAddress: string; amountDisplay?: string; comment?: string }
    | { kind: 'expired' }
    | { kind: 'unsupported' };

/**
 * What a scan fills on the send form of `asset`: the link's recipient
 * always, its comment when it has one, and its amount only when the link
 * denominates it in `asset` — an amount in another coin or token would be
 * read in the wrong units.
 */
export function scannedSendForm(
    scanned: string,
    asset: MultichainWalletAsset,
    nowSeconds?: number
): ScannedSendForm {
    const parsed = parseScannedTransfer(scanned, nowSeconds);
    if (parsed.kind === 'expired' || parsed.kind === 'unsupported') return parsed;
    if (parsed.kind === 'text') return { kind: 'form', toAddress: parsed.value };

    const intent = resolveMultichainTransferIntent(parsed.payload, [asset]);
    return {
        kind: 'form',
        toAddress: intent.form.toAddress ?? '',
        amountDisplay: intent.asset ? intent.form.amountDisplay : undefined,
        comment: intent.form.comment
    };
}
