import BigNumber from 'bignumber.js';

import { TransferInitParams } from '../AppSdk';
import { ChainId } from '../chains/types';
import { BLOCKCHAIN_NAME } from '../entries/crypto';
import { TRON_USDT_ASSET } from '../entries/crypto/asset/constants';
import { areEqAddresses, seeIfValidTonAddress, seeIfValidTronAddress } from '../utils/common';
import { MultichainWalletAsset } from './multichainWalletService';

export interface MultichainTransferIntent {
    /**
     * The asset the payload names, when the wallet holds it. `undefined`
     * means the send flow opens on the asset picker.
     */
    asset?: MultichainWalletAsset;
    /** Seed values for the send form. */
    form: {
        toAddress?: string;
        amountDisplay?: string;
        comment?: string;
    };
    /**
     * The payload named a chain or token the wallet's asset list doesn't
     * contain (unknown jetton, or a zero balance the backend omits).
     * Callers surface this instead of guessing a different token.
     */
    assetUnavailable: boolean;
    /**
     * Network keys (`ton`, `eth`, …) the asset picker should be scoped
     * to — the chains the recipient address is valid on. `undefined`
     * leaves the picker unscoped.
     */
    pickerNetworks?: string[];
}

function assetIdSegments(assetId: string): { network: string; type: string; address: string } {
    const [network = '', , type = '', address = ''] = assetId.split('/');
    return { network, type, address };
}

function findNative(
    assets: MultichainWalletAsset[],
    network: string
): MultichainWalletAsset | undefined {
    return assets.find(a => {
        const segments = assetIdSegments(a.assetId);
        return segments.network === network && segments.type === 'coin';
    });
}

function findJetton(
    assets: MultichainWalletAsset[],
    jetton: string
): MultichainWalletAsset | undefined {
    return assets.find(a => {
        const segments = assetIdSegments(a.assetId);
        if (segments.network !== 'ton' || segments.type !== 'jetton') return false;
        return areEqAddresses(segments.address, jetton);
    });
}

/**
 * Canonical ids are compared segment-wise: the chain/network/type parts
 * are fixed lowercase keys, while the trailing address is chain-aware —
 * TON addresses have several equivalent string forms, 0x addresses
 * differ only by checksum casing, and anything else (base58) matches
 * verbatim.
 */
function areEqAssetIds(left: string, right: string): boolean {
    const l = left.split('/');
    const r = right.split('/');
    if (l.length < 3 || r.length < 3) return false;
    for (let i = 0; i < 3; i += 1) {
        if (l[i].toLowerCase() !== r[i].toLowerCase()) return false;
    }
    const lAddress = l.slice(3).join('/');
    const rAddress = r.slice(3).join('/');
    if (lAddress === rAddress) return true;
    if (l[0].toLowerCase() === 'ton') return areEqAddresses(lAddress, rAddress);
    if (lAddress.startsWith('0x') && rAddress.startsWith('0x')) {
        return lAddress.toLowerCase() === rAddress.toLowerCase();
    }
    return false;
}

function findByAssetId(
    assets: MultichainWalletAsset[],
    assetId: string
): MultichainWalletAsset | undefined {
    return assets.find(a => areEqAssetIds(a.assetId, assetId));
}

/**
 * Tether is the only TRC-20 the Tron transfer scheme carries. Matched by
 * contract address: a ticker is not unique and a lookalike token could
 * carry the same symbol.
 */
function findTronToken(assets: MultichainWalletAsset[]): MultichainWalletAsset | undefined {
    return assets.find(a => {
        const segments = assetIdSegments(a.assetId);
        return (
            segments.network === 'tron' &&
            segments.type === 'trc20' &&
            segments.address === TRON_USDT_ASSET.address
        );
    });
}

const EVM_RECIPIENT_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const BTC_RECIPIENT_PATTERN = /^(bc1[a-z0-9]{8,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/;

/**
 * Chains a recipient address is well-formed on. `ChainId` granularity —
 * every EVM network shares the 0x format, so a 0x address is valid on
 * all of them. An address matching nothing (e.g. a `.ton` domain the
 * caller didn't resolve) yields an empty list, which callers treat as
 * "don't scope".
 */
export function chainsValidForRecipient(address: string): ChainId[] {
    if (EVM_RECIPIENT_PATTERN.test(address)) return ['evm'];
    if (seeIfValidTronAddress(address)) return ['tron'];
    if (seeIfValidTonAddress(address)) return ['ton'];
    if (BTC_RECIPIENT_PATTERN.test(address)) return ['btc'];
    return [];
}

/**
 * Network keys of the wallet's assets on the chains the recipient is
 * valid on — what the asset picker gets scoped to. `undefined` (address
 * unclassifiable, or no holdings on those chains) leaves it unscoped.
 */
function networksForRecipient(
    address: string | undefined,
    assets: MultichainWalletAsset[]
): string[] | undefined {
    if (!address) return undefined;
    const chains = chainsValidForRecipient(address);
    if (chains.length === 0) return undefined;
    const networks = new Set<string>();
    for (const asset of assets) {
        if (chains.includes(asset.chain)) {
            networks.add(assetIdSegments(asset.assetId).network);
        }
    }
    return networks.size > 0 ? Array.from(networks) : undefined;
}

/**
 * Deeplink amounts are raw base units (nanotons for TON, wei for EVM),
 * so the display value depends on the resolved asset's `decimals`. An
 * amount that can't be read as a number is dropped rather than shown as
 * `NaN` — the user still gets the address and picks the amount.
 */
function toAmountDisplay(raw: string | undefined, decimals: number): string | undefined {
    if (raw === undefined || raw.trim() === '') return undefined;
    const value = new BigNumber(raw);
    if (!value.isFinite() || value.isLessThanOrEqualTo(0)) return undefined;
    return value.shiftedBy(-decimals).toFixed();
}

/**
 * Resolve a `transfer` uiEvent payload — a scanned QR or a `ton://` /
 * `tron:` / `ethereum:` link — against a multichain wallet's asset list,
 * producing the asset to pre-select and the values to seed the send form
 * with.
 *
 * A pinned asset (`assetId`, or the `jetton` param on a TON payload) is
 * honoured only when the recipient can actually receive it — otherwise
 * the asset and the amount are dropped and the picker opens scoped to
 * the chains the recipient is valid on. A TON payload with an amount
 * pins the native coin — the nanoton denomination is the link's own —
 * while a payload that pins nothing opens the picker the same way
 * rather than defaulting to a coin: which asset a bare address means is
 * the user's call. TRON payloads keep their scheme's meaning — the
 * wallet's TRC-20 Tether, falling back to native TRX — and payloads
 * with no address at all (a programmatic "open send") keep
 * pre-selecting the native TON coin.
 */
export function resolveMultichainTransferIntent(
    payload: TransferInitParams,
    assets: MultichainWalletAsset[]
): MultichainTransferIntent {
    if (payload.chain === BLOCKCHAIN_NAME.TRON) {
        const asset = findTronToken(assets) ?? findNative(assets, 'tron');
        return {
            asset,
            form: { toAddress: payload.address },
            assetUnavailable: asset === undefined
        };
    }

    if (payload.chain === BLOCKCHAIN_NAME.TON) {
        if (payload.jetton) {
            const asset = findJetton(assets, payload.jetton);
            return {
                asset,
                form: {
                    toAddress: payload.address,
                    amountDisplay: asset && toAmountDisplay(payload.amount, asset.decimals),
                    comment: payload.text
                },
                assetUnavailable: asset === undefined
            };
        }
        if (payload.address) {
            // A `ton://transfer` amount is nanotons — the link itself
            // denominates it in the native coin, so a readable amount
            // pins the coin and prefills the form.
            const native = findNative(assets, 'ton');
            const amountDisplay = native && toAmountDisplay(payload.amount, native.decimals);
            if (amountDisplay !== undefined) {
                return {
                    asset: native,
                    form: {
                        toAddress: payload.address,
                        amountDisplay,
                        comment: payload.text
                    },
                    assetUnavailable: false
                };
            }
            return {
                form: { toAddress: payload.address, comment: payload.text },
                assetUnavailable: false,
                pickerNetworks: networksForRecipient(payload.address, assets)
            };
        }
        const asset = findNative(assets, 'ton');
        return {
            asset,
            form: {},
            assetUnavailable: asset === undefined
        };
    }

    const assetId = 'assetId' in payload ? payload.assetId : undefined;
    const erc20Contract = 'erc20Contract' in payload ? payload.erc20Contract : undefined;
    const address = 'address' in payload ? payload.address : undefined;
    const amount = 'amount' in payload ? payload.amount : undefined;
    const text = 'text' in payload ? payload.text : undefined;

    if (typeof assetId === 'string') {
        const asset = findByAssetId(assets, assetId);
        if (asset === undefined) {
            return {
                form: { toAddress: address },
                assetUnavailable: true,
                pickerNetworks: networksForRecipient(address, assets)
            };
        }
        if (address && !chainsValidForRecipient(address).includes(asset.chain)) {
            // The recipient can't receive the pinned asset: the asset is
            // dropped rather than seeded as a guaranteed chain mismatch,
            // and the amount — denominated in it — goes with it.
            return {
                form: { toAddress: address },
                assetUnavailable: false,
                pickerNetworks: networksForRecipient(address, assets)
            };
        }
        const isTon = assetId.split('/')[0]?.toLowerCase() === 'ton';
        return {
            asset,
            form: {
                toAddress: address,
                amountDisplay: toAmountDisplay(amount, asset.decimals),
                // Only TON transfers carry an on-chain text comment.
                comment: isTon ? text : undefined
            },
            assetUnavailable: false
        };
    }

    if (typeof erc20Contract === 'string') {
        // An ERC-681 link without a chain id names a token but not a
        // network, so the contract is probed across the wallet's EVM
        // assets: a single hit is enough to prefill the whole form,
        // anything else falls back to a chain-scoped picker.
        const matches = assets.filter(a => {
            if (a.chain !== 'evm') return false;
            const tokenAddress = assetIdSegments(a.assetId).address;
            return (
                tokenAddress.startsWith('0x') &&
                tokenAddress.toLowerCase() === erc20Contract.toLowerCase()
            );
        });
        if (matches.length === 1) {
            const asset = matches[0];
            return {
                asset,
                form: {
                    toAddress: address,
                    amountDisplay: toAmountDisplay(amount, asset.decimals)
                },
                assetUnavailable: false
            };
        }
        return {
            form: { toAddress: address },
            assetUnavailable: false,
            pickerNetworks:
                matches.length > 1
                    ? matches.map(m => assetIdSegments(m.assetId).network)
                    : networksForRecipient(address, assets)
        };
    }

    if (address) {
        return {
            form: { toAddress: address },
            assetUnavailable: false,
            pickerNetworks: networksForRecipient(address, assets)
        };
    }

    // A payload with no chain carries no intent beyond "open send".
    return { form: {}, assetUnavailable: false };
}
