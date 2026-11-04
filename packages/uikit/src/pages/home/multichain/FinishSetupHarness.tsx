import { FC, ReactNode, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MockAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { AccountTonMnemonic } from '@tonkeeper/core/dist/entries/account';
import { MemoryStorage } from '@tonkeeper/core/dist/Storage';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { TonWalletStandard, WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import BigNumber from 'bignumber.js';

import { buildActiveMultichainAccount } from '../../../../playwright/multichainAccountFixture';
import { AppSdkContext } from '../../../hooks/appSdk';
import { QueryKey } from '../../../libs/queryKey';
import {
    getMigrationSourceWallets,
    MigrationPickerWallet
} from '../../../state/multichain/useMigration';

const legacyWallet: TonWalletStandard = {
    id: 'legacy:ton',
    rawAddress: `0:${'b'.repeat(64)}`,
    publicKey: 'ed25519-legacy-pubkey-hex',
    version: WalletVersion.V4R2
};

export const buildLegacyMnemonicAccount = (params: { id: string; name: string }) =>
    AccountTonMnemonic.create({
        id: params.id,
        name: params.name,
        emoji: '🐱',
        auth: { kind: 'password', encryptedSecret: 'enc' },
        activeTonWalletId: `${params.id}:ton`,
        tonWallets: [{ ...legacyWallet, id: `${params.id}:ton` }],
        mnemonicType: 'ton'
    });

/**
 * CT mount wrapper: the default fixture seeds one multichain account, so
 * there is never a legacy wallet to migrate and the checklist stays empty.
 * This swaps in an sdk holding the multichain account (active) plus
 * `legacyCount` legacy TON mnemonic accounts, of which the first
 * `fundedCount` still hold assets (the rest are drained), and lets a test
 * pre-seed the skip flag. The migratable-wallets query is seeded directly,
 * so the section never hits the network.
 *
 * Lives outside the `*.ct.tsx` files because Playwright's static
 * mount-loader can't resolve components defined in the test file itself.
 */
export const FinishSetupHarness: FC<{
    children: ReactNode;
    legacyCount?: number;
    fundedCount?: number;
    skipped?: boolean;
}> = ({ children, legacyCount = 2, fundedCount = legacyCount, skipped = false }) => {
    const queryClient = useQueryClient();
    const [sdk] = useState(() => {
        const nextSdk = new MockAppSdk();
        const multichain = buildActiveMultichainAccount();
        const legacy = Array.from({ length: legacyCount }, (_, i) =>
            buildLegacyMnemonicAccount({ id: `acc:legacy-${i}`, name: `TON Wallet ${i + 1}` })
        );
        const accounts = [multichain, ...legacy];

        // MemoryStorage is sync under its async API — seed the map so the
        // first render already sees the accounts.
        const memory = nextSdk.storage as MemoryStorage;
        memory.storage[AppKey.ACCOUNTS] = accounts;
        memory.storage[AppKey.ACTIVE_ACCOUNT_ID] = multichain.id;
        if (skipped) {
            memory.storage[AppKey.MULTICHAIN_FINISH_SETUP_STATE] = {
                skippedByAccountId: { [multichain.id]: true }
            };
        }

        queryClient.setQueryData([QueryKey.account, QueryKey.wallet], multichain);
        queryClient.setQueryData([QueryKey.account, QueryKey.wallets], accounts);

        const sources = getMigrationSourceWallets(accounts);
        const funded: MigrationPickerWallet[] = sources.slice(0, fundedCount).map(source => ({
            ...source,
            value: {
                id: source.walletId,
                tonBalance: new BigNumber(1_000_000_000),
                hasTonAssets: true,
                jettons: [],
                nftCount: 0,
                initialized: true,
                tronUsdt: new BigNumber(0),
                tronTrx: new BigNumber(0),
                hasTronAssets: false
            },
            prices: {}
        }));
        queryClient.setQueryData(
            [
                QueryKey.multichainMigrationWallets,
                FiatCurrencies.USD,
                ...sources.map(s => s.walletId)
            ],
            funded
        );
        return nextSdk;
    });

    return <AppSdkContext.Provider value={sdk}>{children}</AppSdkContext.Provider>;
};
