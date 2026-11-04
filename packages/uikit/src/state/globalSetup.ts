import { useCheckMultisigsSigners } from './multisig';
import { useBatteryServiceConfigNonSuspense } from './battery';
import { useAtomValue } from '../libs/useAtom';
import { useAppSdk } from '../hooks/appSdk';
import { atom } from '@tonkeeper/core/dist/entries/atom';
import { KeychainSecurity } from '@tonkeeper/core/dist/AppSdk';

const emptyAtom = atom<KeychainSecurity>({});

export const useGlobalSetup = () => {
    useCheckMultisigsSigners();
    // pubkeys/_bulk sync intentionally not called — see pubkeysBulkSync.ts.
    // Android dropped it; web doesn't consume the response either (declared
    // "analytics only" but result never read). The generated client decoder
    // crashes on empty Wallets payloads, so removing the call removes the noise.
    // Warms the cache the suspense consumers read, without letting a failed
    // fetch (offline boot, battery outage) throw into the root render.
    const { isLoading: isBatteryServiceConfigLoading } = useBatteryServiceConfigNonSuspense();

    const sdk = useAppSdk();
    const keychain = useAtomValue(sdk.keychain?.security ?? emptyAtom);

    return {
        isLoading: isBatteryServiceConfigLoading || !keychain
    };
};
