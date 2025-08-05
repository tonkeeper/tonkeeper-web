import { Address } from '@ton/core';
import BigNumber from 'bignumber.js';
import { AppKey } from '../Keys';
import { IStorage } from '../Storage';
import { APIConfig } from '../entries/apis';
import { BLOCKCHAIN_NAME } from '../entries/crypto';
import { AssetAmount } from '../entries/crypto/asset/asset-amount';
import { TON_ASSET } from '../entries/crypto/asset/constants';
import { DashboardCell, DashboardColumn, DashboardRow } from '../entries/dashboard';
import { FiatCurrencies } from '../entries/fiat';
import { Language, localizationText } from '../entries/language';
import {
    AuthTypes,
    CryptoPendingSubscription,
    isPendingSubscription,
    isProSubscription,
    isValidSubscription,
    ProStateWallet,
    ProSubscription,
    TelegramSubscription,
    TelegramSubscriptionStatuses
} from '../entries/pro';
import { RecipientData, TonRecipientData } from '../entries/send';
import {
    backwardCompatibilityOnlyWalletVersions,
    TonWalletStandard,
    WalletVersion
} from '../entries/wallet';
import { AccountsApi } from '../tonApiV2';
import { Flatten } from '../utils/types';
import { loginViaTG } from './telegramOauth';
import { createTonProofItem, tonConnectProofPayload } from './tonConnect/connectService';
import { getServerTime } from './ton-blockchain/utils';
import { walletStateInitFromState } from './wallet/contractService';
import {
    AuthService,
    Currencies as CurrenciesGenerated,
    DashboardCellAddress,
    DashboardCellNumericCrypto,
    DashboardCellNumericFiat,
    DashboardCellString,
    DashboardColumnType,
    DashboardsService,
    IapService,
    Invoice,
    InvoicesService,
    SubscriptionSource,
    SupportService,
    TiersService,
    UsersService
} from '../pro';
import { findAuthorizedWallet, normalizeSubscription } from '../utils/pro';
import { IAppSdk } from '../AppSdk';
import { IAuthViaSeedPhraseData } from '../entries/password';

interface IGetProStateParams {
    authService: ProAuthTokenService;
    sdk: IAppSdk;
    promoExpirationDate: Date | null;
}

export const setBackupState = async (storage: IStorage, state: ProSubscription) => {
    await storage.set(AppKey.PRO_BACKUP, state);
};

export const getBackupState = async (storage: IStorage) => {
    const backup = await storage.get<ProSubscription>(AppKey.PRO_BACKUP);
    return backup ?? null;
};

export const getProState = async (params: IGetProStateParams): Promise<ProSubscription> => {
    try {
        return await loadProState(params);
    } catch (e) {
        console.error(e);
        return null;
    }
};

export const walletVersionFromProServiceDTO = (value: string) => {
    switch (value.toUpperCase()) {
        case 'V3R1':
            return WalletVersion.V3R1;
        case 'V3R2':
            return WalletVersion.V3R2;
        case 'V4R2':
            return WalletVersion.V4R2;
        case 'V5_BETA':
            return WalletVersion.V5_BETA;
        case 'V5R1':
            return WalletVersion.V5R1;
        default:
            throw new Error('Unsupported version');
    }
};

export enum ProAuthTokenType {
    MAIN = 'main',
    TEMP = 'temp'
}

export interface ProAuthTokenService {
    attachToken(type?: ProAuthTokenType): Promise<void>;
    setToken(type: ProAuthTokenType, token: string | null): Promise<void>;
    getToken(type: ProAuthTokenType): Promise<string | null>;
    promoteToken(from: ProAuthTokenType, to: ProAuthTokenType): Promise<void>;
    withTokenContext<T>(type: ProAuthTokenType, fn: () => Promise<T>): Promise<T>;
}

const getNormalizedSubscription = async (
    authService: ProAuthTokenService,
    storage: IStorage,
    appliedToken: ProAuthTokenType
) => {
    const request = async () => {
        const user = await UsersService.getUserInfo();
        const authorizedWallet: ProStateWallet | null = await findAuthorizedWallet(user, storage);
        const currentSubscriptionDTO = await UsersService.verifySubscription();

        return normalizeSubscription(currentSubscriptionDTO, authorizedWallet);
    };

    try {
        return await authService.withTokenContext(appliedToken, request);
    } catch {
        return null;
    }
};

/**
 * @deprecated
 */
const getPseudoTelegramSubscription = (
    promoExpirationDate: Date | null
): TelegramSubscription | null => {
    if (!promoExpirationDate) return null;

    return {
        source: SubscriptionSource.TELEGRAM,
        valid: true,
        status: TelegramSubscriptionStatuses.ACTIVE,
        auth: {
            type: AuthTypes.TELEGRAM
        },
        expiresDate: promoExpirationDate,
        nextChargeDate: promoExpirationDate
    };
};

const clearProAuthBreadCrumbs = async (storage: IStorage) => {
    await storage.delete(AppKey.PRO_FREE_ACCESS_ACTIVE);
    await storage.delete(AppKey.PRO_PENDING_SUBSCRIPTION);
};

const loadProState = async (params: IGetProStateParams): Promise<ProSubscription> => {
    const { authService, sdk, promoExpirationDate } = params;

    await authService.attachToken(ProAuthTokenType.MAIN);

    const storage = sdk.storage;

    const pendingSubscription: CryptoPendingSubscription | null = await storage.get(
        AppKey.PRO_PENDING_SUBSCRIPTION
    );

    const currentSubscription =
        (await getNormalizedSubscription(authService, storage, ProAuthTokenType.MAIN)) ??
        getPseudoTelegramSubscription(promoExpirationDate);

    const targetSubscription = await getNormalizedSubscription(
        authService,
        storage,
        ProAuthTokenType.TEMP
    );

    if (isProSubscription(targetSubscription) && isValidSubscription(targetSubscription)) {
        await authService.promoteToken(ProAuthTokenType.TEMP, ProAuthTokenType.MAIN);

        await clearProAuthBreadCrumbs(storage);

        return targetSubscription;
    }

    if (isPendingSubscription(pendingSubscription)) {
        return {
            ...pendingSubscription,
            valid: Boolean(currentSubscription?.valid)
        };
    }

    if (isValidSubscription(currentSubscription)) {
        await clearProAuthBreadCrumbs(storage);

        return currentSubscription;
    }

    if (isProSubscription(currentSubscription)) {
        return currentSubscription;
    }

    if (isProSubscription(targetSubscription)) {
        return targetSubscription;
    }

    await authService.setToken(ProAuthTokenType.MAIN, null);

    return null;
};

export const authViaTonConnect = async (
    authService: ProAuthTokenService,
    api: APIConfig,
    wallet: TonWalletStandard,
    signProof: (bufferToSing: Buffer) => Promise<Uint8Array>
) => {
    const domain = 'tonkeeper';
    const { payload } = await AuthService.authGeneratePayload();

    const timestamp = await getServerTime(api);
    const proofPayload = tonConnectProofPayload(timestamp, domain, wallet.rawAddress, payload);
    const stateInit = walletStateInitFromState(wallet);
    const proof = createTonProofItem(
        await signProof(proofPayload.bufferToSign),
        proofPayload,
        stateInit
    );

    const result = await AuthService.tonConnectAuth({
        address: wallet.rawAddress,
        proof: {
            timestamp: proof.timestamp,
            domain: proof.domain.value,
            signature: proof.signature,
            payload,
            state_init: proof.stateInit
        }
    });

    if (!result.ok || !result.auth_token) {
        throw new Error('Unable to authorize');
    }

    await authService.setToken(ProAuthTokenType.TEMP, result.auth_token);
};

export const authViaSeedPhrase = async (
    api: APIConfig,
    authService: ProAuthTokenService,
    authData: IAuthViaSeedPhraseData
) => {
    const domain = 'tonkeeper';
    const { wallet, signer } = authData;
    const { payload } = await AuthService.authGeneratePayload();

    const timestamp = await getServerTime(api);

    const proofPayload = tonConnectProofPayload(timestamp, domain, wallet.rawAddress, payload);

    const signature = await signer(proofPayload.bufferToSign);

    const stateInit = walletStateInitFromState(wallet);

    const proof = createTonProofItem(signature, proofPayload, stateInit);

    const result = await AuthService.tonConnectAuth({
        address: wallet.rawAddress,
        proof: {
            timestamp: proof.timestamp,
            domain: proof.domain.value,
            signature: proof.signature,
            payload,
            state_init: proof.stateInit
        }
    });

    if (!result.ok || !result.auth_token) {
        throw new Error('Unable to authorize');
    }

    await authService.setToken(ProAuthTokenType.TEMP, result.auth_token);
};

export const logoutTonConsole = async (authService: ProAuthTokenService) => {
    const errors: unknown[] = [];

    const logoutWithToken = async (type: ProAuthTokenType) => {
        try {
            await authService.withTokenContext(type, () => AuthService.logout());
        } catch (e) {
            errors.push(e);
        } finally {
            await authService.setToken(type, null);
        }
    };

    await Promise.all([
        logoutWithToken(ProAuthTokenType.TEMP),
        logoutWithToken(ProAuthTokenType.MAIN)
    ]);

    if (errors.length === 2) {
        throw new Error('Logout failed!');
    }
};

export const getProServiceTiers = async (lang?: Language | undefined, promoCode?: string) => {
    const { items } = await TiersService.getTiers(localizationText(lang) as Lang, promoCode);

    return items;
};

export const createProServiceInvoice = async (tierId: number, promoCode?: string) => {
    return InvoicesService.createInvoice({
        tier_id: tierId,
        promo_code: promoCode
    });
};

export const createRecipient = async (
    api: APIConfig,
    invoice: Invoice
): Promise<[RecipientData, AssetAmount]> => {
    const toAccount = await new AccountsApi(api.tonApiV2).getAccount({
        accountId: invoice.pay_to_address
    });

    const recipient: TonRecipientData = {
        address: {
            address: Address.parse(invoice.pay_to_address).toString({ bounceable: false }),
            blockchain: BLOCKCHAIN_NAME.TON
        },
        comment: invoice.id,
        done: true,
        toAccount: toAccount
    };

    const asset = new AssetAmount({
        asset: TON_ASSET,
        weiAmount: new BigNumber(invoice.amount)
    });

    return [recipient, asset];
};

export const saveIapPurchase = async (originalTransactionId: string): Promise<{ ok: boolean }> => {
    try {
        return await IapService.activateIapPurchase({
            original_transaction_id: originalTransactionId
        });
    } catch (e) {
        return {
            ok: false
        };
    }
};

export async function startProServiceTrial(
    authService: ProAuthTokenService,
    botId: string,
    lang?: string
) {
    const tgData = await loginViaTG(botId, lang);

    if (!tgData) {
        return false;
    }

    const result = await TiersService.activateTrial(tgData);

    if (result.auth_token) {
        await authService.setToken(ProAuthTokenType.TEMP, result.auth_token);
    }

    return result.ok;
}

export async function getDashboardColumns(lang?: string): Promise<DashboardColumn[]> {
    if (!Object.values(Lang).includes(lang as Lang)) {
        lang = Lang.EN;
    }

    const result = await DashboardsService.getDashboardColumns(lang as Lang);
    return result.items.map(item => ({
        id: item.id,
        name: item.name,
        type: item.column_type,
        defaultIsChecked: item.checked_default,
        onlyPro: item.only_pro
    }));
}

enum Lang {
    EN = 'en',
    RU = 'ru'
}

export async function getDashboardData(
    query: {
        accounts: string[];
        columns: string[];
    },
    options?: { lang?: string; currency?: FiatCurrencies }
): Promise<DashboardRow[]> {
    let lang = Lang.EN;
    if (Object.values(Lang).includes(options?.lang as Lang)) {
        lang = options?.lang as Lang;
    }

    let currency = CurrenciesGenerated.USD;
    if (
        Object.values(CurrenciesGenerated).includes(
            options?.currency as unknown as CurrenciesGenerated
        )
    ) {
        currency = options?.currency as unknown as CurrenciesGenerated;
    }

    const result = await DashboardsService.getDashboardData(lang, currency, query);

    return result.items.map((row, index) => ({
        id: query.accounts[index],
        cells: row.map(mapDtoCellToCell)
    }));
}

type DTOCell = Flatten<
    Flatten<Awaited<ReturnType<typeof DashboardsService.getDashboardData>>['items']>
>;

function mapDtoCellToCell(dtoCell: DTOCell): DashboardCell {
    switch (dtoCell.type) {
        case DashboardColumnType.STRING: {
            const cell = dtoCell as DashboardCellString;

            return {
                columnId: cell.column_id,
                type: 'string',
                value: cell.value
            };
        }
        case DashboardColumnType.ADDRESS: {
            const cell = dtoCell as DashboardCellAddress;
            return {
                columnId: cell.column_id,
                type: 'address',
                raw: cell.raw
            };
        }
        case DashboardColumnType.NUMERIC_CRYPTO: {
            const cell = dtoCell as DashboardCellNumericCrypto;
            return {
                columnId: cell.column_id,
                type: 'numeric_crypto',
                value: new BigNumber(cell.value),
                decimals: cell.decimals,
                symbol: cell.symbol
            };
        }

        case DashboardColumnType.NUMERIC_FIAT: {
            const cell = dtoCell as DashboardCellNumericFiat;
            return {
                columnId: cell.column_id,
                type: 'numeric_fiat',
                value: new BigNumber(cell.value),
                fiat: cell.fiat as unknown as FiatCurrencies
            };
        }
        default:
            throw new Error('Unsupported cell type');
    }
}

export const getProSupportUrl = async () => {
    try {
        const supportToken = await SupportService.getProSupport();

        return supportToken?.url ?? null;
    } catch (e) {
        return null;
    }
};

export const backwardCompatibilityFilter = (wallets: ReadonlyArray<TonWalletStandard>) =>
    wallets.filter(
        (w: TonWalletStandard) => !backwardCompatibilityOnlyWalletVersions.includes(w?.version)
    );
