import type {
    Address,
    AddressType,
    Asset,
    Chain,
    ChainMediator,
    CryptoKitClient,
    SessionTokenProvider,
    TokenType,
    TransactionHelper
} from '@tonkeeper/chainkit';
import { chainkit, loadChainkit } from '../../chains/chainkitLoader';
import { ChainId } from '../../chains/types';
import { WalletForChain } from '../../chains/wallet-selector';
import { isStandardTonWallet, WalletVersion } from '../../entries/wallet';

/**
 * Network codes the multichain backend puts in the first segment of an
 * `assetId` (`<network>/<chain-network>/<type>/<addr>`) that this
 * chain-kit build can actually transact on. `evm` is split into its
 * concrete networks here because chain-kit selects gas rules, chain id,
 * and node provider per network — Ethereum, Base, BSC (`Smartchain`),
 * and Arbitrum are distinct `Chain` constants, not one "EVM" chain.
 *
 * `polygon` / `avalanche` / `sol` are intentionally absent, so a transfer
 * on those networks is never constructed and the caller must surface that.
 */
export type ChainKitNetwork = 'ton' | 'eth' | 'base' | 'bsc' | 'arb' | 'btc' | 'tron';

const CHAINKIT_CHAIN: Record<ChainKitNetwork, () => Chain> = {
    ton: () => chainkit().Chain.Ton.Mainnet,
    eth: () => chainkit().Chain.Ethereum.Mainnet,
    base: () => chainkit().Chain.Base.Mainnet,
    bsc: () => chainkit().Chain.Smartchain.Mainnet,
    arb: () => chainkit().Chain.Arbitrum.Mainnet,
    btc: () => chainkit().Chain.Bitcoin.Mainnet,
    tron: () => chainkit().Chain.Tron.Mainnet
};

export const isSupportedChainKitNetwork = (head: string): head is ChainKitNetwork =>
    Object.prototype.hasOwnProperty.call(CHAINKIT_CHAIN, head);

/**
 * The chain-kit `Chain` constant for an asset network code. Caller must have
 * awaited `loadChainkit()` (directly or via {@link getChainKitMediator}) first.
 */
export const chainKitChainOf = (network: ChainKitNetwork): Chain => CHAINKIT_CHAIN[network]();

/**
 * Wallet-contract variant an address was derived with. One key derives
 * several TON (V4R2 / V5R1) and Bitcoin (segwit / taproot) addresses, and
 * chain-kit refuses to sign from those chains without being told which;
 * `default` is only meaningful on single-address chains (EVM / TRON).
 */
export type ChainKitAddressType = 'default' | 'tonV4R2' | 'tonV5R1' | 'btcSegwit';

const CHAINKIT_ADDRESS_TYPE: Record<ChainKitAddressType, () => AddressType> = {
    default: () => chainkit().AddressType.Default,
    tonV4R2: () => chainkit().AddressType.TonV4R2,
    tonV5R1: () => chainkit().AddressType.TonV5R1,
    btcSegwit: () => chainkit().AddressType.BtcSegwit
};

/** The chain-kit `AddressType` constant. Caller must have awaited `loadChainkit()`. */
export const chainKitAddressTypeOf = (type: ChainKitAddressType): AddressType =>
    CHAINKIT_ADDRESS_TYPE[type]();

/**
 * The address type of a wallet the app holds on disk. Multichain accounts
 * only derive V4R2 / V5R1 TON wallets and segwit Bitcoin wallets, so those
 * are the only shapes that map to a specific type.
 */
export const chainKitAddressTypeOfWallet = (
    wallet: WalletForChain<ChainId>
): ChainKitAddressType => {
    if ('chain' in wallet) {
        return wallet.chain === 'btc' ? 'btcSegwit' : 'default';
    }
    if (isStandardTonWallet(wallet)) {
        if (wallet.version === WalletVersion.V5R1) return 'tonV5R1';
        if (wallet.version === WalletVersion.V4R2) return 'tonV4R2';
    }
    return 'default';
};

type TokenConstructor = new (
    id: string,
    chain: Chain,
    symbol: string,
    name: string,
    decimals: number,
    contract: Address,
    tokenType: TokenType,
    tokenId: string
) => Asset;

/**
 * A fungible token as a chain-kit `Asset`. `Asset.Token` is constructible
 * at runtime but declared with a private constructor in chain-kit's typings.
 */
export const chainKitToken = (token: {
    id: string;
    chain: Chain;
    symbol: string;
    name: string;
    decimals: number;
    contract: string;
    tokenType: TokenType;
}): Asset => {
    const kit = chainkit();
    const Token = kit.Asset.Token as unknown as TokenConstructor;
    return new Token(
        token.id,
        token.chain,
        token.symbol,
        token.name,
        token.decimals,
        kit.Address.Companion.force(token.contract, token.chain),
        token.tokenType,
        ''
    );
};

/**
 * The shape chain-kit's `NetConfig.sessionProvider` expects (its JS
 * `SessionTokenProvider` interface). `getAccessToken` returning `null`
 * means "no session" and chain-kit sends the request unauthenticated —
 * same contract the native apps use.
 */
export interface ChainKitSessionTokenProvider {
    getAccessToken(): Promise<string | null>;
    refreshToken(expiredToken: string): Promise<string | null>;
}

let sessionTokenProvider: ChainKitSessionTokenProvider | null = null;
let client: CryptoKitClient | null = null;

/**
 * Install the session provider that authenticates chain-kit's node
 * manifest call and the RPC nodes that require a device token. Must be
 * wired at shell boot, before the first transfer/swap touches chain-kit;
 * a provider installed later only applies to a freshly built client, so
 * the memoised one is dropped. Installing the provider does NOT load
 * chain-kit — the SDK stays out of the boot bundle.
 */
export const setChainKitSessionTokenProvider = (
    provider: ChainKitSessionTokenProvider | null
): void => {
    sessionTokenProvider = provider;
    client = null;
};

/**
 * Lazily build the singleton `CryptoKitClient`. chain-kit ships its own
 * default node providers and refreshes the live node manifest from the
 * multichain backend, so no RPC URLs are supplied — only the metadata
 * `NetConfig(isLogging, userAgent, sessionProvider)`. Callers reach the
 * client through {@link getChainKitMediator}, which awaits the lazy SDK
 * load before the first construction.
 */
const getClient = (): CryptoKitClient => {
    if (!client) {
        const kit = chainkit();
        client = new kit.CryptoKitClient(
            new kit.NetConfig(
                false,
                'Tonkeeper-Web',
                // Declared as a Kotlin interface JS may not implement, but
                // chain-kit only calls its two methods.
                sessionTokenProvider as unknown as SessionTokenProvider | null
            )
        );
    }
    return client;
};

/**
 * Per-chain mediator (`account` / `fee` / `sign` / `transaction` / `node`
 * delegates). Awaits the lazy load of the full networked SDK (this is the
 * point where the chain-kit root chunk is downloaded) so synchronous
 * chain-kit calls downstream are safe.
 */
export const getChainKitMediator = async (network: ChainKitNetwork): Promise<ChainMediator> => {
    await loadChainkit();
    return getClient().getMediator(chainKitChainOf(network));
};

/**
 * chain-kit's gas-reserve arithmetic, fed by the live node balance of the
 * account it is asked about.
 */
export const getChainKitTransactionHelper = async (): Promise<TransactionHelper> => {
    await loadChainkit();
    return new (chainkit().TransactionHelper)(getClient());
};

/** Test-only: drop the memoised client so tests don't share node state. */
export const _resetChainKitClientForTests = (): void => {
    client = null;
    sessionTokenProvider = null;
};
