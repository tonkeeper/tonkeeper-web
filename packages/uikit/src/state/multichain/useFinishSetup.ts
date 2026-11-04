import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { AccountId } from '@tonkeeper/core/dist/entries/account';

import { useAppSdk } from '../../hooks/appSdk';
import { QueryKey } from '../../libs/queryKey';
import { useActiveAccount } from '../wallet';
import { useMigratableWallets } from './useMigration';

export interface FinishSetupMigrationItem {
    type: 'migration';
    /** Legacy TON wallets the migration picker would list. */
    walletsLeft: number;
}

export type FinishSetupItem = FinishSetupMigrationItem;

interface FinishSetupState {
    /** Multichain account ids whose owner pressed "Skip" on the section. */
    skippedByAccountId?: Record<AccountId, boolean>;
}

const useIsFinishSetupSkipped = () => {
    const sdk = useAppSdk();
    const account = useActiveAccount();

    return useQuery<boolean, Error>([QueryKey.multichainFinishSetup, account.id], async () => {
        const state = await sdk.storage.get<FinishSetupState>(AppKey.MULTICHAIN_FINISH_SETUP_STATE);
        return state?.skippedByAccountId?.[account.id] === true;
    });
};

/**
 * Steps the "Finish setting up" section offers the active multichain
 * account. Only the migration step exists on web — creation forces the
 * phrase check before the account is saved, and the natives' push and
 * biometry permission steps have no counterpart here. The count comes
 * from the same query the migration picker lists, so a drained legacy
 * wallet drops out of both at once; the natives count every legacy wallet
 * and keep offering a migration that has nothing left to move.
 *
 * `undefined` while the skip flag or the migratable wallets are still
 * loading, so callers hold the section back instead of flashing it in.
 */
export const useFinishSetupItems = (): FinishSetupItem[] | undefined => {
    const account = useActiveAccount();
    const { data: skipped } = useIsFinishSetupSkipped();
    const { data: migratable, isError } = useMigratableWallets();

    return useMemo(() => {
        if (skipped === undefined) {
            return undefined;
        }
        if (skipped || account.type !== 'multichain' || isError) {
            return [];
        }
        if (migratable === undefined) {
            return undefined;
        }
        const walletsLeft = migratable.length;
        return walletsLeft > 0 ? [{ type: 'migration', walletsLeft }] : [];
    }, [skipped, account.type, migratable, isError]);
};

export const useSkipFinishSetup = () => {
    const sdk = useAppSdk();
    const account = useActiveAccount();
    const client = useQueryClient();

    return useMutation(async () => {
        const state = await sdk.storage.get<FinishSetupState>(AppKey.MULTICHAIN_FINISH_SETUP_STATE);
        await sdk.storage.set<FinishSetupState>(AppKey.MULTICHAIN_FINISH_SETUP_STATE, {
            ...state,
            skippedByAccountId: { ...state?.skippedByAccountId, [account.id]: true }
        });
        await client.invalidateQueries([QueryKey.multichainFinishSetup]);
    });
};
