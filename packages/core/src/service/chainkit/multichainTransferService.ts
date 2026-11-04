import type {
    Account,
    Address,
    Asset,
    Chain,
    ChainMediator,
    Fee,
    TokenType,
    Transaction
} from '@tonkeeper/chainkit';
import { chainkit } from '../../chains/chainkitLoader';
import { unwrap } from '../../chains/result';
import {
    ChainKitAddressType,
    chainKitAddressTypeOf,
    ChainKitNetwork,
    chainKitChainOf,
    chainKitToken,
    getChainKitMediator,
    getChainKitTransactionHelper,
    isSupportedChainKitNetwork
} from './chainKitClient';

/**
 * Multichain transfer service — the web equivalent of iOS `ChainKitService`
 * / Android `ChainKitProvider`. Drives chain-kit's per-chain mediator to
 * estimate and broadcast a transfer on EVM (Ethereum / Base / BSC /
 * Arbitrum), Bitcoin, TRON, and TON.
 *
 * It is SDK-agnostic: callers pass the plaintext BIP39 mnemonic (resolved
 * via the app's passcode / keychain path) into {@link sendMultichainTransfer};
 * {@link estimateMultichainTransfer} needs only the public sender address.
 */

const TOKEN_TYPE_JS: Record<string, () => TokenType> = {
    erc20: () => chainkit().TokenType.Erc20,
    bep20: () => chainkit().TokenType.Bep20,
    trc20: () => chainkit().TokenType.Trc20,
    trc10: () => chainkit().TokenType.Trc10,
    jetton: () => chainkit().TokenType.Jetton
};

export interface ChainKitTransferAsset {
    /** Full backend asset id (`<network>/<chain-network>/<type>/<addr>`). */
    assetId: string;
    network: ChainKitNetwork;
    /** Native coin of the chain (TON / ETH / BTC / TRX) — sent via `Asset.Coin`. */
    isNative: boolean;
    /** Token contract address (token assets only). */
    contract?: string;
    /** Backend type segment: `erc20` | `bep20` | `trc20` | `trc10` | `jetton`. */
    tokenType?: string;
    symbol: string;
    name: string;
    decimals: number;
}

export interface MultichainFeeEstimation {
    /** Network fee in the smallest unit of the asset it is paid in. */
    feeAmount: bigint;
    /** Decimals of the fee asset (e.g. ETH = 18). */
    feeDecimals: number;
    /** Symbol of the fee asset (e.g. `ETH`). */
    feeSymbol: string;
}

export interface MultichainTransferEstimation extends MultichainFeeEstimation {
    /**
     * Amount the transfer actually moves, in the asset's smallest unit: the
     * requested amount, or for a MAX coin send the balance left once the fee
     * is paid.
     */
    amount: bigint;
}

export interface MultichainTransferInput {
    asset: ChainKitTransferAsset;
    fromAddress: string;
    /**
     * Wallet-contract variant of `fromAddress`. TON and Bitcoin derive
     * several addresses from one key, and chain-kit signs only when told
     * which one the sender is.
     */
    fromAddressType: ChainKitAddressType;
    toAddress: string;
    /** Amount in the asset's smallest unit. */
    amount: bigint;
    isMax: boolean;
    /** On-chain comment; honoured only where {@link chainSupportsComment} is true. */
    comment?: string;
}

/** Only TON carries an on-chain comment/memo. Mirrors iOS `isSupportComment`. */
export const chainSupportsComment = (network: ChainKitNetwork): boolean => network === 'ton';

/**
 * Parse a backend `assetId` into the shape this service transacts on, or
 * `undefined` when the network isn't transactable by this chain-kit build
 * (polygon / avalanche / sol). Callers should disable send for those.
 */
export const parseTransferAsset = (
    assetId: string,
    meta: { symbol: string; name: string; decimals: number }
): ChainKitTransferAsset | undefined => {
    const [network, , type = '', contract = ''] = assetId.split('/');
    if (!isSupportedChainKitNetwork(network)) return undefined;
    const isNative = type === 'coin';
    return {
        assetId,
        network,
        isNative,
        contract: isNative ? undefined : contract || undefined,
        tokenType: isNative ? undefined : type,
        symbol: meta.symbol,
        name: meta.name,
        decimals: meta.decimals
    };
};

const buildChainKitAsset = (asset: ChainKitTransferAsset, chain: Chain): Asset => {
    if (asset.isNative) {
        return chainkit().Asset.Coin.Companion.of(chain);
    }
    if (!asset.contract) {
        throw new Error(`Token asset ${asset.assetId} has no contract address`);
    }
    const tokenTypeFactory = asset.tokenType ? TOKEN_TYPE_JS[asset.tokenType] : undefined;
    if (!tokenTypeFactory) {
        throw new Error(`Unsupported token type "${asset.tokenType}" for ${asset.assetId}`);
    }
    return chainKitToken({
        id: asset.assetId,
        chain,
        symbol: asset.symbol,
        name: asset.name,
        decimals: asset.decimals,
        contract: asset.contract,
        tokenType: tokenTypeFactory()
    });
};

const buildSender = (input: MultichainTransferInput, chain: Chain): Address =>
    chainkit().Address.Companion.force(
        input.fromAddress,
        chain,
        chainKitAddressTypeOf(input.fromAddressType)
    );

const buildTransfer = (
    input: MultichainTransferInput,
    chain: Chain,
    account: Account,
    amount: bigint = input.amount
): Transaction => {
    const to = chainkit().Address.Companion.force(input.toAddress, chain);
    const comment =
        input.comment && chainSupportsComment(input.asset.network) ? input.comment : undefined;
    return new (chainkit().Transaction.Transfer)(account, amount, to, input.isMax, comment);
};

/**
 * A MAX coin send pays its fee out of the balance it sends, so the amount
 * is the balance minus the fee — chain-kit's gas reserve, as both native
 * apps run it on confirm. A balance that can't cover the fee keeps the
 * requested amount; the confirm screen's balance check reports it.
 */
const maxCoinAmount = async (
    input: MultichainTransferInput,
    account: Account,
    fee: Fee
): Promise<bigint> => {
    if (!input.isMax || !input.asset.isNative) return input.amount;
    const helper = await getChainKitTransactionHelper();
    const reserve = unwrap(
        await helper.calculateGasReserve(
            account,
            account,
            input.amount,
            true,
            fee,
            chainkit().GasReservePolicy.DrainOrError
        )
    );
    return reserve.isAmountAdjusted && reserve.error == null ? reserve.amount : input.amount;
};

/**
 * chain-kit's `calculateFee` runs a live gas/resource estimation that can
 * fail (e.g. EVM `eth_estimateGas` reverts on an under-funded sender).
 * Fall back to the heuristic `getDefaultFee` so the confirm screen always
 * has a fee to show.
 */
const resolveFee = async (mediator: ChainMediator, transfer: Transaction): Promise<Fee> => {
    const calc = await mediator.fee.calculateFee(transfer);
    if (calc.isOk) return calc.unwrap();
    return unwrap(await mediator.fee.getDefaultFee(transfer));
};

export const estimateMultichainTransfer = async (
    input: MultichainTransferInput
): Promise<MultichainTransferEstimation> => {
    const { network } = input.asset;
    const mediator = await getChainKitMediator(network);
    const chain = chainKitChainOf(network);
    const asset = buildChainKitAsset(input.asset, chain);
    const account = chainkit().Account.Companion.watch(buildSender(input, chain), asset);
    const transfer = buildTransfer(input, chain, account);
    const fee = await resolveFee(mediator, transfer);
    return {
        feeAmount: fee.amount,
        feeDecimals: fee.asset.decimals,
        feeSymbol: fee.asset.symbol,
        amount: await maxCoinAmount(input, account, fee)
    };
};

export const sendMultichainTransfer = async (
    input: MultichainTransferInput & { mnemonic: string[] }
): Promise<{ hash: string }> => {
    const { network } = input.asset;
    const mediator = await getChainKitMediator(network);
    const chain = chainKitChainOf(network);

    const wallet = chainkit().CryptoWallet.Companion.fromMnemonic(input.mnemonic.join(' '));
    const asset = buildChainKitAsset(input.asset, chain);
    const account = chainkit().Account.Companion.owned(
        buildSender(input, chain),
        asset,
        wallet.getPublicKeyHex(chain),
        wallet.getPublicKeySegWit(chain)
    );
    const requested = buildTransfer(input, chain, account);

    const fee = await resolveFee(mediator, requested);
    const amount = await maxCoinAmount(input, account, fee);
    const transfer =
        amount === input.amount ? requested : buildTransfer(input, chain, account, amount);
    const nonce = unwrap(await mediator.account.estimateNonce(account));

    // Bitcoin signs across every UTXO's key, so it needs the full HD
    // wallet; the single-key chains sign with the chain's private key.
    const signRes =
        network === 'btc'
            ? await mediator.sign.transaction.signAndEncodeWithWallet(transfer, fee, nonce, wallet)
            : await mediator.sign.transaction.signAndEncodeWithPrivateKey(
                  transfer,
                  fee,
                  nonce,
                  wallet.getPrivateKey(chain)
              );
    const output = unwrap(signRes).firstOutput();

    const hash = unwrap(await mediator.transaction.sendEncodedTransaction(account, output));
    return { hash };
};
