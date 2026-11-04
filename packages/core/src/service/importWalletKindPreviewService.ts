import BigNumber from 'bignumber.js';
import { AccountsApi, JettonVerificationType, RatesApi } from '../tonApiV2';
import { APIConfig } from '../entries/apis';
import { FiatCurrencies } from '../entries/fiat';
import { MnemonicType } from '../entries/password';
import { Network } from '../entries/network';
import { WalletVersions } from '../entries/wallet';
import { TON_USDT_ASSET, TRON_USDT_ASSET } from '../entries/crypto/asset/constants';
import { tonAssetAddressToString } from '../entries/crypto/asset/ton-asset';
import { TronApi } from '../tronApi';
import { shiftedDecimals } from '../utils/balance';
import { mnemonicToKeypair } from './mnemonicService';
import { getWalletAddress, tronWalletByTonMnemonic } from './walletService';
import { deriveMultichainWalletAuth, registerMultichainWallet } from './chainkit/walletAuthService';
import { getMultichainAuthSession } from './chainkit/multichainApiAuth';
import { deriveRegisterAccounts } from './multichainCreateService';
import { getMultichainWalletAssets, parseBackendTotalFiat } from './multichainWalletService';

/**
 * What one reading of an ambiguous seed phrase holds, shown under the
 * matching option of the wallet-kind picker before anything is imported.
 */
export interface ImportWalletKindPreview {
    fiatTotal: BigNumber;
    nftsCount: number;
    hasActivity: boolean;
}

export const EMPTY_IMPORT_WALLET_KIND_PREVIEW: ImportWalletKindPreview = {
    fiatTotal: new BigNumber(0),
    nftsCount: 0,
    hasActivity: false
};

export interface ImportWalletKindPreviews {
    ton: ImportWalletKindPreview;
    multichain: ImportWalletKindPreview;
    /**
     * Derivation the "TON wallet" option imports with: the TON reading of
     * a phrase that is also a valid TON mnemonic, BIP39 otherwise.
     */
    tonMnemonicType: MnemonicType;
}

/**
 * Previews for the TON-vs-multichain choice, or `undefined` when the phrase
 * reads one way only and importing it as multichain loses nothing. Two
 * readings compete when the phrase is a valid TON mnemonic as well as
 * BIP39 (the two derive different keys), or when the legacy TRON
 * side-wallet Tonkeeper derives from a BIP39 phrase holds funds — the
 * multichain wallet derives TRON differently and would leave that balance
 * behind. Either side failing to load shows as having no activity rather
 * than blocking the import.
 */
export const loadImportWalletKindPreviews = async ({
    mnemonic,
    isValidTonMnemonic,
    isValidBip39,
    api,
    fiat,
    tronApi
}: {
    mnemonic: string[];
    isValidTonMnemonic: boolean;
    isValidBip39: boolean;
    api: APIConfig;
    fiat: FiatCurrencies;
    tronApi?: TronApi;
}): Promise<ImportWalletKindPreviews | undefined> => {
    if (!isValidBip39) {
        return undefined;
    }

    const legacyTronUsdt = tronApi ? await loadLegacyTronUsdt(mnemonic, tronApi) : undefined;

    let tonMnemonicType: MnemonicType;
    if (isValidTonMnemonic) {
        tonMnemonicType = 'ton';
    } else if (legacyTronUsdt !== undefined) {
        tonMnemonicType = 'bip39';
    } else {
        return undefined;
    }

    const [ton, multichain] = await Promise.all([
        loadTonWalletKindPreview({
            mnemonic,
            mnemonicType: tonMnemonicType,
            api,
            fiat,
            legacyTronUsdt
        }).catch(() => EMPTY_IMPORT_WALLET_KIND_PREVIEW),
        loadMultichainWalletKindPreview({ mnemonic, api, fiat }).catch(
            () => EMPTY_IMPORT_WALLET_KIND_PREVIEW
        )
    ]);

    return { ton, multichain, tonMnemonicType };
};

const TON_RATE_TOKEN = 'TON';
const NFT_PAGE_LIMIT = 1000;

/**
 * Holdings of the TON wallets derived from `mnemonic` read as
 * `mnemonicType`, across every wallet version: coin and priced jettons in
 * fiat, NFT count, and — for the legacy TON-only account shape — the USDT
 * on the TRON side-wallet Tonkeeper derives from the same phrase, passed
 * in as `legacyTronUsdt` (see `loadLegacyTronUsdt`).
 */
export const loadTonWalletKindPreview = async ({
    mnemonic,
    mnemonicType,
    api,
    fiat,
    legacyTronUsdt
}: {
    mnemonic: string[];
    mnemonicType: MnemonicType;
    api: APIConfig;
    fiat: FiatCurrencies;
    legacyTronUsdt?: BigNumber;
}): Promise<ImportWalletKindPreview> => {
    const keyPair = await mnemonicToKeypair(mnemonic, mnemonicType);
    const publicKey = keyPair.publicKey.toString('hex');
    const addresses = WalletVersions.map(v =>
        getWalletAddress(publicKey, v, Network.MAINNET).address.toRawString()
    );

    const accountsApi = new AccountsApi(api.tonApiV2);
    const usdtToken = tonAssetAddressToString(TON_USDT_ASSET.address);

    const [accounts, jettons, nftsCounts, rates] = await Promise.all([
        accountsApi.getAccounts({ getAccountsRequest: { accountIds: addresses } }),
        Promise.all(
            addresses.map(accountId =>
                accountsApi.getAccountJettonsBalances({ accountId, currencies: [fiat] })
            )
        ),
        Promise.all(
            addresses.map(accountId =>
                accountsApi
                    .getAccountNftItems({ accountId, limit: NFT_PAGE_LIMIT })
                    .then(r => r.nftItems.length)
                    .catch(() => 0)
            )
        ),
        new RatesApi(api.tonApiV2).getRates({
            tokens: [TON_RATE_TOKEN, usdtToken],
            currencies: [fiat]
        })
    ]);

    const tonRate = rates.rates[TON_RATE_TOKEN]?.prices?.[fiat];
    const usdtRate = rates.rates[usdtToken]?.prices?.[fiat];

    let fiatTotal = new BigNumber(0);
    if (tonRate !== undefined) {
        for (const account of accounts.accounts) {
            fiatTotal = fiatTotal.plus(shiftedDecimals(account.balance, 9).multipliedBy(tonRate));
        }
    }
    for (const { balances } of jettons) {
        for (const jetton of balances) {
            const price = jetton.price?.prices?.[fiat];
            if (
                price === undefined ||
                new BigNumber(jetton.balance).isZero() ||
                jetton.jetton.verification === JettonVerificationType.Blacklist
            ) {
                continue;
            }
            fiatTotal = fiatTotal.plus(
                shiftedDecimals(jetton.balance, jetton.jetton.decimals).multipliedBy(price)
            );
        }
    }
    if (legacyTronUsdt !== undefined && usdtRate !== undefined) {
        fiatTotal = fiatTotal.plus(
            shiftedDecimals(legacyTronUsdt, TRON_USDT_ASSET.decimals).multipliedBy(usdtRate)
        );
    }

    const nftsCount = nftsCounts.reduce((sum, count) => sum + count, 0);
    return {
        fiatTotal,
        nftsCount,
        hasActivity: legacyTronUsdt !== undefined || fiatTotal.gt(0) || nftsCount > 0
    };
};

/**
 * USDT held by the legacy TRON side-wallet, or `undefined` when that
 * wallet has neither USDT nor TRX — an unfunded side-wallet is not
 * activity. Network failures count as unfunded.
 */
export const loadLegacyTronUsdt = async (
    mnemonic: string[],
    tronApi: TronApi
): Promise<BigNumber | undefined> => {
    try {
        const wallet = await tronWalletByTonMnemonic(mnemonic, 'ton');
        const balances = await tronApi.getBalances(wallet.address);
        const usdt = new BigNumber(balances.usdt);
        if (usdt.isZero() && new BigNumber(balances.trx).isZero()) {
            return undefined;
        }
        return usdt;
    } catch {
        return undefined;
    }
};

/**
 * Whole-portfolio fiat total of the multichain wallet `mnemonic` would
 * become. The backend only answers for wallets bound to the device, so
 * the wallet is registered first with a key derived on the spot; the
 * later import registers the same wallet again, which is idempotent.
 * When the backend cannot price the portfolio, the TON-side holdings of
 * the BIP39 reading stand in for it. NFTs are counted on the TON side.
 */
export const loadMultichainWalletKindPreview = async ({
    mnemonic,
    api,
    fiat
}: {
    mnemonic: string[];
    api: APIConfig;
    fiat: FiatCurrencies;
}): Promise<ImportWalletKindPreview> => {
    const [tonSide, portfolioFiat] = await Promise.all([
        loadTonWalletKindPreview({ mnemonic, mnemonicType: 'bip39', api, fiat }),
        loadMultichainPortfolioFiat(mnemonic, fiat)
    ]);

    const fiatTotal = portfolioFiat?.gt(0) ? portfolioFiat : tonSide.fiatTotal;
    return {
        fiatTotal,
        nftsCount: tonSide.nftsCount,
        hasActivity: fiatTotal.gt(0) || tonSide.nftsCount > 0
    };
};

const loadMultichainPortfolioFiat = async (
    mnemonic: string[],
    fiat: FiatCurrencies
): Promise<BigNumber | undefined> => {
    try {
        const session = getMultichainAuthSession();
        if (!session) {
            return undefined;
        }
        const [credentials, accounts] = await Promise.all([
            deriveMultichainWalletAuth(mnemonic),
            deriveRegisterAccounts(mnemonic)
        ]);
        await registerMultichainWallet(session, credentials, accounts);
        const page = await getMultichainWalletAssets({
            walletId: credentials.walletId,
            walletAuthKey: credentials.walletAuthKey,
            currency: fiat
        });
        return parseBackendTotalFiat(page.fiatPrice, fiat);
    } catch (e) {
        console.warn('multichain import preview: portfolio total unavailable', e);
        return undefined;
    }
};
