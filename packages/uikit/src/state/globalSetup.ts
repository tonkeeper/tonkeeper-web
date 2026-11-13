import { useCheckMultisigsSigners } from './multisig';
import { useBatteryServiceConfigNonSuspense } from './battery';
import { useAtomValue } from '../libs/useAtom';
import { useAppSdk } from '../hooks/appSdk';
import { atom } from '@tonkeeper/core/dist/entries/atom';
import { KeychainSecurity } from '@tonkeeper/core/dist/AppSdk';
import { useSyncPubkeysOnAppOpen } from './pubkeysBulkSync';

const emptyAtom = atom<KeychainSecurity>({});

export const useGlobalSetup = () => {
    useCheckMultisigsSigners();
    // The response is unused: the request itself is what ties this install's
    // wallets to its user id, which revenue analytics needs to attribute a
    // wallet to a platform. The native apps report the same on every launch.
    useSyncPubkeysOnAppOpen();
    // Warms the cache the suspense consumers read, without letting a failed
    // fetch (offline boot, battery outage) throw into the root render.
    const { isLoading: isBatteryServiceConfigLoading } = useBatteryServiceConfigNonSuspense();

    const sdk = useAppSdk();
    const keychain = useAtomValue(sdk.keychain?.security ?? emptyAtom);

    return {
        isLoading: isBatteryServiceConfigLoading || !keychain
    };
};
