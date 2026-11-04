import { APIConfig } from '../../entries/apis';
import {
    AccountStatus,
    JettonBalance,
    JettonBalanceFromJSON,
    MessageConsequences,
    MessageConsequencesFromJSON
} from '../../tonApiV2';

/**
 * Hand-written client for the tonapi `/v2/migration/*` endpoints. They are
 * not present in the public OpenAPI spec the generated `tonApiV2` client is
 * built from, so the wire shapes below mirror the native apps' generated
 * models (iOS `WalletMigrationPrepareResult`, Android `MigrationApi`).
 */

export type MigrationGasPayer = 'self' | 'battery';

export interface MigrationOutMessage {
    /** base64 BOC of one raw internal message the wallet resends. */
    boc: string;
    mode: number;
}

export interface MigrationTransaction {
    /** Wallet seqno baked into the unsigned body. */
    seqno: number;
    /**
     * base64 BOC of the unsigned wallet body, signed into an external
     * message either way: v3/v4 — the signature is prepended; w5 — it is
     * appended as the trailing 512 bits.
     */
    boc: string;
    messages: MigrationOutMessage[];
    emulation: MessageConsequences;
    /** TON burned as network fees by this transaction, in nanotons. */
    gasSpent: string;
    /**
     * true — Battery pays the gas (`gas_payer=battery` only); submit via the
     * Battery relay. A battery batch also carries self-paid transactions,
     * e.g. the final TON sweep.
     */
    sponsored: boolean;
    /** base64 StateInit, present on the first transaction of an uninitialized wallet. */
    stateInit?: string;
}

export interface MigrationPrepareResult {
    from: string;
    to: string;
    /** Source wallet version as the backend inferred it (informational). */
    walletVersion: string;
    /** Ordered — sign and broadcast in array order. */
    transactions: MigrationTransaction[];
}

export interface MigrationPrepared {
    result: MigrationPrepareResult;
    /**
     * true when the backend answered 409 INSUFFICIENT_TON_FOR_GAS but still
     * returned the transaction set — the flow shows the shortage dialog
     * instead of failing.
     */
    insufficientFunds: boolean;
    /** Nanoton amounts from the 409 error envelope. */
    insufficientDetails?: { required: string; available: string };
}

export interface MigrationWalletValue {
    /** Raw address the value belongs to. */
    account: string;
    /** TON balance in nanotons. */
    balance: string;
    status: AccountStatus;
    jettons: JettonBalance[];
    nftCount: number;
}

const INSUFFICIENT_TON_GAS_CODE = 50000;

interface MigrationRequestOptions {
    api: APIConfig;
    fetchImpl?: typeof fetch;
}

async function postMigration(
    { api, fetchImpl }: MigrationRequestOptions,
    path: string,
    body: unknown
): Promise<Response> {
    const config = api.tonApiV2;
    const fetchApi = fetchImpl ?? config.fetchApi ?? fetch;
    return fetchApi(`${config.basePath}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...config.headers
        },
        body: JSON.stringify(body)
    });
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function toMigrationTransaction(json: any): MigrationTransaction {
    return {
        seqno: Number(json.seqno),
        boc: String(json.boc),
        messages: (json.messages ?? []).map((m: any) => ({
            boc: String(m.boc),
            mode: Number(m.mode)
        })),
        emulation: MessageConsequencesFromJSON(json.emulation),
        gasSpent: String(json.gas_spent ?? '0'),
        sponsored: Boolean(json.sponsored),
        stateInit: json.state_init ? String(json.state_init) : undefined
    };
}

function toMigrationPrepareResult(json: any): MigrationPrepareResult {
    return {
        from: String(json.from),
        to: String(json.to),
        walletVersion: String(json.wallet_version ?? ''),
        transactions: (json.transactions ?? []).map(toMigrationTransaction)
    };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface GetMigrationWalletsArgs extends MigrationRequestOptions {
    /** Raw TON addresses of every candidate version wallet. */
    addresses: string[];
    /** Fiat codes the backend should price jettons in, e.g. `['USD']`. */
    currencies?: string[];
}

/**
 * `POST /v2/migration/wallets` — which of the candidate wallets hold
 * anything the migration can move, with balances priced for the picker.
 */
export async function getMigrationWallets(
    args: GetMigrationWalletsArgs
): Promise<MigrationWalletValue[]> {
    const query = args.currencies?.length
        ? `?currencies=${encodeURIComponent(args.currencies.join(','))}`
        : '';
    const response = await postMigration(args, `/v2/migration/wallets${query}`, {
        account_ids: args.addresses
    });
    if (!response.ok) {
        throw new Error(`Migration wallets request failed with status ${response.status}`);
    }
    const json = await response.json();
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    return (json.wallets ?? []).map((w: any) => ({
        account: String(w.account),
        balance: String(w.balance ?? '0'),
        status: w.status as AccountStatus,
        jettons: (w.jettons ?? []).map(JettonBalanceFromJSON),
        nftCount: Number(w.nft_count ?? 0)
    }));
}

export interface PrepareMigrationArgs extends MigrationRequestOptions {
    /** Raw address of the legacy source wallet to drain. */
    from: string;
    /** Destination TON address of the multichain wallet. */
    to: string;
    /** Fiat code for the preview values. */
    currency: string;
    /** Hex ed25519 public key; required when the source wallet is uninitialized. */
    publicKey?: string;
    gasPayer: MigrationGasPayer;
}

/**
 * `POST /v2/migration/prepare` — the backend selects the migratable assets
 * and builds ready-to-sign transactions for them.
 *
 * A 409 with `error_code = 50000` still carries the normal prepare payload;
 * it is recovered into `insufficientFunds: true` so the confirm screen can
 * show the usual shortage dialog instead of a dead error state.
 */
export async function prepareMigration(args: PrepareMigrationArgs): Promise<MigrationPrepared> {
    const response = await postMigration(args, '/v2/migration/prepare', {
        from: args.from,
        to: args.to,
        currency: args.currency,
        public_key: args.publicKey,
        gas_payer: args.gasPayer
    });

    if (response.ok) {
        return {
            result: toMigrationPrepareResult(await response.json()),
            insufficientFunds: false
        };
    }

    const bodyText = await response.text().catch(() => '');
    if (response.status === 409) {
        const recovered = recoverPrepareConflict(bodyText);
        if (recovered) {
            return recovered;
        }
    }
    throw new Error(
        `Migration prepare (${args.gasPayer}) failed with status ${
            response.status
        }: ${bodyText.slice(0, 200)}`
    );
}

function recoverPrepareConflict(bodyText: string): MigrationPrepared | undefined {
    let json;
    try {
        json = JSON.parse(bodyText);
    } catch {
        return undefined;
    }
    if (!Array.isArray(json?.transactions)) {
        return undefined;
    }

    let result: MigrationPrepareResult;
    try {
        result = toMigrationPrepareResult(json);
    } catch {
        return undefined;
    }

    const required = Number(json.details?.required ?? 0);
    const details =
        Number(json.error_code) === INSUFFICIENT_TON_GAS_CODE && required > 0
            ? {
                  required: String(json.details.required),
                  available: String(json.details.available ?? '0')
              }
            : undefined;

    return {
        result,
        insufficientFunds: true,
        insufficientDetails: details
    };
}
