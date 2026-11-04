import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { Account, AccountId } from '@tonkeeper/core/dist/entries/account';
import { TON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { tonAssetAddressToString } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { WalletId, WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import {
    loadMigratableWalletValues,
    MigratableWalletValue
} from '@tonkeeper/core/dist/service/migration/migrationService';
import { RatesApi } from '@tonkeeper/core/dist/tonApiV2';

import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { QueryKey } from '../../libs/queryKey';
import { useTronApi } from '../tron/tron';
import { useAccountsState, useActiveAccount, useActiveApi } from '../wallet';

/**
 * One row the migration picker can offer: a version wallet of a legacy
 * mnemonic account, or one version wallet of a MAM derivation. Only these
 * two account types qualify — they are the only ones whose keys the app
 * holds and whose network is mainnet; watch-only, hardware, signer,
 * multisig and testnet accounts cannot be drained.
 */
export interface MigrationSourceWallet {
    walletId: WalletId;
    accountId: AccountId;
    /** Account name, or the derivation name for a MAM row. */
    name: string;
    emoji: string;
    version: WalletVersion;
    /** Raw TON address of this version wallet. */
    tonAddress: string;
    /**
     * Legacy TRON address. TRON assets belong to the account (or MAM
     * derivation), not to a TON contract version, so the address is
     * attached to the active version's row only — otherwise the same
     * TRON balance would migrate once per version row.
     */
    tronAddress?: string;
}

export const getMigrationSourceWallets = (accounts: Account[]): MigrationSourceWallet[] =>
    accounts.flatMap(account => {
        if (account.type === 'mnemonic') {
            return account.allTonWallets.map(wallet => ({
                walletId: wallet.id,
                accountId: account.id,
                name: account.name,
                emoji: account.emoji,
                version: wallet.version,
                tonAddress: wallet.rawAddress,
                tronAddress:
                    wallet.id === account.activeTonWallet.id
                        ? account.activeTronWallet?.address
                        : undefined
            }));
        }
        if (account.type === 'mam') {
            return account.derivations.flatMap(derivation =>
                derivation.tonWallets.map(wallet => ({
                    walletId: wallet.id,
                    accountId: account.id,
                    name: derivation.name,
                    emoji: derivation.emoji,
                    version: wallet.version,
                    tonAddress: wallet.rawAddress,
                    tronAddress:
                        wallet.id === derivation.activeTonWalletId
                            ? derivation.tronWallet?.address
                            : undefined
                }))
            );
        }
        return [];
    });

/** Gates the settings entry: is there any account migration could drain? */
export const useHasMigrationSourceWallets = (): boolean => {
    const accounts = useAccountsState();
    return useMemo(() => getMigrationSourceWallets(accounts).length > 0, [accounts]);
};

export interface MigrationPickerWallet extends MigrationSourceWallet {
    value: MigratableWalletValue;
    /** Undefined when rates were unavailable — the row hides the amount. */
    fiatTotal?: BigNumber;
    /** Fiat price of one coin, for the per-transfer equivalents on the confirm screen. */
    prices: { ton?: BigNumber; usdt?: BigNumber };
}

const TON_RATE_TOKEN = 'TON';

/**
 * The wallets the picker lists: every candidate the backend or TRON says
 * holds something migratable, priced and sorted by fiat value. The fiat
 * total sums TON, backend-priced jettons and TRON USDT (priced via the
 * TON-side USDT rate — same peg); loose TRX is migrated but not priced,
 * matching its dust-level role in legacy wallets.
 */
export const useMigratableWallets = () => {
    const accounts = useAccountsState();
    const api = useActiveApi();
    const tronApi = useTronApi();
    const { fiat } = useAppContext();

    const sources = useMemo(() => getMigrationSourceWallets(accounts), [accounts]);

    return useQuery<MigrationPickerWallet[], Error>(
        [QueryKey.multichainMigrationWallets, fiat, ...sources.map(s => s.walletId)],
        async () => {
            // Settle to an empty list rather than gating on `enabled`: the
            // migration deeplink can open the picker when no source wallet
            // exists, and a disabled query would keep it loading forever.
            if (sources.length === 0) {
                return [];
            }

            const values = await loadMigratableWalletValues({
                api,
                tronApi,
                currency: fiat,
                candidates: sources.map(s => ({
                    id: s.walletId,
                    tonAddress: s.tonAddress,
                    tronAddress: s.tronAddress
                }))
            });

            const usdtToken = tonAssetAddressToString(TON_USDT_ASSET.address);
            const rates = await new RatesApi(api.tonApiV2)
                .getRates({ tokens: [TON_RATE_TOKEN, usdtToken], currencies: [fiat] })
                .catch(() => undefined);
            const tonPrice = rates?.rates[TON_RATE_TOKEN]?.prices?.[fiat];
            const usdtPrice = rates?.rates[usdtToken]?.prices?.[fiat];

            const priced = values.flatMap(value => {
                const source = sources.find(s => s.walletId === value.id);
                if (!source) {
                    return [];
                }

                let fiatTotal: BigNumber | undefined;
                if (tonPrice !== undefined) {
                    fiatTotal = value.tonBalance.shiftedBy(-9).multipliedBy(tonPrice);
                    for (const jetton of value.jettons) {
                        const price = jetton.price?.prices?.[fiat];
                        if (price !== undefined) {
                            fiatTotal = fiatTotal.plus(
                                new BigNumber(jetton.balance)
                                    .shiftedBy(-jetton.jetton.decimals)
                                    .multipliedBy(price)
                            );
                        }
                    }
                    if (usdtPrice !== undefined) {
                        fiatTotal = fiatTotal.plus(
                            value.tronUsdt.shiftedBy(-6).multipliedBy(usdtPrice)
                        );
                    }
                }

                return [
                    {
                        ...source,
                        value,
                        fiatTotal,
                        prices: {
                            ton: tonPrice === undefined ? undefined : new BigNumber(tonPrice),
                            usdt: usdtPrice === undefined ? undefined : new BigNumber(usdtPrice)
                        }
                    }
                ];
            });

            return priced.sort(
                (a, b) =>
                    (b.fiatTotal ?? new BigNumber(0)).comparedTo(a.fiatTotal ?? 0) ||
                    b.value.nftCount - a.value.nftCount
            );
        },
        { keepPreviousData: true }
    );
};

interface MultichainMigrationState {
    /** Multichain account ids whose owner has opened the migration screen. */
    openedByAccountId?: Record<AccountId, boolean>;
}

/**
 * Drives the blue dot on the settings row — shown until the active
 * multichain account first opens migration, like the natives'
 * `didOpenWalletMigration`. Not a completion marker: the flow stays
 * re-runnable while source wallets hold assets.
 */
export const useIsMigrationOpened = () => {
    const sdk = useAppSdk();
    const account = useActiveAccount();

    return useQuery<boolean, Error>([QueryKey.multichainMigrationOpened, account.id], async () => {
        const state = await sdk.storage.get<MultichainMigrationState>(
            AppKey.MULTICHAIN_MIGRATION_STATE
        );
        return state?.openedByAccountId?.[account.id] === true;
    });
};

export const useMarkMigrationOpened = () => {
    const sdk = useAppSdk();
    const account = useActiveAccount();
    const client = useQueryClient();

    return useMutation(async () => {
        const state = await sdk.storage.get<MultichainMigrationState>(
            AppKey.MULTICHAIN_MIGRATION_STATE
        );
        await sdk.storage.set<MultichainMigrationState>(AppKey.MULTICHAIN_MIGRATION_STATE, {
            ...state,
            openedByAccountId: { ...state?.openedByAccountId, [account.id]: true }
        });
        await client.invalidateQueries([QueryKey.multichainMigrationOpened]);
    });
};
