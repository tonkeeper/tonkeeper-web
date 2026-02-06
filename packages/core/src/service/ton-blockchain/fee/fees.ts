import { Address, Cell } from '@ton/core';

import { TonWalletVersion, FeeBlockchainConfig, assertUnreachable } from './compat';

// ============================================================================
// Types
// ============================================================================

export type WorkchainId = -1 | 0;
export type CellStats = { bits: bigint; cells: bigint };

/**
 * Storage stats for an uninitialized (uninit) TON account — before wallet deployment.
 * Pass this as `storageUsed` when estimating fees for deploy transactions (seqno=0).
 *
 * An uninit account has no code/data/library, only the AccountStorage header:
 * 103 bits = last_trans_lt(64) + Grams(4+32) + ExtraCurrency(1) + account_uninit(2),
 * fitting in a single cell.
 */
export const UNINIT_ACCOUNT_STORAGE: CellStats = { bits: 103n, cells: 1n };

/**
 * Complete wallet fee estimation with all components.
 */
export interface WalletFeeEstimation {
    /** Gas fee for TVM execution */
    gasFee: bigint;
    /** Action fee for sending outMsgs (≈1/3 of fwdFee, stays with sender) */
    actionFee: bigint;
    /** Import fee for external message */
    importFee: bigint;
    /** Storage fee for account state */
    storageFee: bigint;
    /**
     * Forward fee remaining (≈2/3 of fwdFee, deducted from outMsg value).
     * For extension/plugin actions this is 0.
     */
    fwdFeeRemaining: bigint;

    /** walletFee = gasFee + actionFee + importFee + storageFee + fwdFeeRemaining */
    walletFee: bigint;
}

export interface FeeConfigParams {
    msgFwdBitPrice: bigint; // config 24/25
    msgFwdCellPrice: bigint; // config 24/25
    msgFwdLumpPrice: bigint; // config 24/25
    msgFwdFirstFrac: bigint; // config 24/25
    gasPrice: bigint; // config 20/21
    storageBitPrice: bigint; // config 18
    storageCellPrice: bigint; // config 18
}

// ============================================================================
// Internal Constants
// ============================================================================

/** ceil(x / 2^16) */
const shr16ceil = (x: bigint): bigint => (x + 0xffffn) >> 16n;

/** Gas cost for first cell read (transforming Cell → Slice) */
const TVM_CELL_READ_GAS = 100n;

/** Gas cost for cell write (Builder → Cell) */
const TVM_CELL_WRITE_GAS = 500n;

/** Gas cost for cell reload (re-reading already loaded cell) */
const TVM_CELL_RELOAD_GAS = 25n;

/** V5R1 extension action overhead (parsing action, checking existence, etc.) */
const V5R1_EXTENSION_OVERHEAD = 1388n;

const ZERO_STATS: CellStats = { bits: 0n, cells: 0n };

/** V5R1 action tags */
const V5R1_ACTION_ADD_EXTENSION = 0x02;
const V5R1_ACTION_REMOVE_EXTENSION = 0x03;

export interface V5R1ExtensionAction {
    type: 'addExtension' | 'removeExtension';
    address: Address;
}

/** V4R2 plugin action (for future implementation) */
export interface V4R2PluginAction {
    type: 'installPlugin' | 'removePlugin';
    address: Address;
}

// ============================================================================
// Fee Config Extraction
// ============================================================================

// eslint-disable-next-line complexity
export function extractFeeConfig(
    config: FeeBlockchainConfig,
    workchain: WorkchainId = 0
): FeeConfigParams {
    const storageConfigKey = '18';
    const fwdConfigKey = workchain === -1 ? '24' : '25'; // masterchain / basechain
    const gasConfigKey = workchain === -1 ? '20' : '21'; // masterchain / basechain

    const msgForwardPrices = config[fwdConfigKey]?.msgForwardPrices;
    const gasPrices = config[gasConfigKey]?.gasLimitsPrices;
    const storagePrices = config[storageConfigKey]?.storagePrices?.[0];

    return {
        msgFwdBitPrice: BigInt(msgForwardPrices?.bitPrice ?? 26214400),
        msgFwdCellPrice: BigInt(msgForwardPrices?.cellPrice ?? 2621440000),
        msgFwdLumpPrice: BigInt(msgForwardPrices?.lumpPrice ?? 400000),
        msgFwdFirstFrac: BigInt(msgForwardPrices?.firstFrac ?? 21845),
        gasPrice: BigInt(gasPrices?.gasPrice ?? 26214400),
        storageBitPrice: BigInt(storagePrices?.bitPricePs ?? 1),
        storageCellPrice: BigInt(storagePrices?.cellPricePs ?? 500)
    };
}

// ============================================================================
// Basic Fee Calculation Functions
// ============================================================================

/** fwdFee = lumpPrice + ceil((bitPrice * bits + cellPrice * cells) / 2^16) */
export function computeForwardFee(config: FeeConfigParams, bits: bigint, cells: bigint): bigint {
    return (
        config.msgFwdLumpPrice +
        shr16ceil(config.msgFwdBitPrice * bits + config.msgFwdCellPrice * cells)
    );
}

/** Import fee uses same formula as forward fee */
export const computeImportFee = computeForwardFee;

/** actionFee = floor(fwdFee * firstFrac / 2^16) — stays with sender, included in total_fees */
export function computeActionFee(config: FeeConfigParams, fwdFee: bigint): bigint {
    return (fwdFee * config.msgFwdFirstFrac) >> 16n;
}

/** gasFee = floor(gasUsed * gasPrice / 2^16) */
export function computeGasFee(config: FeeConfigParams, gasUsed: bigint): bigint {
    return (gasUsed * config.gasPrice) >> 16n;
}

/** storageFee = ceil((bits * bitPrice + cells * cellPrice) * timeDelta / 2^16) */
export function computeStorageFee(
    config: FeeConfigParams,
    storageUsed: CellStats,
    timeDelta: bigint
): bigint {
    if (timeDelta <= 0n) return 0n;
    const used =
        storageUsed.bits * config.storageBitPrice + storageUsed.cells * config.storageCellPrice;
    return shr16ceil(used * timeDelta);
}

// ============================================================================
// Wallet Gas Calculation
// ============================================================================

export function getWalletGasParams(version: TonWalletVersion): {
    baseGas: bigint;
    gasPerMsg: bigint;
} {
    switch (version) {
        case TonWalletVersion.V5R1:
            return { baseGas: 4222n, gasPerMsg: 717n };
        case TonWalletVersion.V4R2:
            return { baseGas: 2666n, gasPerMsg: 642n };
        case TonWalletVersion.V3R2:
            return { baseGas: 2352n, gasPerMsg: 642n };
        case TonWalletVersion.V3R1:
            return { baseGas: 2275n, gasPerMsg: 642n };
        default:
            return assertUnreachable(version);
    }
}

export function computeWalletGasUsed(version: TonWalletVersion, outMsgsCount: bigint): bigint {
    const { baseGas, gasPerMsg } = getWalletGasParams(version);
    return baseGas + gasPerMsg * outMsgsCount;
}

// ============================================================================
// Cell Stats Utilities
// ============================================================================

function sumStats(a: CellStats, b: CellStats): CellStats {
    return { bits: a.bits + b.bits, cells: a.cells + b.cells };
}

/** Count unique cells (TON deduplicates by hash) */
export function countUniqueCellStats(cell: Cell, visited = new Set<string>()): CellStats {
    const hash = cell.hash().toString('hex');
    if (visited.has(hash)) return ZERO_STATS;
    visited.add(hash);

    return cell.refs
        .map(ref => countUniqueCellStats(ref, visited))
        .reduce(sumStats, { bits: BigInt(cell.bits.length), cells: 1n });
}

/** Sum stats of refs only (excludes root cell) */
export function sumRefsStats(cell: Cell): CellStats {
    const visited = new Set<string>();
    return cell.refs.map(ref => countUniqueCellStats(ref, visited)).reduce(sumStats, ZERO_STATS);
}

// ============================================================================
// OutMsg Workchain Parser
// ============================================================================

/**
 * Parse destination workchain from outMsg.
 * Internal message: int_msg_info$0 ihr_disabled:Bool bounce:Bool bounced:Bool
 *                   src:MsgAddressInt dest:MsgAddressInt ...
 *
 * Note: src can be addr_none (00) in pre-send messages (TVM fills it on send_raw_message)
 */
function parseOutMsgDestWorkchain(outMsg: Cell): WorkchainId {
    const slice = outMsg.beginParse();
    const prefix = slice.loadUint(1);
    if (prefix !== 0) {
        // External message (ext_out_msg_info$11) - use basechain
        return 0;
    }
    // int_msg_info$0 ihr_disabled:Bool bounce:Bool bounced:Bool
    slice.loadBits(3); // ihr_disabled, bounce, bounced
    slice.loadMaybeAddress(); // src (can be addr_none before send)
    const dest = slice.loadAddress(); // dest (must be real address)
    if (dest.workChain !== -1 && dest.workChain !== 0) {
        throw new Error('Invalid destination workchain');
    }

    return dest.workChain;
}

/**
 * Compute action fee for outMsgs, checking destination workchain for each.
 * Forward prices differ for masterchain (-1) vs basechain (0).
 */
function computeActionFeeForOutMsgs(config: FeeBlockchainConfig, outMsgs: Cell[]): bigint {
    return outMsgs.reduce((acc, msg) => {
        const destWorkchain = parseOutMsgDestWorkchain(msg);

        if (destWorkchain === -1) {
            console.warn('Destination workchain is masterchain, not tested yet!!!');
        }

        const fwdConfig = extractFeeConfig(config, destWorkchain);
        const { bits, cells } = sumRefsStats(msg);
        const fwdFee = computeForwardFee(fwdConfig, bits, cells);
        return acc + computeActionFee(fwdConfig, fwdFee);
    }, 0n);
}

/**
 * Compute forward fee remaining for outMsgs.
 * fwdFeeRemaining = fwdFee - actionFee ≈ 2/3 of forward fee.
 * This amount is deducted from the outMsg value during delivery.
 */
export function computeFwdFeeRemaining(config: FeeBlockchainConfig, outMsgs: Cell[]): bigint {
    return outMsgs.reduce((acc, msg) => {
        const destWorkchain = parseOutMsgDestWorkchain(msg);

        if (destWorkchain === -1) {
            console.warn('Destination workchain is masterchain, not tested yet!!!');
        }

        const fwdConfig = extractFeeConfig(config, destWorkchain);
        const { bits, cells } = sumRefsStats(msg);
        const fwdFee = computeForwardFee(fwdConfig, bits, cells);
        const actionFee = computeActionFee(fwdConfig, fwdFee);
        return acc + (fwdFee - actionFee);
    }, 0n);
}

// ============================================================================
// V5R1 Message Parser
// ============================================================================

/**
 * Parse V5R1 extension action from external message.
 * Returns action type and address, or null if not an extension action.
 */
export function parseV5R1ExtensionAction(inMsg: Cell): V5R1ExtensionAction | null {
    try {
        const msgSlice = inMsg.beginParse();

        // External-in message structure (TL-B):
        // ext_in_msg_info$10 src:MsgAddressExt dest:MsgAddressInt import_fee:Grams
        // init:(Maybe (Either StateInit ^StateInit))
        // body:(Either X ^X)
        msgSlice.loadUint(2); // 10 = external-in
        msgSlice.loadUint(2); // src: addr_none$00
        msgSlice.loadAddress(); // dest: wallet address
        msgSlice.loadCoins(); // import_fee (usually 0)

        // Skip StateInit if present: Maybe (Either StateInit ^StateInit)
        if (msgSlice.loadBit()) {
            // Either: 0 = inline StateInit, 1 = ref
            if (msgSlice.loadBit()) {
                msgSlice.loadRef(); // ^StateInit
            } else {
                // Inline StateInit - skip all fields
                // fixed_prefix_length: Maybe (## 5)
                if (msgSlice.loadBit()) msgSlice.loadUint(5);
                // special: Maybe TickTock (tick:Bool tock:Bool)
                if (msgSlice.loadBit()) msgSlice.loadBits(2);
                msgSlice.loadMaybeRef(); // code: Maybe ^Cell
                msgSlice.loadMaybeRef(); // data: Maybe ^Cell
                msgSlice.loadMaybeRef(); // library: Maybe ^Cell
            }
        }

        // Body: Either X ^X (0 = inline, 1 = ref)
        const bodySlice = msgSlice.loadBit() ? msgSlice.loadRef().beginParse() : msgSlice;

        // V5R1 external signed request body structure:
        // opcode(32) + wallet_id(32) + valid_until(32) + seqno(32) + actions + signature(512)
        //
        // Actions structure (storeOutListExtendedV5R1):
        // - MaybeRef: basic out_actions (sendMsg list), null if empty
        // - 1 bit: has_extended_actions
        // - if has_extended: tag(8) + payload INLINE, then refs for more
        // - signature at the END (512 bits)
        const opcode = bodySlice.loadUint(32);
        if (opcode !== 0x7369676e) {
            // Not an external signed request (0x7369676e = "sign")
            return null;
        }

        bodySlice.loadUint(32); // wallet_id
        bodySlice.loadUint(32); // valid_until
        bodySlice.loadUint(32); // seqno

        // MaybeRef: basic actions (sendMsg list)
        if (bodySlice.loadBit()) {
            bodySlice.loadRef(); // skip out_list
        }

        // has_extended_actions bit
        if (!bodySlice.loadBit()) {
            return null; // no extended actions
        }

        // Extended action is stored INLINE: tag(8 bits) + address
        const actionTag = bodySlice.loadUint(8);

        if (actionTag === V5R1_ACTION_ADD_EXTENSION) {
            return { type: 'addExtension', address: bodySlice.loadAddress() };
        } else if (actionTag === V5R1_ACTION_REMOVE_EXTENSION) {
            return { type: 'removeExtension', address: bodySlice.loadAddress() };
        }

        return null;
    } catch {
        return null;
    }
}

// ============================================================================
// Main Wallet Fee Estimator
// ============================================================================

interface EstimateWalletFeeBaseParams {
    walletVersion: TonWalletVersion;
    inMsg: Cell;
    timeDelta: bigint;
    /**
     * Account storage stats (bits & cells) at the moment of the transaction.
     * - For deploy (seqno=0, account not yet active): use {@link UNINIT_ACCOUNT_STORAGE}
     * - For active wallets: get from `account.storage_stat.used` (e.g. via liteserver or TonAPI)
     */
    storageUsed: CellStats;
}

/** Transfer estimation params */
export interface EstimateTransferFeeParams extends EstimateWalletFeeBaseParams {
    walletVersion: TonWalletVersion;
    outMsgs: Cell[];
    existingExtensions?: never;
    existingPlugins?: never;
}

/** V5R1 Extension action estimation params */
export interface EstimateExtensionFeeParams extends EstimateWalletFeeBaseParams {
    walletVersion: TonWalletVersion.V5R1;
    outMsgs?: never;
    existingExtensions: string[];
    existingPlugins?: never;
}

/** V4R2 Plugin action estimation params */
export interface EstimatePluginFeeParams extends EstimateWalletFeeBaseParams {
    walletVersion: TonWalletVersion.V4R2;
    outMsgs?: never;
    existingExtensions?: never;
    existingPlugins: string[];
}

export type EstimateWalletFeeParams =
    | EstimateTransferFeeParams
    | EstimateExtensionFeeParams
    | EstimatePluginFeeParams;

/**
 * Estimate wallet transaction fee.
 *
 * For transfers: pass outMsgs array
 * For V5R1 extension actions: pass existingExtensions (hex hashes from get_extensions)
 * For V4R2 plugin actions: pass existingPlugins (hex hashes from get_plugins)
 *
 * @returns WalletFeeEstimation with all fee components including fwdFeeRemaining
 */
export function estimateWalletFee(
    config: FeeBlockchainConfig,
    params: EstimateWalletFeeParams
): WalletFeeEstimation {
    const { walletVersion, inMsg, timeDelta, storageUsed } = params;

    // Gas & storage fees use basechain config (wallet is always in workchain 0)
    const baseConfig = extractFeeConfig(config, 0);

    // Common fees
    const { bits: msgBits, cells: msgCells } = sumRefsStats(inMsg);
    const importFee = computeImportFee(baseConfig, msgBits, msgCells);
    const storageFee = computeStorageFee(baseConfig, storageUsed, timeDelta);

    // === Transfer mode ===
    if ('outMsgs' in params && params.outMsgs) {
        const gasUsed = computeWalletGasUsed(walletVersion, BigInt(params.outMsgs.length));
        const gasFee = computeGasFee(baseConfig, gasUsed);

        // Action fee checks destination workchain for each outMsg
        const actionFee = computeActionFeeForOutMsgs(config, params.outMsgs);

        // fwdFeeRemaining = sum(fwdFee - actionFee) for all outMsgs
        const fwdFeeRemaining = computeFwdFeeRemaining(config, params.outMsgs);

        const walletFee = gasFee + actionFee + importFee + storageFee + fwdFeeRemaining;

        return { gasFee, actionFee, importFee, storageFee, fwdFeeRemaining, walletFee };
    }

    // === V5R1 Extension mode ===
    if ('existingExtensions' in params && params.existingExtensions) {
        const extensionAction = parseV5R1ExtensionAction(inMsg);
        if (!extensionAction) {
            throw new Error('Failed to parse extension action from inMsg');
        }

        if (extensionAction.type === 'addExtension') {
            const newExtensionHash = extensionAction.address.hash.toString('hex');
            const gasUsed = computeAddExtensionGasFromExtensions(
                params.existingExtensions,
                newExtensionHash
            );
            const gasFee = computeGasFee(baseConfig, gasUsed);
            const actionFee = 0n;
            const fwdFeeRemaining = 0n;
            const walletFee = gasFee + actionFee + importFee + storageFee + fwdFeeRemaining;
            return { gasFee, actionFee, importFee, storageFee, fwdFeeRemaining, walletFee };
        }

        if (extensionAction.type === 'removeExtension') {
            const removeExtensionHash = extensionAction.address.hash.toString('hex');
            const gasUsed = computeRemoveExtensionGasFromExtensions(
                params.existingExtensions,
                removeExtensionHash
            );
            const gasFee = computeGasFee(baseConfig, gasUsed);
            const actionFee = 0n;
            const fwdFeeRemaining = 0n;
            const walletFee = gasFee + actionFee + importFee + storageFee + fwdFeeRemaining;
            return { gasFee, actionFee, importFee, storageFee, fwdFeeRemaining, walletFee };
        }
    }

    // === V4R2 Plugin mode ===
    if ('existingPlugins' in params && params.existingPlugins) {
        if (walletVersion !== TonWalletVersion.V4R2) {
            throw new Error('Plugins are only supported for V4R2 wallets');
        }

        const pluginAction = parseV4R2PluginAction(inMsg);
        if (!pluginAction) {
            throw new Error('Failed to parse plugin action from inMsg');
        }

        if (pluginAction.type === 'installPlugin') {
            const newPluginHash = pluginAction.address.hash.toString('hex');
            const gasUsed = computeInstallPluginGasFromPlugins(
                params.existingPlugins,
                newPluginHash
            );
            const gasFee = computeGasFee(baseConfig, gasUsed);
            const actionFee = 0n;
            const fwdFeeRemaining = 0n;
            const walletFee = gasFee + actionFee + importFee + storageFee + fwdFeeRemaining;
            return { gasFee, actionFee, importFee, storageFee, fwdFeeRemaining, walletFee };
        }

        if (pluginAction.type === 'removePlugin') {
            const removePluginHash = pluginAction.address.hash.toString('hex');
            const gasUsed = computeRemovePluginGasFromPlugins(
                params.existingPlugins,
                removePluginHash
            );
            const gasFee = computeGasFee(baseConfig, gasUsed);
            const actionFee = 0n;
            const fwdFeeRemaining = 0n;
            const walletFee = gasFee + actionFee + importFee + storageFee + fwdFeeRemaining;
            return { gasFee, actionFee, importFee, storageFee, fwdFeeRemaining, walletFee };
        }
    }

    throw new Error('Invalid params: provide outMsgs, existingExtensions, or existingPlugins');
}

// ============================================================================
// V5R1 Extension Gas Calculation
// ============================================================================

/**
 * Compute gas for V5R1 AddExtension action.
 *
 * Based on TVM dict_set implementation (crypto/vm/dict.cpp):
 * - Each cell traversed during insertion costs 100 gas (cell load)
 * - Each cell created costs 500 gas (cell create)
 * - For new key insertion: cellCreates = cellLoads + 2
 *
 * Formula:
 *   gas = baseGas + overhead + cellLoads×100 + (cellLoads+2)×500
 *       = 5610 + 100×L + 500×L + 1000
 *       = 6610 + 600×cellLoads
 *
 * @param cellLoads - number of cells traversed from root to insertion point
 */
export function computeAddExtensionGas(cellLoads: bigint): bigint {
    const { baseGas } = getWalletGasParams(TonWalletVersion.V5R1);
    // baseGas(4222) + overhead(1388) + cellLoads×100 + (cellLoads+2)×500
    // = 5610 + 100×L + 500×L + 1000 = 6610 + 600×L
    return (
        baseGas +
        V5R1_EXTENSION_OVERHEAD +
        1000n +
        cellLoads * (TVM_CELL_READ_GAS + TVM_CELL_WRITE_GAS)
    );
}

/**
 * Compute gas for adding first extension (empty dict → 1 extension).
 * Special case: no trie traversal, just create one cell.
 * Returns 6110 gas units.
 */
export function computeAddFirstExtensionGas(): bigint {
    const { baseGas } = getWalletGasParams(TonWalletVersion.V5R1);
    return baseGas + V5R1_EXTENSION_OVERHEAD + TVM_CELL_WRITE_GAS;
}

// ============================================================================
// Patricia Trie for Extension Gas Calculation
// ============================================================================

interface TrieNode {
    type: 'leaf' | 'fork';
    key?: string;
    labelLength?: number;
    left?: TrieNode;
    right?: TrieNode;
}

function commonPrefixLength(a: string, b: string): number {
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    return i;
}

function buildTrie(keys: string[]): TrieNode | null {
    if (keys.length === 0) return null;
    if (keys.length === 1) return { type: 'leaf', key: keys[0] };

    let prefix = keys[0];
    for (let i = 1; i < keys.length; i++) {
        prefix = prefix.slice(0, commonPrefixLength(prefix, keys[i]));
    }

    const left = keys.filter(k => k[prefix.length] === '0');
    const right = keys.filter(k => k[prefix.length] === '1');

    return {
        type: 'fork',
        labelLength: prefix.length,
        left: buildTrie(left) ?? undefined,
        right: buildTrie(right) ?? undefined
    };
}

function getAllKeys(node: TrieNode | undefined): string[] {
    if (!node) return [];
    if (node.type === 'leaf') return [node.key!];
    return [...getAllKeys(node.left), ...getAllKeys(node.right)];
}

/**
 * Count cells traversed during dict_set from root to insertion point.
 *
 * Based on TVM dict_set implementation (crypto/vm/dict.cpp):
 * - Each LabelParser creation = 1 cell load
 * - Traverse until mismatch (pfx_len < label.l_bits) or reach leaf
 * - Count EVERY cell visited, including pure forks (forks with no label bits)
 *
 * @see https://github.com/ton-blockchain/ton/blob/master/crypto/vm/dict.cpp
 */
function countCellLoads(node: TrieNode | undefined, key: string, pos = 0): number {
    if (!node) return 0;

    // LabelParser label{std::move(dict), n}; -> 1 cell load
    const loads = 1;

    if (node.type === 'leaf') {
        // Leaf node - always loaded, even if key doesn't match
        return loads;
    }

    // Fork node - check if label matches
    const nodeKeys = getAllKeys(node);
    const labelBits = node.labelLength! - pos; // bits in this node's label
    const nodePrefix = nodeKeys[0].slice(pos, node.labelLength);
    const keySlice = key.slice(pos, node.labelLength);

    // Check common prefix length
    let pfxLen = 0;
    while (pfxLen < labelBits && nodePrefix[pfxLen] === keySlice[pfxLen]) pfxLen++;

    if (pfxLen < labelBits) {
        // Mismatch in label - stop here (cell already loaded)
        return loads;
    }

    // Label matches (or pure fork with labelBits=0) - continue to child
    const nextBit = key[node.labelLength!];
    const child = nextBit === '0' ? node.left : node.right;

    return loads + countCellLoads(child, key, node.labelLength! + 1);
}

/**
 * Compute gas for V5R1 AddExtension action from existing extensions.
 *
 * @param existingExtensionHashes - hex hashes of existing extensions (from get_extensions)
 * @param newExtensionHash - hex hash of new extension address (256-bit, 64 chars)
 * @returns gas used in gas units
 *
 * @example
 * ```typescript
 * const existingHashes = ['613fbe57...', 'ba6ede49...'];
 * const newHash = newExtensionAddress.hash.toString('hex');
 * const gasUsed = computeAddExtensionGasFromExtensions(existingHashes, newHash);
 * ```
 */
export function computeAddExtensionGasFromExtensions(
    existingExtensionHashes: string[],
    newExtensionHash: string
): bigint {
    if (existingExtensionHashes.length === 0) {
        return computeAddFirstExtensionGas();
    }

    function hexToBinary(hex: string): string {
        return hex
            .split('')
            .map(c => parseInt(c, 16).toString(2).padStart(4, '0'))
            .join('');
    }

    const binaryKeys = existingExtensionHashes.map(hexToBinary);
    const trie = buildTrie(binaryKeys);

    const newBinaryKey = hexToBinary(newExtensionHash);
    const cellLoads = countCellLoads(trie ?? undefined, newBinaryKey);

    return computeAddExtensionGas(BigInt(cellLoads));
}

// ============================================================================
// Remove Extension Gas Calculation
// ============================================================================

/**
 * V5R1 remove extension overhead (smaller than ADD because no new cells created).
 *
 * Empirically derived from emulation:
 * - ADD overhead: 1388 + 1000 (fork + leaf creation) = 2388
 * - REMOVE overhead: 1068 (no new cells, may merge existing)
 */
const V5R1_REMOVE_EXTENSION_OVERHEAD = 1068n;

/**
 * Extra gas when merging with FORK sibling (has 2 child refs).
 *
 * In TVM cell_builder_add_slice_bool, when sibling is FORK:
 * - size_refs() = 2 → prefetch_ref called twice
 * - Each prefetch_ref may add ~37.5 gas overhead
 *
 * The +75 gas equals 3 × cell_reload (3 × 25 = 75) for edge merge operations:
 * - siblingIsFork case: load FORK sibling + prefetch its 2 child refs
 * - rootCollapse (2→1) case: merge remaining leaf with former root
 *
 * Verified against blockchain:
 * - DELETE from 9 ext (sibling = LEAF): gas = 7690 (no merge)
 * - DELETE from 8 ext (sibling = FORK): gas = 7765 (+75 for FORK handling)
 * - DELETE from 2 ext (root collapse): gas = 6565 (+75 for root merge)
 */
const V5R1_REMOVE_EDGE_MERGE_GAS = TVM_CELL_RELOAD_GAS * 3n;

/**
 * Compute gas for V5R1 RemoveExtension action.
 *
 * Based on TVM dict_delete implementation and emulation verification:
 * - Same traversal cost as ADD (cell loads): cellLoads × (READ + WRITE)
 * - Fewer cell creations: DELETE doesn't create fork/leaf, may merge edges
 * - When sibling is FORK (has children), extra +75 gas for ref handling
 *
 * Formula derived from TVM gas costs (see docs.ton.org/tvm/gas):
 *   gas = baseGas + removeOverhead + cellLoads × (READ + WRITE) + (needsMerge ? 75 : 0)
 *       = 4222 + 1068 + cellLoads × 600 + (needsMerge ? 75 : 0)
 *       = 5290 + 600 × cellLoads + (needsMerge ? 75 : 0)
 *
 * The +75 gas (3 × cell_reload_gas = 3 × 25) is charged when edge merging occurs:
 * - siblingIsFork: sibling has 2 children, each needs prefetch_ref (reload)
 * - rootCollapse (2→1): root fork eliminated, remaining leaf promoted to root
 *
 * Compare to ADD formula: 6610 + 600 × cellLoads (1320 more gas)
 * The difference accounts for:
 * - No fork cell creation (-500 gas)
 * - No leaf cell creation (-500 gas)
 * - Different overhead operations (-320 gas)
 *
 * @param cellLoads - number of cells traversed from root to deletion point
 * @param needsMergeGas - true if edge merge required (siblingIsFork OR rootCollapse)
 */
export function computeRemoveExtensionGas(cellLoads: bigint, needsMergeGas = false): bigint {
    const { baseGas } = getWalletGasParams(TonWalletVersion.V5R1);
    // baseGas(4222) + removeOverhead(1068) + cellLoads×(100 + 500) + mergeExtra
    // = 5290 + 600×cellLoads + (needsMergeGas ? 75 : 0)
    return (
        baseGas +
        V5R1_REMOVE_EXTENSION_OVERHEAD +
        cellLoads * (TVM_CELL_READ_GAS + TVM_CELL_WRITE_GAS) +
        (needsMergeGas ? V5R1_REMOVE_EDGE_MERGE_GAS : 0n)
    );
}

/**
 * Compute gas for removing last extension (1 extension → empty dict).
 *
 * When removing the last extension, the result dict is null (empty).
 * This saves 25 gas because store_dict(null) doesn't require a cell_reload
 * for the reference, unlike store_dict(Cell) which needs to register the ref.
 *
 * Formula: 5290 + 600×1 - 25 = 5865 gas units.
 *
 * Analysis from TVM dict_lookup_delete + W5 contract:
 * - dict_lookup_delete returns (value, null) for last element → no cb.finalize()
 * - W5 calls store_dict(null) → writes 0-bit only, no cell reference
 * - No cell_reload needed for null reference vs non-null Cell
 */
export function computeRemoveLastExtensionGas(): bigint {
    // cellLoads = 1 (read single leaf)
    // -25 because store_dict(null) doesn't need cell_reload for reference
    return computeRemoveExtensionGas(1n) - TVM_CELL_RELOAD_GAS;
}

/**
 * Find sibling node after removing a key from trie.
 * Returns { type: 'leaf' | 'fork', cellLoads } or null if key not found.
 *
 * The sibling is the other branch of the parent fork after deletion.
 * When we delete a leaf, its parent fork merges with the sibling.
 */
function findDeleteInfo(
    node: TrieNode | undefined,
    key: string,
    pos = 0
): { cellLoads: number; siblingIsFork: boolean } | null {
    if (!node) return null;

    // Count cell load for this node
    const loads = 1;

    if (node.type === 'leaf') {
        // Found the leaf to delete - but no sibling info here
        // (sibling is determined by parent, which we track below)
        return node.key === key ? { cellLoads: loads, siblingIsFork: false } : null;
    }

    // Fork node - check if label matches
    const nodeKeys = getAllKeys(node);
    const labelBits = node.labelLength! - pos;
    const nodePrefix = nodeKeys[0].slice(pos, node.labelLength);
    const keySlice = key.slice(pos, node.labelLength);

    // Check common prefix length
    let pfxLen = 0;
    while (pfxLen < labelBits && nodePrefix[pfxLen] === keySlice[pfxLen]) pfxLen++;

    if (pfxLen < labelBits) {
        // Mismatch - key not in trie
        return null;
    }

    // Label matches - continue to child
    const nextBit = key[node.labelLength!];
    const child = nextBit === '0' ? node.left : node.right;
    const sibling = nextBit === '0' ? node.right : node.left;

    const childResult = findDeleteInfo(child, key, node.labelLength! + 1);
    if (!childResult) return null;

    // If child is the leaf being deleted, determine sibling type
    if (child?.type === 'leaf' && child.key === key) {
        // Sibling will be merged with parent fork
        const siblingIsFork = sibling?.type === 'fork';
        return { cellLoads: loads + childResult.cellLoads, siblingIsFork };
    }

    // Propagate from deeper in the tree
    return { cellLoads: loads + childResult.cellLoads, siblingIsFork: childResult.siblingIsFork };
}

/**
 * Compute gas for V5R1 RemoveExtension action from existing extensions.
 *
 * The +75 gas penalty (3 × cell_reload = 3 × 25) applies when edge merging is needed:
 * 1. siblingIsFork = true: sibling has 2 children requiring extra reloads
 * 2. rootCollapse (2→1): root fork collapses, remaining leaf promoted to root
 *
 * Both cases require the same merge overhead because they both involve
 * restructuring the Patricia trie with 3 additional cell reload operations.
 *
 * @param existingExtensionHashes - hex hashes of existing extensions (INCLUDING the one being removed)
 * @param removeExtensionHash - hex hash of extension address to remove (256-bit, 64 chars)
 * @returns gas used in gas units
 */
export function computeRemoveExtensionGasFromExtensions(
    existingExtensionHashes: string[],
    removeExtensionHash: string
): bigint {
    if (existingExtensionHashes.length <= 1) {
        return computeRemoveLastExtensionGas();
    }

    function hexToBinary(hex: string): string {
        return hex
            .split('')
            .map(c => parseInt(c, 16).toString(2).padStart(4, '0'))
            .join('');
    }

    const binaryKeys = existingExtensionHashes.map(hexToBinary);
    const trie = buildTrie(binaryKeys);

    const removeBinaryKey = hexToBinary(removeExtensionHash);
    const deleteInfo = findDeleteInfo(trie ?? undefined, removeBinaryKey);

    // Root collapse: when removing from 2-element dict, root fork is eliminated
    // and remaining leaf is promoted to root. This merge costs +75 gas (3 cell reloads).
    const isRootCollapse = existingExtensionHashes.length === 2;

    if (!deleteInfo) {
        // Key not found - fallback to simple calculation
        const cellLoads = countCellLoads(trie ?? undefined, removeBinaryKey);
        return computeRemoveExtensionGas(BigInt(cellLoads), isRootCollapse);
    }

    // needsMergeGas = siblingIsFork OR rootCollapse (both cause +75 gas)
    const needsMergeGas = deleteInfo.siblingIsFork || isRootCollapse;
    return computeRemoveExtensionGas(BigInt(deleteInfo.cellLoads), needsMergeGas);
}

// ============================================================================
// V4R2 Plugin Gas Calculation (Stubs)
// ============================================================================

/**
 * Parse V4R2 plugin action from external message.
 * TODO: implement parsing (opcodes: 0x2 = install, 0x3 = remove)
 */
export function parseV4R2PluginAction(_inMsg: Cell): V4R2PluginAction | null {
    throw new Error('V4R2 plugin parsing not implemented');
}

/**
 * Compute gas for installing a plugin.
 * TODO: implement (similar to extensions with Patricia trie)
 */
export function computeInstallPluginGasFromPlugins(
    _existingPlugins: string[],
    _newPluginHash: string
): bigint {
    throw new Error('V4R2 plugin install gas calculation not implemented');
}

/**
 * Compute gas for removing a plugin.
 * TODO: implement
 */
export function computeRemovePluginGasFromPlugins(
    _existingPlugins: string[],
    _removePluginHash: string
): bigint {
    throw new Error('V4R2 plugin remove gas calculation not implemented');
}
